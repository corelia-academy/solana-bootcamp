# Solana Security CTF

Bốn bài tập mô phỏng các lỗi bảo mật thường gặp trong chương trình Solana. Mỗi program native nhỏ (dùng `solana-program` + LiteSVM) có một lỗ hổng cài sẵn. Mỗi bài có thư mục `exercise` để thực hành và `solution` để đối chiếu sau khi hoàn thành.

## Cách học

1. Chỉ mở folder `exercise`.
2. Đọc source program và test, xác định invariant bị thiếu.
3. Viết exploit trong test để chứng minh lỗ hổng; test xanh là khai thác thành công.
4. So sánh với `solution` sau khi hoàn thành. `solution` chứa lời giải exploit, không phải bản vá.
5. Tự patch source để exploit fail và regression test pass, rồi đối chiếu mục "Gợi ý bản vá" trong README của từng bài.

Mỗi bài yêu cầu nộp: mô tả attack, transaction/accounts liên quan, patch, test regression và invariant sau khi sửa.

## Challenges

- [`course-registry`](./course-registry): account được tin là authority nhưng không bắt buộc ký.
- [`scoreboard`](./scoreboard): signer hợp lệ nhưng không phải authority của resource.
- [`savings-vault`](./savings-vault): program nhận account tùy ý thay vì PDA đúng seeds.
- [`ticket-refund`](./ticket-refund): dọn account không chừa rent-exempt reserve.

## Chạy challenge

LiteSVM test nạp program binary từ `target/deploy`, vì vậy cần build SBF trước:

```shell
cd course-registry/solution
cargo build-sbf
cargo test
```

Nếu chạy `cargo test` trước `cargo build-sbf`, test sẽ báo thiếu file `.so`; đó là lỗi setup artifact, không phải kết quả challenge.
