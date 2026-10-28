# Module 2: Rust Survival Kit

Học Rust bằng tiếng Việt qua ba project nhỏ. Project là đường học chính: gặp khái niệm mới thì mở bài giải thích được liên kết ngay tại chỗ, thử ví dụ, rồi quay lại làm tiếp.

## Kết quả đầu ra

- Cài Rust, đọc và chạy được một Cargo project.
- Đọc chữ ký hàm và giải thích hàm nhận, mượn hay sửa dữ liệu; tự sửa lỗi move/borrow.
- Dùng struct, enum, `Vec`, `HashMap`, `Option`/`Result` và `?` trong code thật.
- Tách code thành module, viết test, đọc generics, traits, lifetimes và iterator thường gặp.
- Hiểu async cơ bản và Merkle tree: tạo root, sinh và kiểm tra proof.

## Lộ trình

| Bước | Nội dung | Khái niệm chính |
| --- | --- | --- |
| [Bắt đầu](./bat-dau/01-cai-rust.md) | Cài Rust, chạy Hello World, tự đổi lời chào | Cargo, `fn main`, `println!` |
| [1. Giỏ hàng](./01-gio-hang/README.md) | Tính tiền cà phê, rồi [giỏ hàng nhiều món](./01-gio-hang/gio-hang-day-du.md) | hàm, biến, kiểu, struct, `Vec` |
| [2. Bình chọn](./02-binh-chon/README.md) | Ứng dụng bình chọn trên terminal | enum, `match`, `HashMap`, ownership, `Result` |
| [3. Vé sự kiện](./03-ve-su-kien/README.md) | Lấy danh sách khách bằng async, kiểm tra vé bằng Merkle proof | async, module, iterator, Merkle tree |

Mỗi project có `starter` để tự làm và `final` để đối chiếu. Tra cứu thêm: [folder Rust có gì](./bat-dau/02-doc-project.md) · [toàn bộ bài khái niệm](./khai-niem/README.md).

Bài tổng kết trước khi sang Solana: [Rust Poll Counter](../../exercises/rust-poll-counter/README.md).

## Điều kiện tiên quyết

Biết biến, hàm và vòng lặp cơ bản ở một ngôn ngữ bất kỳ. Cài Rust/Cargo theo [Module 1](../module-01-orientation/README.md); repo dùng Rust **1.89.0** qua `rust-toolchain.toml`. Module này không cần ví hoặc RPC.

## Điều hướng

Module trước: [Module 1](../module-01-orientation/README.md) · Module tiếp theo: [Module 3](../module-03-solana-mental-model/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
