# Nội dung bài học — Module 1

## 1.1 Bản đồ bootcamp

Bootcamp đi từ Rust tối thiểu cần thiết đến account model, Anchor, testing, project full-stack và AI Agent. Học viên không cần học toàn bộ Rust, validator internals hay cryptography trước khi viết chương trình đầu tiên. Mục tiêu là hiểu đủ sâu để tự giải thích state, authority và transaction của sản phẩm mình xây.

Thực hành: đọc [18-module curriculum](../README.md), chọn capstone dự kiến và ghi lại ba prerequisite cần hoàn thành trước capstone đó.

Kết quả: học viên phân biệt core track, optional specialization và AI/Agent track.

## 1.2 Ma trận cài đặt

macOS dùng Xcode Command Line Tools; Linux dùng compiler packages của distro; Windows dùng WSL2 Ubuntu. Toàn bộ Rust, Solana và Anchor của Windows phải cài bên trong WSL, không trộn executable Windows với Linux.

Thực hành: hoàn thành ma trận OS trong [setup guide](../../docs/setup.md) và ghi lại shell, kiến trúc CPU, đường dẫn repository.

## 1.3 Cấu trúc Anchor project

`Anchor.toml` cấu hình workspace và cluster; `programs/` chứa Rust onchain; `tests/` chứa integration test; `app/` chứa client; `target/idl` và `target/deploy` là artifacts sinh ra.

Thực hành: chạy `anchor init hello-solana`, vẽ cây thư mục và giải thích file nào là source, config hay generated artifact.

## 1.4 Khóa phiên bản

Một khóa học code-along phải dùng cùng major/minor toolchain để tránh lỗi không liên quan đến bài học. Kiểm tra `rustc`, `cargo`, `solana`, `anchor`; Node/package manager được kiểm tra trước module client.

Thực hành: lưu output version vào báo cáo setup và so với [course setup](../../docs/setup.md).

## 1.5 Debug lỗi setup

Quy trình: đọc full error → xác định command đầu tiên thất bại → kiểm tra version/PATH → thu nhỏ reproduction → chỉ cleanup đúng thư mục generated. Không xóa wallet hoặc project để “thử lại từ đầu”.

Thực hành: dùng [troubleshooting guide](../../docs/troubleshooting.md) để phân loại một lỗi PATH, một lỗi program ID và một lỗi Devnet.

## 1.6 Wallet, Devnet và Explorer

Wallet học tập chỉ dùng Devnet. Public key có thể chia sẻ; seed phrase/private key không bao giờ đưa vào Git, screenshot hay chat. `solana config get` phải khớp cluster mà Explorer đang hiển thị.

Thực hành: tạo wallet riêng, nhận Devnet SOL, gửi một transfer nhỏ và mở signature trên Explorer.

## Lab cuối module

Hoàn thành [setup checklist](./setup-checklist.md), sau đó chạy `anchor build` và `anchor test` trên project tạm. Nộp version output, public address, Explorer link và cây thư mục có chú thích.
