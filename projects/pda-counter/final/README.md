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
anchor keys sync   # Anchor 1.x: đồng bộ Program ID trước khi build
anchor build
pnpm test
```

`anchor keys sync` ghi Program ID của keypair trong `target/deploy` vào `declare_id!` và `Anchor.toml`; Anchor 1.x không build khi hai giá trị lệch nhau.
Test runner dùng wallet tạm trong `target/`, không phụ thuộc ví cá nhân.
