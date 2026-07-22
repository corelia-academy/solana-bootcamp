# Checkpoint 1 — Make và vault funding

`make` đã validate amount/mint, lưu state và chuyển token A vào vault ATA bằng `transfer_checked`. Tiếp theo hoàn thiện settlement hai chiều trong `take`.

Test `make` và input validation được bật; test `take/refund` vẫn được đánh dấu `skip`.

## Mục tiêu state
Khóa đúng token A trong vault do Escrow PDA kiểm soát.
## Phần đã có
`make`, vault funding và input validation tests.
## Học viên cần làm
Atomic settlement trong `take`.
## Chạy và kiểm tra
`pnpm install && anchor build && anchor test`
