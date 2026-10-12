import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

let client: Client | undefined;
afterEach(() => client?.close());

const connect = async (env: Record<string, string> = {}) => {
  client = new Client({ name: "mock-host", version: "1.0.0" });
  const command = process.execPath;
  const args = ["--import", "tsx", "src/server.ts"];
  await client.connect(new StdioClientTransport({ command, args, env }));
  return client;
};

describe("MCP server qua stdio", () => {
  it("liệt kê bốn tool", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "call_program",
      "get_account_balance",
      "get_token_holdings",
      "send_sol",
    ]);
  });

  it("trả structured content cho read tool", async () => {
    const result = await (await connect()).callTool({
      name: "get_account_balance",
      arguments: { address: "11111111111111111111111111111111" },
    });
    expect(result.structuredContent).toEqual({ result: { ok: true, data: { lamports: 1_000_000_000 } } });
  });

  it("schema chặn lamports âm trước khi vào core", async () => {
    const send = { recipient: "11111111111111111111111111111111", lamports: -1, idempotencyKey: "a" };
    const result = await (await connect()).callTool({ name: "send_sol", arguments: send });
    expect(result.isError).toBe(true);
  });

  it("authorized: true trong arguments không bật được quyền ghi", async () => {
    const send = { recipient: "11111111111111111111111111111111", lamports: 1, idempotencyKey: "a" };
    const result = await (await connect()).callTool({ name: "send_sol", arguments: { ...send, authorized: true } });
    expect(result.structuredContent).toMatchObject({ result: { error: { code: "UNAUTHORIZED" } } });
  });

  it("server bật quyền ghi bằng biến môi trường", async () => {
    const send = { recipient: "11111111111111111111111111111111", lamports: 1, idempotencyKey: "a" };
    const tools = await connect({ SOLANA_MCP_WRITE_ENABLED: "true" });
    const result = await tools.callTool({ name: "send_sol", arguments: send });
    expect(result.structuredContent).toEqual({ result: { ok: true, data: { signature: "mock-a" } } });
  });
});
