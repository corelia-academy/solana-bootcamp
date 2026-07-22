# Project mẫu — Kiểm thử PDA Counter

Module này không tạo program mới. Ta lấy **PDA Counter đã hoàn thành ở Module 4** làm System Under Test và tập trung hoàn toàn vào kỹ thuật kiểm thử.

## Source được dùng

- Program: [`projects/pda-counter/final`](../../../projects/pda-counter/final/README.md)
- Test khởi đầu: [`starter/pda-counter.ts`](./starter/pda-counter.ts)
- Test tham khảo: [`solution/pda-counter.ts`](./solution/pda-counter.ts)

## Cách làm

1. Hoàn thành PDA Counter Module 4 hoặc dùng trạng thái `final`.
2. Sao lưu file test hiện tại của workspace.
3. Chép nội dung `starter/pda-counter.ts` vào `projects/pda-counter/final/tests/pda-counter.ts`.
4. Chạy `anchor test` để xác nhận test derive PDA đang xanh và các test lab đang skip.
5. Điền [test matrix](../test-matrix.md).
6. Bỏ `skip` từng test và hoàn thiện Arrange → Act → Assert.
7. Chỉ mở `solution` sau khi đã thử tự viết.

## Các milestone

| Mốc | Test cần xanh | Kỹ năng chính |
| --- | --- | --- |
| 1 | Derive PDA, initialize | Fixture và account fetch |
| 2 | Duplicate initialize | Assert transaction failure |
| 3 | Increment/decrement/reset | State transitions |
| 4 | Underflow | Custom error và rollback |
| 5 | Wrong authority | Signer/PDA constraint và rollback |

## Vì sao dùng lại project cũ?

Người học đã hiểu business logic của Counter nên lỗi test không bị lẫn với domain mới. Module 5 chỉ thay đổi test harness, fixture, assertions và cách debug; program source giữ nguyên.
