# Module 2: Rust Survival Kit

Học Rust bằng tiếng Việt qua ba project nhỏ. Project là đường học chính; mỗi bước có link sang bài khái niệm giải thích phần code mới.

Mục tiêu của module: học đủ Rust để tự tin viết và audit program Solana viết bằng Rust, làm nền cho Anchor ở các module sau.

## Học gì, không học gì

- **Rust cơ bản đến trung cấp:** kiểu dữ liệu, control flow, struct, enum, collection, module, generics, traits, lifetimes, iterator.
- **Ownership và borrowing ngay từ đầu:** phần nhiều người thấy khó nhất của Rust được dùng lại trong cả ba project để quen tay.
- **Async/await ở cuối module:** đủ để đọc `async fn`, `.await`, `join!`, `select!`.

Module không đi sâu vào closures (chỉ gặp dạng ngắn như `|x| x + 1`), smart pointers và concurrency bằng threads, channels, mutex. Các phần này không cần để viết và audit program Solana; học xong module, bạn có đủ nền để tự học thêm khi cần.

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

Module không giải thích lại những phần sau:

- **Lập trình cơ bản:** biến, hàm, vòng lặp, hash map ở một ngôn ngữ bất kỳ như Python, JavaScript, C hay Java.
- **Command line:** di chuyển thư mục và chạy lệnh trong terminal. Demo dùng terminal macOS; Linux gõ lệnh y hệt; Windows dùng Git Bash hoặc WSL để gõ y hệt, PowerShell cũng chạy được `cargo`.
- **IDE:** demo dùng VSCode.

Cần cài: Rust qua rustup, VSCode với extension rust-analyzer (nên thêm Even Better TOML), và git để tải repo. Chi tiết từng hệ điều hành ở [bài cài đặt](./bat-dau/01-cai-rust.md). Repo dùng Rust **1.89.0** qua `rust-toolchain.toml`. Module này không cần ví hoặc RPC.

## Điều hướng

Module trước: [Module 1](../module-01-orientation/README.md) · Module tiếp theo: [Module 3](../module-03-solana-mental-model/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
