# Thiếu kiểm tra signer

Oracle program được thiết kế để chỉ chủ sở hữu oracle account có thể cập nhật giá.

Program đang có lỗi. Hãy tìm cách cập nhật giá khi chủ sở hữu không ký transaction.

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
