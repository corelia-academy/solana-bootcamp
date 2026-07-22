# Module 5: Hệ thống kiểm thử Solana

## Kết quả đầu ra

Chọn và triển khai đúng tầng test cho pure logic, account constraints và transaction behavior.

## Điều kiện tiên quyết

- Hoàn thành Module 4 và chạy được PDA Counter.
- Biết derive PDA, gọi Anchor method và fetch account.
- Dùng đúng toolchain ghi trong [hướng dẫn setup](../../docs/setup.md).

## Bài học

Đọc [nội dung chi tiết từng lesson](./lessons.md).

1. So sánh Anchor TS, Rust unit, LiteSVM và local validator
2. Cấu trúc thư mục test tiêu chuẩn
3. Anchor integration test cơ bản
4. LiteSVM test đầu tiên
5. Account/wallet fixtures
6. Assert custom error
7. Transaction logs và debugging
8. GitHub Actions CI cơ bản

## Tài liệu thực hành

- [Project mẫu: kiểm thử PDA Counter từ Module 4](./lab/README.md)
- [Nội dung đầy đủ và code mẫu](./lessons.md)
- [Test matrix cho PDA Counter](./test-matrix.md)
- [Debug worksheet](./debug-worksheet.md)

## Code lab đang có trong repo

- [PDA Counter tests](../../projects/pda-counter/final/tests/pda-counter.ts): state transition và error cases.
- [Security CTF](../../exercises/security-ctf/README.md): viết regression test sau khi vá lỗ hổng.

### Preview sau Module 6

Các test dưới đây dùng domain chưa học ở thời điểm Module 5; chỉ quay lại tham khảo sau khi hoàn thành module tương ứng:

- [Voting App tests](../../projects/voting-app/final/tests/voting.ts).
- [SPL Token unit tests](../../projects/token-basics/final/tests/amounts.test.ts).
- [Escrow integration tests](../../projects/escrow/final/tests/escrow.ts).

Tham khảo thêm [chiến lược testing](../../notes/testing.md).

## Hoàn thành module khi

- điền đủ test matrix;
- chạy được test happy path và failure path;
- chứng minh state không đổi sau một transaction lỗi;
- biến ít nhất một bug/CTF thành regression test.

## Điều hướng

Module trước: [Module 4](../module-04-anchor/README.md) · Module tiếp theo: [Module 6](../module-06-voting/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
