# Final — MCP Solana Server

## Mục tiêu state

MCP stdio server dùng SDK v1 stable, Zod schemas và core tools có injectable RPC. Mock mode không dùng private key/Devnet; write tools chỉ chạy khi server bật quyền ghi (`AuthPort`), rồi enforce allowlist, spending cap, simulation/confirmation.

## Phần đã có

Bốn stdio tools, policy gate, structured errors, mock RPC tests (`tests/core.test.ts`) và mock-client tests chạy server qua stdio bằng MCP client thật (`tests/server.test.ts`).

## Học viên cần làm

Đối chiếu schema/policy order; HTTP transport và production signer là phần mở rộng.

## Chạy và kiểm tra

```bash
pnpm install && pnpm run check && pnpm test
pnpm start                               # chỉ đọc
SOLANA_MCP_WRITE_ENABLED=true pnpm start # bật write tools (mock)
```

Khi một MCP client đọc stdout (Inspector, host, test), chạy `pnpm --silent start`: không có `--silent`, pnpm in banner `> ... start` ra stdout và chen vào luồng JSON-RPC.
