# Module — Đi từ file main sang phần code khác

Module chia code thành các phần có tên: `mod` khai báo module, `use` đưa tên vào phạm vi, `pub` cho code bên ngoài dùng.

## 1. Bắt đầu với code chung một file

Ví dụ chạy độc lập trong [thư mục nháp](./README.md#thu-muc-nhap):

```rust
mod parser {
    fn normalize(input: &str) -> String {
        input.trim().to_ascii_lowercase()
    }

    pub fn is_yes(input: &str) -> bool {
        normalize(input) == "yes"
    }
}

use parser::is_yes;

fn main() {
    assert!(is_yes(" YES "));
    assert!(!is_yes("no"));
}
```

Module tạo một nhóm tên/phạm vi. Parser là module. Normalize là hàm riêng trong parser; is_yes mở ra bằng pub. Main dùng is_yes được nhưng không trực tiếp gọi normalize.

Use cho phép gọi tên ngắn; không cài thư viện, không thay thế khai báo dependencies trong Cargo.toml.

## 2. Khi tách ra file

Trong sandbox, cắt **phần bên trong** `mod parser { ... }` sang file `src/parser.rs`, rồi thay block cũ bằng `mod parser;`. Giữ `use parser::is_yes` và main ở file cũ.

```text
src/
├── main.rs       mod parser; + use ... + fn main()
└── parser.rs     fn normalize(...) + pub fn is_yes(...)
```

Cargo run vẫn pass assertions. `mod parser;` khai báo module và yêu cầu compiler tìm nội dung trong file tương ứng. Chỉ tạo parser.rs mà không nối vào cây module thì nó chưa tự trở thành code của binary.

## 3. Đọc project bình chọn từ đâu?

| Đi theo | Đọc được gì? |
| --- | --- |
| Cargo.toml | Tên package, dependencies và các target cấu hình thêm |
| src/main.rs | Main bắt đầu ở đâu, gọi việc gì |
| mod poll; | Phần xử lý được đưa sang poll.rs |
| use poll::{Choice, Poll}; | Hai tên mà main dùng từ module poll |
| impl Poll trong poll.rs | New, vote, count, total thực hiện ra sao |

`pub struct Poll` mở kiểu; từng field vẫn riêng tư nếu không có pub. Main đi qua methods thay vì sửa counts tùy ý.

## 4. Crate, package và các đường dẫn

Crate là một đơn vị Rust biên dịch. Package được mô tả bởi Cargo.toml, có thể có library crate và các binary crates. `src/main.rs` là gốc binary mặc định; `src/lib.rs` là gốc library mặc định.

`crate::` bắt đầu từ gốc crate hiện tại; `self::` là module hiện tại; `super::` lên module cha. `::` đi qua tên module/kiểu/item. Dấu `.` truy cập field/method trên một giá trị.

File thư viện được quản lý bởi Cargo.toml, dùng từ code qua use; còn dependency thực sự được khai báo trong Cargo.toml. Hai việc này khác nhau.

## Tự làm

Tách ví dụ parser thành hai file rồi chạy. Bỏ pub khỏi is_yes, đọc lỗi private; thêm lại để chạy được. Đạt khi giải thích được tại sao main tìm thấy hàm ở file khác.

**Dùng trong:** [đọc folder — các file bổ sung](../bat-dau/02-doc-project.md#file-sinh-ra) · [bình chọn — tạo poll.rs](../02-binh-chon/README.md#poll-1) · [vé — tạo tree.rs](../03-ve-su-kien/README.md#ticket-3).
