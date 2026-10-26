# Secure Treasury — Checkpoint 2

## Mục tiêu state

Hết code-along Bước 5: `withdraw` 2-trên-3 đã vá hai lỗ hổng — vault phải là PDA của đúng treasury, hai approver phải khác nhau — và giữ lại tiền rent.

## Phần đã có

`withdraw` với `seeds`/`bump = treasury.vault_bump`, `constraint` chống approver trùng, `checked_sub` + `minimum_balance`; test tấn công treasury giả, chữ ký trùng và rút quá số dư.

## Học viên cần làm

Tiếp [code-along Bước 6](../../../curriculum/module-18-security/code-along.md#treasury-6): công tắc tạm dừng, rồi client production ở Bước 7.

## Chạy và kiểm tra

```shell
pnpm install
anchor keys sync
anchor build
anchor test
```

Kết quả mong đợi: `6 passing`.
