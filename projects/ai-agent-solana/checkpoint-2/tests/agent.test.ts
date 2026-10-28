import { describe, expect, it, vi } from "vitest";
import { Agent, type Proposal } from "../src/agent.js";
const target = "Vote111111111111111111111111111111111111111";
const p: Proposal = {
  action: "vote",
  target,
  amount: 1n,
  slippageBps: 0,
  reason: "",
  idempotencyKey: "i",
  observationVersion: "v1",
};
describe("guarded execution", () => {
  it("execute once", async () => {
    const execute = vi.fn().mockResolvedValue({ status: "confirmed", signature: "sig" });
    const agent = new Agent(
      { observe: async () => ({ version: "v1", balances: {}, prompt: "", toolData: "" }) },
      { propose: async () => p },
      { execute },
      { request: async () => true },
      { append: async () => {} },
      { killSwitch: false, allowedTargets: new Set([target]), maxAmount: 10n, approvalAbove: 5n, maxSlippageBps: 10 },
    );
    expect(await agent.run()).toMatchObject({ status: "confirmed" });
    expect(await agent.run()).toMatchObject({ error: "DUPLICATE_ACTION" });
  });
});
