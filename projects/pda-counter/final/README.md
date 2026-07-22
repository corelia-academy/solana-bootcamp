# PDA Counter — Final

## Mục tiêu state

Reference hoàn chỉnh sau khi học viên đã nộp bài.

## Phần đã có

Initialize, checked mutation, reset và authority/error tests.

## Học viên cần làm

Đối chiếu diff với bài làm và giải thích từng constraint trước khi xem source final.

## Chạy và kiểm tra

```shell
pnpm install
anchor build
pnpm test
```

Trước khi deploy, chạy `anchor keys sync` và kiểm tra program ID trong `declare_id!`/`Anchor.toml`.
Test runner dùng wallet tạm trong `target/`, không phụ thuộc ví cá nhân.
