# Lab — Test matrix cho PDA Counter

Điền tầng test và assertion trước khi viết code. Hai dòng đầu là ví dụ.

| Scenario | Tầng test | Arrange | Action | Expected error/state |
| --- | --- | --- | --- | --- |
| Initialize lần đầu | Anchor TS | Derive PDA của owner | `initialize` | owner đúng, value = 0 |
| Increment | Anchor TS | Counter value = 0 | `increment` | value = 1 |
| Initialize trùng PDA |  |  |  |  |
| Wrong owner update |  |  |  |  |
| Decrement khi bằng 0 |  |  |  |  |
| Reset |  |  |  |  |
| Giá trị `u64::MAX` increment |  |  |  |  |
| PDA bị thay thế |  |  |  |  |

## Câu hỏi review

1. Scenario nào có thể chuyển thành Rust unit test?
2. Scenario nào bắt buộc cần runtime để kiểm tra signer/PDA?
3. Với mỗi failure case, state nào phải được đọc lại để chứng minh rollback?
4. Fixture nào nên dùng chung và action nào phải để trực tiếp trong test?
