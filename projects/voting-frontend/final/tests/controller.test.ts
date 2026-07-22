import { describe, expect, it, vi } from "vitest";
import { voteAndRefresh } from "../src/controller";
import { explorerTransactionUrl } from "../src/explorer";
import type { VoteState, VotingClient } from "../src/domain";

const client = (overrides: Partial<VotingClient> = {}): VotingClient => ({ listPolls: vi.fn().mockResolvedValue([]), vote: vi.fn().mockResolvedValue("sig-1"), confirm: vi.fn().mockResolvedValue(undefined), ...overrides });
describe("voting frontend controller", () => {
  it("reject wallet disconnected", async () => { const states: VoteState[]=[]; const c=client(); await voteAndRefresh({wallet:{connected:false},client:c,pollId:"1",candidateId:0,setState:s=>states.push(s),setPolls:()=>{}}); expect(c.vote).not.toHaveBeenCalled(); expect(states.at(-1)?.phase).toBe("error"); });
  it("confirm rồi mới refetch", async () => { const calls:string[]=[]; const c=client({vote:vi.fn(async()=>{calls.push("vote");return "sig"}),confirm:vi.fn(async()=>{calls.push("confirm")}),listPolls:vi.fn(async()=>{calls.push("refetch");return []})}); await voteAndRefresh({wallet:{connected:true,publicKey:"voter"},client:c,pollId:"1",candidateId:0,setState:()=>{},setPolls:()=>{}}); expect(calls).toEqual(["vote","confirm","refetch"]); });
  it("surface rejected signature/confirmation error và không refetch", async () => { const c=client({vote:vi.fn().mockRejectedValue(new Error("User rejected"))}); const states:VoteState[]=[]; await voteAndRefresh({wallet:{connected:true,publicKey:"voter"},client:c,pollId:"1",candidateId:0,setState:s=>states.push(s),setPolls:()=>{}}); expect(states.at(-1)).toMatchObject({phase:"error",message:"User rejected"}); expect(c.listPolls).not.toHaveBeenCalled(); });
  it("tạo Explorer URL theo cluster",()=>{expect(explorerTransactionUrl("sig","devnet")).toContain("cluster=devnet");expect(explorerTransactionUrl("sig","mainnet-beta")).not.toContain("cluster=");});
});
