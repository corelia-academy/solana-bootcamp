# Ghi chú nền tảng Solana

Tài liệu tra cứu nhanh các khái niệm quan trọng trong bootcamp. Mỗi ghi chú tập trung vào mô hình tư duy, sơ đồ và những điểm cần kiểm tra khi viết chương trình Solana.

## Mô hình lập trình Solana

- [Solana khác EVM như thế nào?](./solana-vs-evm.md) — so sánh cách lưu trạng thái, thực thi và phân quyền.
- [Account trên Solana](./accounts.md) — owner, lamports, data và quyền ghi dữ liệu.
- [Program, instruction và transaction](./transactions.md) — cách một giao dịch được tạo và thực thi.
- [Program Derived Address (PDA)](./pda.md) — seeds, bump và cơ chế program ký thay PDA.
- [Cross-program invocation (CPI)](./cpi.md) — gọi program khác một cách an toàn.
- [Mô hình SPL Token](./spl-token.md) — mint, token account và associated token account.

## Xây dựng ứng dụng

- [Chiến lược kiểm thử](./testing.md) — chọn lớp test phù hợp và các trường hợp cần bao phủ.
- [Luồng dữ liệu từ frontend đến program](./frontend.md) — wallet, client, RPC và program phối hợp với nhau.

## Chủ đề nâng cao

- [Luồng thanh toán x402](./x402.md) — yêu cầu thanh toán, xác minh và chống replay.
- [Kiến trúc Model Context Protocol](./mcp.md) — kết nối AI với công cụ đọc và ghi dữ liệu Solana.
- [Vòng lặp AI agent và guardrails](./agents.md) — kiểm soát quyền, hạn mức và giao dịch do agent đề xuất.

Quay lại [chương trình học](../curriculum/README.md) hoặc [trang chính](../README.md).
