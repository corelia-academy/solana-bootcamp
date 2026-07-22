# Final — AI Agent on Solana

## Mục tiêu state

Typed agent loop với deterministic policy, allowlist, amount/slippage limits, approval, kill switch, stale-state check, idempotency và audit log. Mock demo không cần API key, wallet hoặc Devnet.

`RoutedExecutionAdapter` chuyển vote/swap sang MCP và payment sang x402 bằng typed ports; `MemoryAuditStore` là local implementation của audit interface.

## Phần đã có

Deterministic loop, MCP/x402 adapters, session limits và audit store.

## Học viên cần làm

Chạy red-team tests và đối chiếu từng denied/approved path với audit entries.

## Chạy và kiểm tra

```bash
pnpm install && pnpm run check && pnpm test
pnpm demo
```
