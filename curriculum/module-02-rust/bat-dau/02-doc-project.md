# Tra cứu — Folder Rust có gì?

Đọc khi cần tìm file. Nếu chưa chạy Hello World, [làm bài đầu trước](./01-cai-rust.md).

Sau khi tạo và chạy project hello_rust, bạn thường thấy:

```text
hello_rust/
├── Cargo.toml
├── Cargo.lock
├── src/
│   └── main.rs
└── target/
```

| Chỗ nào? | Dùng để làm gì? |
| --- | --- |
| src/main.rs | Code của bạn; mở file này để sửa lời chào |
| Cargo.toml | Thông tin project và thư viện cần dùng |
| Cargo.lock | Cargo ghi các phiên bản thư viện đã chọn |
| target/ | Cargo tạo để chứa kết quả build |

Ở bài đầu, chỉ sửa src/main.rs. Gõ `cargo run` trong terminal đang đứng ở hello_rust, nơi có Cargo.toml.

Trong các bài project cũ, thư mục code bạn tự viết có thể được đặt tên practice. Vai trò của các file bên trong vẫn như trên.

<a id="file-sinh-ra"></a>
## Khi project có thêm file

Gặp ở các bài sau mới cần tra bảng này:

| File/folder | Dùng để làm gì? |
| --- | --- |
| src/poll.rs, src/tree.rs | Code module được nối vào chương trình bằng mod |
| src/lib.rs | Gốc thư viện để dùng lại code |
| src/bin/ | Các chương trình khác trong cùng package |
| tests/ | Kiểm tra tự động dùng API của thư viện |

Đọc [bài Module](../khai-niem/modules.md) khi bắt đầu tách code thành nhiều file.

[Quay lại hóa đơn](../01-gio-hang/README.md#in-tien).
