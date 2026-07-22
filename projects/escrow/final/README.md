# Final — Escrow an toàn

## Mục tiêu state

Hoàn chỉnh `make`, `take`, `refund`, PDA signer, vault ATA và đóng account. Account constraints khóa maker, hai mint, token authority và token program trước mọi CPI.

## Phần đã có

Ba instructions, integration tests và security invariants.

## Học viên cần làm

Đối chiếu account constraints, CPI order và close behavior với bài làm.

## Chạy và kiểm tra

```bash
cargo fmt --all --check
cargo check
# Với đúng toolchain của khóa học:
pnpm install
anchor test
```

`tests/escrow.ts` có 5 integration tests: make, take kèm token donation, refund, invalid input và unauthorized refund.

## Kỳ vọng bảo mật

- amount bằng 0 và hai mint giống nhau bị từ chối;
- taker không thể thay maker receive account, mint hay vault;
- chỉ maker đúng PDA seeds mới refund được;
- `take` và `refund` đóng vault lẫn state, nên không thể replay.
- token gửi thêm ngoài ý muốn vào vault không thể chặn close; program chuyển toàn bộ `vault.amount`.
