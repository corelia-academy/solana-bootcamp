# Solana Developer Bootcamp

Tài liệu học, bài tập code-along, project và tài nguyên dành cho học viên Solana Developer Bootcamp Vietnam của Corelia Academy.

> Thân thiện với lập trình viên mới học Solana, nhưng không phải khóa “zero-code”. Học viên cần kiến thức lập trình cơ bản; Rust nền tảng được dạy ở Module 2.

## Bắt đầu

Truy cập [khóa Solana Bootcamp trên Corelia Academy](https://corelia.academy/learn/courses/solana-bootcamp) để học theo từng lesson cùng các nội dung bổ trợ của khóa học. Khi xem video trên YouTube, hãy kết hợp với nội dung khóa học và tài liệu/code trong repo để hoàn thành bài thực hành.

- [Module 0 — Bootcamp Orientation](./curriculum/module-00-orientation/README.md)
- [Những điều học viên cần biết trước khi bắt đầu](./docs/getting-started.md)
- [Chương trình Module 0 + 18 module](./curriculum/README.md)
- [Cài đặt khóa học](./docs/setup.md)
- [Ghi chú khái niệm cốt lõi](./notes/README.md)
- [Bài tập thực hành](./exercises/README.md)
- [Code-along projects](./projects/README.md)
- [Capstone](./capstones/README.md)

## Nền tảng

- [Module 1 — Solana Setup & First Deployment](./curriculum/module-01-orientation/README.md)
- [Module 2 — Rust Survival Kit](./curriculum/module-02-rust/README.md)
- [Module 3 — Solana Mental Model](./curriculum/module-03-solana-mental-model/README.md)
- [Module 4 — Anchor Fundamentals](./curriculum/module-04-anchor/README.md)
- [Module 5 — Testing Stack](./curriculum/module-05-testing/README.md)

## Project cốt lõi

- [Module 6 — Voting App](./curriculum/module-06-voting/README.md)
- [Module 7 — SPL Token Basics](./curriculum/module-07-spl-token/README.md)
- [Module 8 — Escrow](./curriculum/module-08-escrow/README.md)
- [Module 9 — Frontend Integration](./curriculum/module-09-frontend/README.md)
- [Module 10 — Stablecoin Lite](./curriculum/module-10-stablecoin/README.md)
- [Module 11 — Simple AMM](./curriculum/module-11-amm/README.md)

## Các module chuyên sâu tự chọn

- [Module 12 — Privacy & ZK](./curriculum/module-12-privacy-zk/README.md)
- [Module 13 — Data Indexing](./curriculum/module-13-indexing/README.md)
- [Module 14 — Forecasting App](./curriculum/module-14-forecasting/README.md)

Đây là ba module độc lập. Học viên có thể chọn một hướng chuyên sâu.

## AI và triển khai thực tế

- [Module 15 — x402 Payments](./curriculum/module-15-x402/README.md)
- [Module 16 — Model Context Protocol](./curriculum/module-16-mcp/README.md)
- [Module 17 — AI Agents on Solana](./curriculum/module-17-ai-agents/README.md)
- [Module 18 — Security & Production](./curriculum/module-18-security/README.md)

## Cách học project

```text
project-name
├── starter
├── checkpoint-1
├── checkpoint-2
└── final
```

Luôn bắt đầu từ `starter`. Checkpoint chỉ dùng để phục hồi khi bị kẹt. `final` là tài liệu đối chiếu sau khi đã nộp bài.

## Tài nguyên hỗ trợ

- [Cách vận hành khóa học](./docs/course-operations.md)
- [Bản đồ phụ thuộc giữa các module](./docs/module-dependencies.md)
- [Xử lý lỗi cài đặt](./docs/troubleshooting.md)
- [Security checklist](./docs/security-checklist.md)
- [Tài liệu tham khảo](./docs/resources.md)

Mỗi bài học đi theo trình tự `Khái niệm → Mô hình → Code → Kiểm thử`. Mỗi project đi kèm sơ đồ account, luồng instruction, cách derive PDA nếu có, danh sách account trong transaction và luồng từ client đến program.

## License

Toàn bộ source code, tài liệu, bài tập và diagram trong repository được phát hành theo [MIT License](./LICENSE), copyright © 2026 Corelia Academy.
