import { describe, expect, it, vi } from "vitest";
import { SolanaTools, type AuthPort, type RpcPort } from "../src/core.js";

const key = "11111111111111111111111111111111";
const rpc: RpcPort = {
  balance: vi.fn().mockResolvedValue(5),
  tokenHoldings: vi.fn().mockResolvedValue([]),
  simulate: vi.fn().mockResolvedValue(true),
  sendSol: vi.fn().mockResolvedValue("sig"),
  confirm: vi.fn().mockResolvedValue(undefined),
};
const policy = { allowedRecipients: new Set([key]), allowedPrograms: new Set([key]), maxLamportsPerAction: 100 };
const writeOn: AuthPort = { canWrite: () => true };
const writeOff: AuthPort = { canWrite: () => false };

describe("guarded writes", () => {
  it("deny khi server chưa bật quyền ghi", async () => {
    const tools = new SolanaTools(rpc, policy, writeOff);
    expect(await tools.sendSol({ recipient: key, lamports: 1, idempotencyKey: "a" })).toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("send/confirm", async () => {
    const tools = new SolanaTools(rpc, policy, writeOn);
    expect(await tools.sendSol({ recipient: key, lamports: 1, idempotencyKey: "a" })).toEqual({
      ok: true,
      data: { signature: "sig" },
    });
  });

  it("simulate allowlisted program", async () => {
    const tools = new SolanaTools(rpc, policy, writeOn);
    expect(await tools.callProgram({ program: key, instruction: "vote" })).toEqual({
      ok: true,
      data: { simulated: true },
    });
  });
});
