# Checkpoint 1 — Pool initialization

Đã khóa cặp mint canonical, kiểm tra fee tier và tạo Pool PDA, vault A/B, LP mint, locked LP account. Tiếp theo implement proportional liquidity.

## Mục tiêu state
Khởi tạo đúng Pool PDA, vault ATAs và LP mint.
## Phần đã có
Canonical mint order và initialize flow.
## Học viên cần làm
Initial/subsequent liquidity shares: khóa `MINIMUM_LIQUIDITY` lần đầu, lần sau chỉ chuyển phần đúng tỷ lệ (`deposit_amounts`).
## Chạy và kiểm tra
`cargo fmt --all --check && cargo check && cargo test`
