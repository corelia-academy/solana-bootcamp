import { describe, expect, it } from "vitest";
import { withTransaction } from "../src/db.ts";
import { backfill, fetchEvents } from "../src/ingest.ts";
import { CHECKPOINT, getCheckpoint, saveEvents } from "../src/store.ts";
import { useTestPool } from "./db.ts";
import { FakeChain } from "./fake-chain.ts";
import { voteLog, voteTx } from "./fixtures.ts";

const db = useTestPool();

describe("backfill", () => {
  it("chỉ lấy transaction mới sau checkpoint và bỏ transaction lỗi", async () => {
    const chain = new FakeChain();
    chain.add(voteTx("a1", 100, voteLog(1, 1)));
    chain.add(voteTx("a2", 101, voteLog(2, 1)), { InstructionError: [0, "Custom"] });
    expect(await backfill(chain.asConnection(), db.pool)).toBe(1);
    expect(await getCheckpoint(db.pool, CHECKPOINT)).toEqual({ signature: "a2", slot: 101 });

    chain.add(voteTx("a3", 102, voteLog(2, 2)));
    expect(await backfill(chain.asConnection(), db.pool)).toBe(1);
    expect(await backfill(chain.asConnection(), db.pool)).toBe(0);
  });

  it("event realtime đã lưu thì backfill chồng lấn không tạo bản trùng", async () => {
    const chain = new FakeChain();
    chain.add(voteTx("b1", 200, voteLog(1, 1)));
    const live = await fetchEvents(chain.asConnection(), "b1");
    await withTransaction(db.pool, (client) => saveEvents(client, live));
    expect(await backfill(chain.asConnection(), db.pool)).toBe(0);
  });
});
