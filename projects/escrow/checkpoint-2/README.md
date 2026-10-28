# Checkpoint 2 — Atomic take

`make` và `take` đã hoàn chỉnh. `take` chuyển token B trước, ký bằng Escrow PDA để release token A, rồi đóng vault/state trong cùng transaction. Bước cuối là `refund` chỉ dành cho maker.

Test `make`, `take`, token donation và input validation được bật; hai test `refund` sẽ mở ở final.

## Mục tiêu state
Settlement nguyên tử và đóng state/vault.
## Phần đã có
`make`, `take` và donation handling tests.
## Học viên cần làm
Maker-only refund và replay-after-close coverage.
## Chạy và kiểm tra
`pnpm install && anchor keys sync && anchor build && anchor test`
