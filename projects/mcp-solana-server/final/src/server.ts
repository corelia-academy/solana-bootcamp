import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SolanaTools, type AuthPort, type RpcPort } from "./core.js";

const demoKey = "11111111111111111111111111111111";
const mockRpc: RpcPort = {
  balance: async () => 1_000_000_000,
  tokenHoldings: async () => [],
  simulate: async () => true,
  sendSol: async (_recipient, _lamports, key) => `mock-${key}`,
  confirm: async () => {},
};
// Quyền ghi là config của server do người chạy host (Claude Desktop, IDE...) bật,
// không phải tham số tool mà model có thể tự điền.
// Ví dụ: SOLANA_MCP_WRITE_ENABLED=true pnpm start
const writeEnabled = process.env.SOLANA_MCP_WRITE_ENABLED === "true";
const auth: AuthPort = { canWrite: () => writeEnabled };
const tools = new SolanaTools(
  mockRpc,
  {
    allowedRecipients: new Set([demoKey]),
    allowedPrograms: new Set([demoKey]),
    maxLamportsPerAction: 10_000_000,
  },
  auth,
);
const server = new McpServer({ name: "solana-bootcamp", version: "1.0.0" });
const output = (result: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(result) }],
  structuredContent: { result },
});

server.registerTool(
  "get_account_balance",
  { description: "Đọc SOL balance", inputSchema: { address: z.string() } },
  async ({ address }) => output(await tools.getAccountBalance(address)),
);
server.registerTool(
  "get_token_holdings",
  {
    description: "Đọc token holdings có giới hạn",
    inputSchema: {
      address: z.string(),
      limit: z.number().int().min(1).max(100).optional(),
    },
  },
  async ({ address, limit }) =>
    output(await tools.getTokenHoldings(address, limit)),
);
server.registerTool(
  "send_sol",
  {
    description: "Gửi SOL trong mock mode. Chỉ chạy khi server bật quyền ghi; có allowlist và cap",
    inputSchema: {
      recipient: z.string(),
      lamports: z.number().int().positive(),
      idempotencyKey: z.string().min(1),
    },
  },
  async (input) => output(await tools.sendSol(input)),
);
server.registerTool(
  "call_program",
  {
    description: "Mô phỏng program instruction sau policy gate. Chỉ chạy khi server bật quyền ghi",
    inputSchema: {
      program: z.string(),
      instruction: z.string().min(1),
    },
  },
  async (input) => output(await tools.callProgram(input)),
);
await server.connect(new StdioServerTransport());
