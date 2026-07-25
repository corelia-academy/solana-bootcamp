# Thiếu xử lý rent khi đóng account

Piggy program được thiết kế để chỉ PDA derive từ caller có thể rút SOL sau một khoảng thời gian.

Program đang có lỗi trong quá trình xử lý account. Hãy tìm cách lấy SOL khỏi PDA.

## Nhiệm vụ

Viết exploit trong [`exercise/tests/test.rs`](./exercise/tests/test.rs).

## Build

```shell
cargo build-sbf
```

## Kiểm thử

Exploit thành công khi test chạy xanh.

```shell
cargo test -- --nocapture
```
