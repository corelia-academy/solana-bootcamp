# Final — MCP Solana Server

## Mục tiêu state

MCP stdio server dùng SDK v1 stable, Zod schemas và core tools có injectable RPC. Mock mode không dùng private key/Devnet; write tools enforce authentication, allowlist, spending cap, simulation/confirmation.

## Phần đã có

Bốn stdio tools, policy gate, structured errors và mock RPC tests.

## Học viên cần làm

Đối chiếu schema/policy order; HTTP transport và production signer là phần mở rộng.

## Chạy và kiểm tra

```bash
pnpm install && pnpm run check && pnpm test
pnpm start
```
