import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "../src/api.ts";
import { withTransaction } from "../src/db.ts";
import { decodeVoteEvents } from "../src/decode.ts";
import { CHECKPOINT, saveEvents, setCheckpoint } from "../src/store.ts";
import { useTestPool } from "./db.ts";
import { candidates, poll, voteLog, voteTx } from "./fixtures.ts";

const db = useTestPool();
let server: Server;
let base: string;

beforeAll(async () => {
  const txs = [voteTx("s1", 1, voteLog(1, 1)), voteTx("s2", 2, voteLog(2, 1)), voteTx("s3", 3, voteLog(2, 2))];
  await withTransaction(db.pool, async (client) => {
    for (const tx of txs) await saveEvents(client, decodeVoteEvents(tx));
    await setCheckpoint(client, CHECKPOINT, { signature: "s3", slot: 3 });
  });
  server = createApi(db.pool).listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}/polls/${poll.toBase58()}`;
});
afterAll(() => {
  server.close();
});

describe("REST API", () => {
  it("leaderboard xếp theo số phiếu và báo indexedSlot", async () => {
    const body = await (await fetch(`${base}/leaderboard`)).json();
    expect(body.indexedSlot).toBe(3);
    expect(body.items).toEqual([
      { candidate: candidates[1].toBase58(), candidateId: 2, votes: 2 },
      { candidate: candidates[0].toBase58(), candidateId: 1, votes: 1 },
    ]);
  });

  it("phân trang votes bằng cursor, mới nhất trước", async () => {
    const first = await (await fetch(`${base}/votes?limit=2`)).json();
    expect(first.items.map((vote: { slot: number }) => vote.slot)).toEqual([3, 2]);
    const second = await (await fetch(`${base}/votes?limit=2&cursor=${first.nextCursor}`)).json();
    expect(second.items.map((vote: { slot: number }) => vote.slot)).toEqual([1]);
    expect(second.nextCursor).toBeNull();
  });

  it("từ chối limit, cursor và poll không hợp lệ", async () => {
    expect((await fetch(`${base}/votes?limit=101`)).status).toBe(400);
    expect((await fetch(`${base}/votes?cursor=abc`)).status).toBe(400);
    expect((await fetch(`${base.replace(poll.toBase58(), "khong-hop-le")}/votes`)).status).toBe(400);
  });
});
