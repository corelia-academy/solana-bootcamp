# Checkpoint 2 — Liquidity

Initial/subsequent LP shares và proportional withdrawal đã hoàn chỉnh. Final thêm swap constant-product hai chiều, fee và slippage guard.

## Mục tiêu state
Mint/burn LP shares theo reserve và supply.
## Phần đã có
Add/remove liquidity cùng math tests.
## Học viên cần làm
Swap hai chiều, fee, slippage và integration tests.
## Chạy và kiểm tra
`cargo fmt --all --check && cargo check && cargo test`
