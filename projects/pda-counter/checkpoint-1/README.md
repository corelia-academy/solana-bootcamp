# PDA Counter — Checkpoint 1

Đã hoàn thành state account, PDA constraints và `initialize`. Dùng checkpoint này nếu bị kẹt trước phần mutation.

Tiếp theo: checked increment/decrement, underflow error và tests.

## Mục tiêu state
Khởi tạo Counter tại PDA deterministic.
## Phần đã có
State, seeds, space và `initialize`.
## Học viên cần làm
Thêm mutation bằng checked math và failure tests.
## Chạy và kiểm tra
`pnpm install && anchor keys sync && anchor build && anchor test`
