# Bài 0 — Cài Rust rồi chạy Hello World

## 1. Cài Rust

Trên macOS hoặc Linux, mở Terminal và chạy:

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Chọn cài mặc định khi được hỏi, rồi đóng và mở lại Terminal. Nếu đã có Rust thì bỏ qua bước này.

Windows: dùng [bộ cài Rust chính thức](https://rust-lang.org/tools/install) và làm theo hướng dẫn.

## 2. Chạy chương trình đầu tiên

Trong thư mục bạn muốn lưu bài tập, chạy lần lượt:

```shell
cargo new hello_rust
cd hello_rust
cargo run
```

Cần thấy:

```text
Hello, world!
```

## 3. Tự đổi lời chào

Mở file `hello_rust/src/main.rs`. Đổi thành:

```rust
fn main() {
    println!("Xin chào Rust!");
}
```

Lưu file. Trong terminal vẫn ở `hello_rust`, chạy lại `cargo run`. Thấy `Xin chào Rust!` là xong bài đầu.

[Tiếp: tính tiền một đơn cà phê](../01-gio-hang/README.md#in-tien). Dùng tiếp project hello_rust vừa tạo.

<details>
<summary>Nếu cài hoặc chạy bị lỗi</summary>

- Không tìm thấy cargo: mở lại Terminal sau khi cài.
- Lỗi linker/cc trên macOS: chạy `xcode-select --install`, hoàn tất cài rồi thử lại.
- Lỗi linker/cc trên Ubuntu: chạy `sudo apt update` rồi `sudo apt install build-essential`.
- Không tìm thấy Cargo.toml: chuyển terminal vào thư mục hello_rust.
- Nếu hello_rust đã tồn tại: dùng lại bằng `cd hello_rust`, không cần cargo new lần nữa.

<a id="phien-ban"></a>
Khi làm trong repo bootcamp, rust-toolchain.toml tự chọn Rust 1.89.0 và có thể yêu cầu tải phiên bản này. Bài đầu chưa cần tự cấu hình toolchain. Xem thêm [hướng dẫn cài chính thức](https://doc.rust-lang.org/book/ch01-01-installation.html) nếu vẫn lỗi.

</details>
