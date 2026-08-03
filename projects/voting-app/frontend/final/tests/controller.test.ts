import { describe, expect, it, vi } from "vitest";
import { voteAndRefresh } from "../src/controller";
import { explorerTransactionUrl } from "../src/explorer";
import type { VoteState, VotingClient, WalletPort } from "../src/domain";

const client = (overrides: Partial<VotingClient> = {}): VotingClient => ({
  listPolls: vi.fn().mockResolvedValue([]),
  vote: vi.fn().mockResolvedValue("sig-1"),
  confirm: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});
const connected: WalletPort = { connected: true, publicKey: "voter" };

async function run(c: VotingClient, wallet: WalletPort = connected): Promise<VoteState[]> {
  const states: VoteState[] = [];
  await voteAndRefresh({
    wallet,
    client: c,
    pollId: "1",
    candidateId: 0,
    setState: (s) => states.push(s),
    setPolls: () => {},
  });
  return states;
}

describe("voting frontend controller", () => {
  it("reject wallet disconnected", async () => {
    const c = client();
    const states = await run(c, { connected: false });
    expect(c.vote).not.toHaveBeenCalled();
    expect(states.at(-1)?.phase).toBe("error");
  });
  it("đi qua awaiting-signature, confirming rồi success", async () => {
    const states = await run(client());
    expect(states.map((s) => s.phase)).toEqual(["awaiting-signature", "confirming", "success"]);
    expect(states.at(-1)?.signature).toBe("sig-1");
  });
  it("confirm rồi mới refetch, refetch đúng một lần", async () => {
    const calls: string[] = [];
    const c = client({
      vote: vi.fn(async () => {
        calls.push("vote");
        return "sig";
      }),
      confirm: vi.fn(async () => {
        calls.push("confirm");
      }),
      listPolls: vi.fn(async () => {
        calls.push("refetch");
        return [];
      }),
    });
    await run(c);
    expect(calls).toEqual(["vote", "confirm", "refetch"]);
  });
  it("chữ ký bị từ chối: báo lỗi và không refetch", async () => {
    const c = client({ vote: vi.fn().mockRejectedValue(new Error("User rejected")) });
    const states = await run(c);
    expect(states.at(-1)).toMatchObject({ phase: "error", message: "User rejected" });
    expect(c.listPolls).not.toHaveBeenCalled();
  });
  it("confirmation thất bại: báo lỗi và không refetch", async () => {
    const c = client({ confirm: vi.fn().mockRejectedValue(new Error("Transaction lỗi")) });
    const states = await run(c);
    expect(states.at(-1)).toMatchObject({ phase: "error", message: "Transaction lỗi" });
    expect(c.listPolls).not.toHaveBeenCalled();
  });
  it("tạo Explorer URL theo cluster", () => {
    expect(explorerTransactionUrl("sig", "devnet")).toContain("cluster=devnet");
    expect(explorerTransactionUrl("sig", "localnet")).toContain("customUrl=http%3A%2F%2F127.0.0.1%3A8899");
    expect(explorerTransactionUrl("sig", "mainnet-beta")).not.toContain("cluster=");
  });
});
