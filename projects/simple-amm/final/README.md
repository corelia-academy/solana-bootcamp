# Final — Simple AMM

## Mục tiêu state

Constant-product pool với cặp mint canonical, vault/LP mint do Pool PDA quản lý, add/remove liquidity, swap hai chiều, fee và slippage guards.

## Phần đã có

Bốn instructions, integer math tests và Anchor transaction tests.

## Học viên cần làm

Đối chiếu rounding, LP accounting, slippage rollback và vault constraints với bài làm.

## Chạy và kiểm tra

```bash
pnpm install
cargo fmt --all --check
cargo check
cargo test
pnpm run typecheck
pnpm test
```

`tests/simple-amm.ts` chạy transaction thật trên local validator cho pool initialization, liquidity, swap, slippage rollback, wrong vault và withdrawal.
Test runner tự tạo wallet tạm trong `target/`; không dùng hoặc ghi đè ví Solana cá nhân.
