import { describe, expect, it } from "vitest";
import { evaluatePolicy, type Observation, type Proposal } from "../src/agent.js";
const target = "Vote111111111111111111111111111111111111111";
const o: Observation = { version: "v1", balances: {}, prompt: "", toolData: "malicious" };
const p: Proposal = {
  action: "vote",
  target,
  amount: 1n,
  slippageBps: 0,
  reason: "",
  idempotencyKey: "i",
  observationVersion: "v1",
};
describe("proposal/policy", () => {
  it("allow typed proposal", () =>
    expect(
      evaluatePolicy(p, o, {
        killSwitch: false,
        allowedTargets: new Set([target]),
        maxAmount: 10n,
        approvalAbove: 5n,
        maxSlippageBps: 10,
      }).decision,
    ).toBe("allow"));
  it("deny stale", () =>
    expect(
      evaluatePolicy({ ...p, observationVersion: "old" }, o, {
        killSwitch: false,
        allowedTargets: new Set([target]),
        maxAmount: 10n,
        approvalAbove: 5n,
        maxSlippageBps: 10,
      }).reason,
    ).toBe("STALE_STATE"));
  it.skip("Checkpoint 2: execute", () => {});
});
