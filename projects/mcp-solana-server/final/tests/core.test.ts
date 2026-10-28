import { describe, expect, it, vi } from "vitest";
import { SolanaTools, type AuthPort, type RpcPort } from "../src/core.js";

const key = "11111111111111111111111111111111";
const other = "Vote111111111111111111111111111111111111111";

const rpc = (overrides: Partial<RpcPort> = {}): RpcPort => ({
  balance: vi.fn().mockResolvedValue(5),
  tokenHoldings: vi.fn().mockResolvedValue([{ mint: key, amount: "1" }]),
  simulate: vi.fn().mockResolvedValue(true),
  sendSol: vi.fn().mockResolvedValue("sig"),
  confirm: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const writeOn: AuthPort = { canWrite: () => true };
const writeOff: AuthPort = { canWrite: () => false };

const make = (r = rpc(), auth: AuthPort = writeOn) =>
  new SolanaTools(r, { allowedRecipients: new Set([key]), allowedPrograms: new Set([key]), maxLamportsPerAction: 100 }, auth);

describe("Solana MCP tools", () => {
  it("validate key và bound holdings", async () => {
    expect((await make().getAccountBalance("bad")).ok).toBe(false);
    expect((await make().getTokenHoldings(key, 101)).ok).toBe(false);
  });

  it("RPC error structured/retryable", async () => {
    const tools = make(rpc({ balance: vi.fn().mockRejectedValue(new Error()) }));
    expect(await tools.getAccountBalance(key)).toMatchObject({
      ok: false,
      error: { code: "RPC_TIMEOUT", retryable: true },
    });
  });

  it("quyền ghi do server quyết định, không đọc từ tool input", async () => {
    const r = rpc();
    // Dù caller cố nhét `authorized: true`, server tắt quyền ghi thì vẫn bị chặn và RPC không được gọi.
    const input = { recipient: key, lamports: 1, idempotencyKey: "a", authorized: true } as never;
    expect(await make(r, writeOff).sendSol(input)).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    expect(r.sendSol).not.toHaveBeenCalled();
  });

  it("deny recipient và cap", async () => {
    expect(await make().sendSol({ recipient: other, lamports: 1, idempotencyKey: "a" })).toMatchObject({
      error: { code: "NOT_ALLOWED" },
    });
    expect(await make().sendSol({ recipient: key, lamports: 101, idempotencyKey: "a" })).toMatchObject({
      error: { code: "LIMIT_EXCEEDED" },
    });
  });

  it("send và confirm success", async () => {
    expect(await make().sendSol({ recipient: key, lamports: 10, idempotencyKey: "a" })).toEqual({
      ok: true,
      data: { signature: "sig" },
    });
  });

  it("program write cần quyền ghi phía server", async () => {
    expect(await make(rpc(), writeOff).callProgram({ program: key, instruction: "vote" })).toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("program allowlist, simulation và success", async () => {
    expect(await make().callProgram({ program: other, instruction: "vote" })).toMatchObject({
      error: { code: "NOT_ALLOWED" },
    });
    expect(
      await make(rpc({ simulate: vi.fn().mockResolvedValue(false) })).callProgram({ program: key, instruction: "vote" }),
    ).toMatchObject({ error: { code: "SIMULATION_FAILED" } });
    expect(await make().callProgram({ program: key, instruction: "vote" })).toEqual({
      ok: true,
      data: { simulated: true },
    });
  });
});
