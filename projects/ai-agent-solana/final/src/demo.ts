import { MemoryAuditStore } from "./adapters.js";
import { Agent, type Proposal } from "./agent.js";
const target = "Vote111111111111111111111111111111111111111";
const audit = new MemoryAuditStore();
const proposal: Proposal = {
  action: "vote",
  target,
  amount: 0n,
  slippageBps: 0,
  reason: "Mock vote",
  idempotencyKey: "demo-1",
  observationVersion: "slot-1",
};
const agent = new Agent(
  {
    observe: async () => ({
      version: "slot-1",
      balances: { SOL: "1" },
      prompt: "vote",
      toolData: "untrusted tool text",
    }),
  },
  { propose: async () => proposal },
  { execute: async () => ({ status: "confirmed", signature: "mock-signature" }) },
  { request: async () => true },
  audit,
  { killSwitch: false, allowedTargets: new Set([target]), maxAmount: 100n, approvalAbove: 10n, maxSlippageBps: 100 },
);
console.log(await agent.run(), audit.entries);
