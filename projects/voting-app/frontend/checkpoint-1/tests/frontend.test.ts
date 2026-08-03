import { describe, expect, it, vi } from "vitest";
import { loadPolls } from "../src/load";
import { explorerTransactionUrl } from "../src/explorer";
describe("checkpoint 1", () => {
  it("load/empty state", async () => {
    const result = await loadPolls({ listPolls: vi.fn().mockResolvedValue([]), vote: vi.fn(), confirm: vi.fn() });
    expect(result.polls).toEqual([]);
  });
  it("cluster URL", () => expect(explorerTransactionUrl("sig", "devnet")).toContain("devnet"));
  it.skip("Checkpoint 2: vote state machine", () => {});
});
