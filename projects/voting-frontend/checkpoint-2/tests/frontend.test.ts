import { describe, expect, it, vi } from "vitest";
import { voteAndRefresh } from "../src/controller";
import type { VoteState, VotingClient } from "../src/domain";
const client = (): VotingClient => ({
  listPolls: vi.fn().mockResolvedValue([]),
  vote: vi.fn().mockResolvedValue("sig"),
  confirm: vi.fn().mockResolvedValue(undefined),
});
describe("checkpoint 2", () => {
  it("wallet disconnected", async () => {
    const c = client(),
      states: VoteState[] = [];
    await voteAndRefresh({
      wallet: { connected: false },
      client: c,
      pollId: "1",
      candidateId: 0,
      setState: (s) => states.push(s),
      setPolls: () => {},
    });
    expect(c.vote).not.toHaveBeenCalled();
  });
  it("confirm/refetch", async () => {
    const c = client();
    await voteAndRefresh({
      wallet: { connected: true, publicKey: "v" },
      client: c,
      pollId: "1",
      candidateId: 0,
      setState: () => {},
      setPolls: () => {},
    });
    expect(c.confirm).toHaveBeenCalledWith("sig");
    expect(c.listPolls).toHaveBeenCalled();
  });
});
