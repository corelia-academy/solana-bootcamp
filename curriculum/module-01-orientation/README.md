# Module 1: Solana Setup & First Deployment

## Kết quả đầu ra

Học viên có toolchain theo baseline khóa học, wallet học tập và Devnet SOL; tạo được Anchor project mẫu, build/test local, deploy và upgrade trên Devnet, kiểm tra Program ID bằng Explorer, xuất bản IDL và chạy test trên Devnet.

## Điều kiện tiên quyết

Hoàn thành [Module 0 — Bootcamp Orientation](../module-00-orientation/README.md) và readiness checklist. Có kiến thức lập trình, terminal và Git cơ bản.

## Bài học

Đọc [nội dung chi tiết từng lesson](./lessons.md). Thứ tự bám theo workflow của video:

1. Setup Development Environment
2. Wallet & Devnet
3. Your First Anchor Project
4. Deploy & Upgrade Program on Devnet
5. Explorer, IDL & Devnet Testing

Phần Anchor chỉ giải thích đủ để làm theo chương trình mẫu. Rust, account model và Anchor chuyên sâu sẽ được học ở Module 2–4.

## Cấu trúc project mẫu

```text
hello-solana
├── Anchor.toml
├── Cargo.toml
├── rust-toolchain.toml
├── package.json
├── programs/hello-solana/src/lib.rs
├── tests/hello-solana.ts
├── app
├── target/idl/hello_solana.json
└── target/deploy/hello_solana.so
```

`target/` là artifact sinh ra; program keypair trong `target/deploy/` cần giữ để tiếp tục dùng cùng Program ID, không đưa vào bài nộp hoặc Git.

## Lab: Build, Deploy & Test Hello Solana

Thực hiện [lab theo từng bước](./lessons.md#lab-cuối-module) và hoàn thành [setup checklist](./setup-checklist.md). Project mẫu được tạo bên ngoài repo khóa học.

Minh chứng gồm version output, public wallet address, cây thư mục có chú thích, output build/test local, Program ID, Devnet Explorer links, kết quả IDL fetch và test Devnet. Kiểm tra transaction test sau upgrade có log mới để xác nhận dùng chương trình đã cập nhật.

## Điều kiện hoàn thành

- Toolchain đúng baseline và giải thích được các thư mục config, source, test, IDL, deploy artifact.
- Build và test local thành công.
- Deploy và upgrade thành công trên Devnet với cùng Program ID.
- IDL trên Devnet khớp địa chỉ và danh sách instruction trong IDL local.
- Test Devnet thành công; Explorer hiển thị đúng cluster và log sau upgrade.
- Minh chứng chỉ gồm dữ liệu công khai và output liên quan, không có secret/keypair.

## Ghi chú cập nhật so với video

Bản thử nghiệm tách phần định hướng sang Module 0 và mở rộng lab từ build/test sang deploy, upgrade, IDL và test Devnet. Hướng dẫn tạo project chọn pnpm để khớp baseline; test local và Devnet dùng cluster rõ ràng. Nếu video có thao tác khác, áp dụng [quy tắc video và docs](../module-00-orientation/lessons.md#05-video-documentation--tool-versions) và [setup guide](../../docs/setup.md).

## Điều hướng

Module trước: [Module 0](../module-00-orientation/README.md) · [Trang chương trình](../README.md) · Module tiếp theo: [Module 2](../module-02-rust/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
