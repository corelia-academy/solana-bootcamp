# Nội dung bài học — Module 7

## 7.1 Mint account

Mint định nghĩa một token: decimals, supply, mint authority và freeze authority. Mint không lưu balance từng user.

## 7.2 Token account

Token account gắn với đúng một mint và một owner/authority, lưu amount. Wallet có thể sở hữu nhiều token accounts.

## 7.3 Associated Token Account

ATA là địa chỉ token account chuẩn derive từ owner, token program và mint. Client phải kiểm tra cluster và token program đúng.

## 7.4 Authorities

Mint authority tạo supply mới; freeze authority đóng băng token account. `None` là revoke không đảo ngược theo thiết kế chuẩn.

## 7.5 Create mint

Tạo mint với decimals có chủ ý, payer và authorities rõ ràng. Ghi lại address và Explorer link.

## 7.6 Mint token

Chỉ mint authority ký. Dùng raw amount theo decimals và kiểm tra destination ATA thuộc đúng mint.

## 7.7 Transfer

Transfer thay đổi hai token accounts; wallet lamports không phải token balance. Ưu tiên checked transfer với mint/decimals.

## 7.8 Burn

Burn giảm token account amount và total supply, yêu cầu owner/delegate phù hợp.

## 7.9 Token UI

UI format raw amount theo decimals, hiển thị mint rút gọn, loading/error/empty states và Explorer link.

## 7.10 Tests

Test đúng mint/owner/authority, wrong mint, unauthorized mint/burn, insufficient funds và supply conservation.

## Project

Làm [SPL Token Basics](../../projects/token-basics/README.md) và giải thích sơ đồ [SPL Token](../../notes/spl-token.md).

## Schema và authority

Mint lưu decimals, supply, mint authority và freeze authority. Token Account lưu mint, owner và amount; ATA chỉ là địa chỉ chuẩn hóa cho cặp owner/mint. “Owner của token” khác với owner program của account.

## Luồng client lab

1. Tạo mint 6 decimals và hai ATA của Alice/Bob.
2. Chuyển UI amount sang base units bằng `bigint`, không dùng float.
3. Mint 100 token cho Alice bằng `mintToChecked`.
4. Chuyển 25 token sang Bob bằng `transferChecked`.
5. Burn 5 token, đọc lại balances/supply và thu hồi mint authority.
6. Giải thích khi nào freeze authority nên là `null`.

## Invariant và test matrix

Mọi thao tác phải validate đúng mint, authority và decimals. Test amount precision vượt decimals, unauthorized mint/burn, wrong owner, wrong mint và supply bằng tổng balances. Client phải phân biệt lỗi RPC, lỗi chữ ký và lỗi Token Program.

## Hoàn thành module khi

Lab final cho kết quả Alice 75, Bob 20, supply 95; unit tests amount xanh; mint authority đã được thu hồi và không có UI requirement trước Module 9.
