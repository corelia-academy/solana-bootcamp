# Secure Treasury — Checkpoint 1

## Mục tiêu state

Hết code-along Bước 2: `initialize` tạo Treasury PDA `['treasury', admin]` và Vault PDA `['vault', treasury]` bằng `init`.

## Phần đã có

Handler và accounts của `initialize`; helper `findTreasury`, `findVault`, `fund`; test khởi tạo và test chặn khởi tạo lại.

## Học viên cần làm

Tiếp [code-along Bước 3](../../../curriculum/module-18-security/code-along.md#treasury-3): viết `withdraw` bản ngây thơ, rồi tấn công và vá ở Bước 4–5.

## Chạy và kiểm tra

```shell
pnpm install
anchor keys sync
anchor build
anchor test
```

Kết quả mong đợi: `2 passing`.
