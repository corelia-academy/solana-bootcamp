import { createServer, type ServerResponse } from "node:http";
import type pg from "pg";
import { indexedSlot, leaderboard, listVotes, type Cursor } from "./queries.ts";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseCursor(raw: string | null): Cursor | undefined | "invalid" {
  if (raw === null) return undefined;
  const match = raw.match(/^(\d+):([1-9A-HJ-NP-Za-km-z]+):(\d+)$/);
  if (!match) return "invalid";
  return { slot: Number(match[1]), signature: match[2], eventIndex: Number(match[3]) };
}

export function createApi(pool: pg.Pool) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const route = url.pathname.match(/^\/polls\/([^/]+)\/(leaderboard|votes)$/);
    if (req.method !== "GET" || !route) return send(res, 404, { error: "NOT_FOUND" });
    const [, poll, view] = route;
    if (!ADDRESS.test(poll)) return send(res, 400, { error: "INVALID_POLL" });
    try {
      const freshness = { indexedSlot: await indexedSlot(pool) };
      if (view === "leaderboard") {
        return send(res, 200, { ...freshness, items: await leaderboard(pool, poll) });
      }
      const limit = Number(url.searchParams.get("limit") ?? "20");
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) return send(res, 400, { error: "INVALID_LIMIT" });
      const cursor = parseCursor(url.searchParams.get("cursor"));
      if (cursor === "invalid") return send(res, 400, { error: "INVALID_CURSOR" });
      const items = await listVotes(pool, poll, limit, cursor);
      const last = items.at(-1);
      const nextCursor = items.length === limit && last ? `${last.slot}:${last.signature}:${last.eventIndex}` : null;
      return send(res, 200, { ...freshness, items, nextCursor });
    } catch (error) {
      console.error(error);
      return send(res, 500, { error: "INTERNAL" });
    }
  });
}
