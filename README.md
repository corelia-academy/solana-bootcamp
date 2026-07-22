# Solana Developer Bootcamp

Tài liệu học, bài tập code-along, project và tài nguyên dành cho học viên Solana Developer Bootcamp Vietnam của Corelia Academy.

> Thân thiện với lập trình viên mới học Solana, nhưng không phải khóa “zero-code”. Học viên cần kiến thức lập trình cơ bản; Rust nền tảng được dạy ở Module 2.

## Bắt đầu

- [Chương trình 18 module](./curriculum/README.md)
- [Cài đặt khóa học](./docs/setup.md)
- [Ghi chú khái niệm cốt lõi](./notes/README.md)
- [Bài tập thực hành](./exercises/README.md)
- [Code-along projects](./projects/README.md)
- [Capstone](./capstones/README.md)
- [Tài liệu curriculum nguồn](https://docs.google.com/document/d/110W9WiENefZVcSBAfbCP72mjZfFqqxTgCyiIXQdRT6k/edit)

## Nền tảng

- [Module 1 — Định hướng & môi trường](./curriculum/module-01-orientation/README.md)
- [Module 2 — Rust Survival Kit](./curriculum/module-02-rust/README.md)
- [Module 3 — Solana Mental Model](./curriculum/module-03-solana-mental-model/README.md)
- [Module 4 — Anchor Fundamentals](./curriculum/module-04-anchor/README.md)
- [Module 5 — Testing Stack](./curriculum/module-05-testing/README.md)

## Core projects

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

## AI và production

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

## Tài nguyên học viên

- [Cách vận hành khóa học](./docs/course-operations.md)
- [Checklist phát hành khóa quay sẵn](./docs/release-checklist.md)
- [Mapping curriculum nguồn sang 18 module](./docs/curriculum-map.md)
- [Bản đồ phụ thuộc giữa các module](./docs/module-dependencies.md)
- [Quy ước repository](./docs/repository-conventions.md)
- [Xử lý lỗi cài đặt](./docs/troubleshooting.md)
- [Security checklist](./docs/security-checklist.md)
- [Tài liệu tham khảo](./docs/resources.md)

Mỗi lesson đi theo trình tự `Concept > Schema > Code > Test`. Mỗi project phải có sơ đồ accounts, instruction flow, PDA derivation nếu có, transaction account list và luồng client-to-program.
