# Final — Stablecoin Lite

## Mục tiêu state

Config PDA là mint authority; admin quản lý minter allowance và pause, minter mint trong allowance/cap, holder tự burn. Freeze/force-transfer không được bật.

## Phần đã có

Năm instructions, logic tests và Anchor transaction tests.

## Học viên cần làm

Đối chiếu role, allowance/cap accounting và rollback behavior với bài làm.

## Chạy và kiểm tra

```bash
pnpm install
cargo fmt --all --check
cargo check
pnpm run typecheck
pnpm test
```

Đây là protocol giáo dục, không phải stablecoin production và không có collateral/oracle/redemption.

`tests/stablecoin-lite.ts` chạy transaction thật trên local validator cho admin/minter, pause rollback, allowance/cap, wrong mint và holder burn.
Test runner tự tạo wallet tạm trong `target/`; không dùng hoặc ghi đè ví Solana cá nhân.
