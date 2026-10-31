# Bài 0 — Cài Rust rồi chạy Hello World

## 1. Cài Rust

Cả module gõ lệnh trong terminal, cửa sổ gõ lệnh bằng chữ:

- **macOS:** app Terminal, mở bằng Spotlight (⌘ + Space, gõ "Terminal").
- **Linux:** app Terminal của bản phân phối.
- **Windows:** chọn một trong ba. **Git Bash** cài kèm [Git for Windows](https://git-scm.com/download/win), gõ lệnh y hệt bài; **WSL** là Linux chạy trong Windows, cũng gõ y hệt; **PowerShell** có sẵn, lệnh `cargo` và `rustup` chạy bình thường nhưng vài lệnh shell khác cú pháp.

Vào [rust-lang.org](https://rust-lang.org), bấm **Install** ở menu trên cùng. Trang tự nhận ra hệ điều hành và hiện cách cài phù hợp.

Trên macOS, Linux hoặc WSL, trang hiện một lệnh. Copy, dán vào terminal và chạy:

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Chọn cài mặc định khi được hỏi, rồi đóng và mở lại terminal. Nếu đã có Rust thì bỏ qua lệnh trên. Trên Mac mới, lần đầu build code macOS có thể bật hộp thoại hỏi cài Command Line Tools; bấm Install vì Rust cần linker trong bộ này.

Trên Windows dùng Git Bash hoặc PowerShell, trang hiện nút tải `rustup-init.exe`; đa số máy chọn bản x64, máy chip ARM chọn ARM64. Có thể tải thẳng [bản x64](https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe). Chạy file vừa tải; khi bộ cài hỏi cài Visual Studio C++ Build Tools, chọn đồng ý. Cài xong, mở lại terminal.

Module dùng Rust **1.89.0**, đúng phiên bản trong video. Trên mọi hệ điều hành, đặt phiên bản này làm mặc định để lỗi compiler và kết quả giống trong bài:

```shell
rustup default 1.89.0
rustc --version
```

Cần thấy `rustc 1.89.0`.

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

## 3. Cài extension cho VSCode

Mở VSCode, vào tab Extensions và cài:

- **rust-analyzer** (nhà phát hành rust-lang): bắt buộc. Gợi ý code, báo lỗi ngay khi gõ, hiện tài liệu khi rê chuột. Không cài extension tên "Rust" cũ đã ngừng phát triển.
- **Even Better TOML:** nên có, giúp đọc `Cargo.toml` dễ hơn.

Ngoài Rust, VSCode và git để tải repo, module không cần cài thêm gì. Thư viện như tokio hay sha2 được Cargo tự tải khi project cần.

## 4. Tự đổi lời chào

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
- Windows báo thiếu `link.exe`: cài Visual Studio C++ Build Tools rồi mở lại terminal.
- Không tìm thấy Cargo.toml: chuyển terminal vào thư mục hello_rust.
- Nếu hello_rust đã tồn tại: dùng lại bằng `cd hello_rust`, không cần cargo new lần nữa.
- <a id="phien-ban"></a>`rustc --version` không ra 1.89.0: chạy lại `rustup default 1.89.0`. Trong repo bootcamp, rust-toolchain.toml cũng tự chọn 1.89.0.

Xem thêm [hướng dẫn cài chính thức](https://doc.rust-lang.org/book/ch01-01-installation.html) nếu vẫn lỗi.

</details>
