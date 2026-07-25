# Solana Security CTF

Bốn bài tập mô phỏng các lỗi bảo mật thường gặp trong chương trình Solana. Mỗi bài có thư mục `exercise` để thực hành và `solution` để đối chiếu sau khi hoàn thành.

## Cách học

1. Chỉ mở folder `exercise`.
2. Đọc tests và xác định invariant bị thiếu.
3. Viết exploit trong test để chứng minh lỗ hổng.
4. So sánh với `solution` sau khi hoàn thành. Trong bộ CTF gốc, `solution` là lời giải exploit, không phải secure patch.
5. Tự tạo thêm `secure-fix` hoặc patch source để exploit fail và regression test pass.

## Challenges

- [`missing-signer`](./missing-signer): account được tin là authority nhưng không bắt buộc ký.
- [`missing-authorization`](./missing-authorization): signer hợp lệ nhưng không phải authority của resource.
- [`missing-pda-validation`](./missing-pda-validation): program nhận account tùy ý thay vì PDA đúng seeds.
- [`missing-rent-cleanup`](./missing-rent-cleanup): close/cleanup không hoàn trả hoặc xử lý lamports đúng.

Mỗi challenge yêu cầu nộp: mô tả attack, transaction/accounts liên quan, patch, test regression và invariant sau khi sửa.

## Chạy challenge

LiteSVM test nạp program binary từ `target/deploy`, vì vậy cần build SBF trước:

```shell
cd missing-authorization/solution
cargo build-sbf
cargo test
```

Nếu chạy `cargo test` trước `cargo build-sbf`, test sẽ báo thiếu file `.so`; đó là lỗi setup artifact, không phải kết quả challenge.
