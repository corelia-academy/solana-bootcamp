import { describe, expect, it } from "vitest";
import { withTransaction } from "../src/db.ts";
import { decodeVoteEvents } from "../src/decode.ts";
import { getCheckpoint, saveEvents, setCheckpoint } from "../src/store.ts";
import { useTestPool } from "./db.ts";
import { voteLog, voteTx } from "./fixtures.ts";

const db = useTestPool();

describe("store", () => {
  it("nhận trùng một event chỉ lưu một dòng", async () => {
    const events = decodeVoteEvents(voteTx("dup", 20, voteLog(1, 1)));
    const first = await withTransaction(db.pool, (client) => saveEvents(client, events));
    const again = await withTransaction(db.pool, (client) => saveEvents(client, events));
    expect([first, again]).toEqual([1, 0]);
  });

  it("checkpoint không lùi khi slot cũ đến sau", async () => {
    await withTransaction(db.pool, (client) => setCheckpoint(client, "test", { signature: "b", slot: 30 }));
    await withTransaction(db.pool, (client) => setCheckpoint(client, "test", { signature: "a", slot: 25 }));
    expect(await getCheckpoint(db.pool, "test")).toEqual({ signature: "b", slot: 30 });
  });

  it("lỗi giữa chừng thì không lưu event lẫn checkpoint", async () => {
    const events = decodeVoteEvents(voteTx("rollback", 40, voteLog(1, 1)));
    const work = withTransaction(db.pool, async (client) => {
      await saveEvents(client, events);
      await setCheckpoint(client, "rollback", { signature: "rollback", slot: 40 });
      throw new Error("RPC timeout");
    });
    await expect(work).rejects.toThrow("RPC timeout");
    expect(await getCheckpoint(db.pool, "rollback")).toBeNull();
    const { rows } = await db.pool.query("SELECT count(*) AS n FROM vote_events WHERE signature = 'rollback'");
    expect(rows[0].n).toBe(0);
  });
});
