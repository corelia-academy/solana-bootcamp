# Hướng dẫn đánh giá

## Rubric project

| Tiêu chí | Trọng số | Minh chứng |
| --- | ---: | --- |
| Tính đúng đắn | 30% | Instruction và state transition khớp specification |
| Kiểm thử | 20% | Happy path, authorization failure, invalid account và boundary cases |
| Solana mental model | 15% | Đúng account ownership, PDA seeds, signer và writability |
| Bảo mật | 15% | Validation, arithmetic, CPI/token checks và assumptions được ghi rõ |
| Tài liệu | 10% | Diagram, account table, command và error dễ hiểu |
| Chất lượng code | 10% | Module, naming rõ ràng; comment cho logic không hiển nhiên |

## Mức hoàn thành

- **Xuất sắc (90–100):** hoàn chỉnh, an toàn, test tốt và tự giải thích được quyết định.
- **Đạt (75–89):** flow chính hoàn chỉnh; gap nhỏ không làm hỏng hành vi cốt lõi.
- **Đang phát triển (60–74):** flow chạy một phần nhưng thiếu test hoặc validation quan trọng.
- **Chưa hoàn thành (<60):** không chứng minh được state transition yêu cầu hoặc sao chép final trước khi tự làm.

## Câu hỏi tự kiểm tra cuối bài

1. State nào vừa thay đổi?
2. Account nào cho phép thay đổi đó?
3. Program đã enforce invariant nào?
4. Failure case tiếp theo cần test là gì?
