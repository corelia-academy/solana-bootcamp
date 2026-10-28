# PDA Counter — Starter

## Mục tiêu state

Điểm bắt đầu của học viên. Workspace compile được nhưng handlers chứa TODO.

## Phần đã có

Anchor workspace, Counter schema, PDA contexts và test contract.

## Học viên cần làm

1. Hoàn thiện `initialize`.
2. Chạy test đầu tiên.
3. Hoàn thiện `increment`, `decrement`, `reset`.
4. Bỏ `skip` và bổ sung error tests.

## Chạy và kiểm tra

```shell
pnpm install
anchor keys sync   # Anchor 1.x: đồng bộ Program ID trước khi build
anchor build
anchor test
```
