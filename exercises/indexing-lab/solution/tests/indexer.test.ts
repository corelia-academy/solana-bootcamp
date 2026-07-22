import { describe, expect, it } from "vitest";
import { VoteEventStore, type VoteEvent } from "../src/indexer.js";

const event = (signature: string, slot: number, logIndex = 0): VoteEvent => ({ signature, slot, logIndex, poll: "poll-1", voter: `voter-${signature}`, candidateId: 1 });

describe("vote event indexer", () => {
  it("ingest idempotently và chỉ advance checkpoint sau success", () => {
    const store = new VoteEventStore();
    expect(store.ingest(event("a", 10))).toBe("inserted");
    expect(store.ingest(event("a", 10))).toBe("duplicate");
    expect(store.checkpoint()).toBe(10);
    expect(store.list().items).toHaveLength(1);
  });

  it("chấp nhận delivery out-of-order nhưng checkpoint không lùi", () => {
    const store = new VoteEventStore();
    store.ingest(event("new", 20)); store.ingest(event("old", 12));
    expect(store.checkpoint()).toBe(20);
    expect(store.list().items.map((item) => item.slot)).toEqual([12, 20]);
  });

  it("phân trang bounded", () => {
    const store = new VoteEventStore();
    store.ingest(event("a", 1)); store.ingest(event("b", 2)); store.ingest(event("c", 3));
    const first = store.list(2); const second = store.list(2, first.nextCursor);
    expect(first.items).toHaveLength(2); expect(second.items).toHaveLength(1);
    expect(() => store.list(101)).toThrow("INVALID_LIMIT");
  });
});
