# Checkpoint 2 — Exact settlement

Verifier kiểm tra confirmed transaction, network, asset, amount, recipient và memo. Final bổ sung replay store, timeout và concurrency.

## Mục tiêu state
Phân biệt signature string với proof đã settlement.
## Phần đã có
Exact confirmed-settlement verifier.
## Học viên cần làm
Thêm replay store, retryable timeout và concurrent-request safety.
## Chạy và kiểm tra
`pnpm install && pnpm run check && pnpm test`
