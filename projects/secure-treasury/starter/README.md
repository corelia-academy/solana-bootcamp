# Secure Treasury — Starter

## Mục tiêu state

Hết code-along Bước 1: khung program `treasury` với hai account `Treasury` (admin, ba approver, công tắc `paused`, hai bump) và `Vault`; khung test chưa có test nào.

## Phần đã có

`Treasury`, `impl Treasury::is_approver`, `Vault`; `tests/treasury.ts` có provider, program và các keypair admin/alice/bob/carol.

## Học viên cần làm

Bắt đầu từ [code-along Bước 2](../../../curriculum/module-18-security/code-along.md#treasury-2): viết `initialize` với hai PDA, rồi test khởi tạo và khởi tạo lại.

## Chạy và kiểm tra

```shell
pnpm install
anchor keys sync
anchor build
anchor test
```

Build có cảnh báo `unused import` cho `use super::*`; `anchor test` ra `0 passing`.
