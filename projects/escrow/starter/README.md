# Starter — mô hình Escrow

Account structs và toàn bộ security constraints đã được khai báo. Hoàn thiện lần lượt ba handler `make`, `take`, `refund`; không thay các PDA seeds hoặc tin account do client truyền vào mà chưa có constraint.

File `tests/escrow.ts` chứa 5 acceptance tests đang `skip`. Mở từng test tương ứng sau khi hoàn thiện handler; test pass là điều kiện để chuyển checkpoint.

## Mục tiêu state
Đọc account graph và security constraints trước CPI.
## Phần đã có
Contexts, PDA/vault schema và skipped acceptance tests.
## Học viên cần làm
Hoàn thiện `make`, sau đó mở đúng test tương ứng.
## Chạy và kiểm tra
`pnpm install && anchor keys sync && anchor build && anchor test`
