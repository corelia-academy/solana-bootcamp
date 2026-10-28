# Bản đồ phụ thuộc giữa các module

| Module | Cần hoàn thành trước | Sản phẩm được dùng tiếp |
| ---: | --- | --- |
| 0 | Không | Lộ trình cá nhân, blockchain cơ bản và readiness checklist |
| 1 | Module 0 | Toolchain, wallet và Hello Solana deploy/test trên Devnet |
| 2 | Module 1 | Rust Poll Counter và kỹ năng Rust nền tảng |
| 3 | Module 1 | Account/transaction mental model |
| 4 | Module 2–3 | PDA Counter Anchor |
| 5 | Module 4 | Test suite nhiều tầng cho PDA Counter |
| 6 | Module 4–5 | Voting program và IDL |
| 7 | Module 3, 5 | SPL Token client lab |
| 8 | Module 4, 7 | Escrow token program |
| 9 | Module 6 | Voting frontend |
| 10 | Module 7–9 | Stablecoin Lite |
| 11 | Module 7–10 | Simple AMM |
| 12 | Module 3, 5 | Privacy/ZK lab tự chọn |
| 13 | Module 5–6 | Indexing lab tự chọn |
| 14 | Module 5–6, 9 | Forecasting lab tự chọn |
| 15 | Module 7, 9 | x402 Paywall |
| 16 | Module 3, 5 | MCP Solana Server |
| 17 | Module 11, 15–16 | AI Agent có guardrails |
| 18 | Các module/project đã chọn | Security review và Devnet launch package |

Module 12–14 là ba nhánh độc lập: học viên chọn một, không cần học tuần tự cả ba. Module 15–17 tạo thành một track liên tục; AI Agent dùng lại interface của AMM, x402 và MCP.

## Quy tắc tham chiếu kiến thức tương lai

- Nội dung chưa được dạy chỉ được xuất hiện dưới nhãn **Preview** và không được là điều kiện hoàn thành module hiện tại.
- Module 7 dùng CLI/client script để đọc balance; UI hoàn chỉnh bắt đầu ở Module 9.
- Module 8 tập trung program/CPI; phần frontend chỉ là preview sau khi program và tests đã hoàn tất.
- Module 5 chỉ dùng PDA Counter của Module 4; Voting là ví dụ tham khảo sau khi hoàn thành Module 6.
