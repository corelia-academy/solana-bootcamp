# Bài khái niệm

Mỗi bài giải thích một khái niệm Rust dùng trong ba project, kèm ví dụ chạy độc lập.

| Từ khóa | Bài |
| --- | --- |
| fn, main, tham số, kết quả, dấu ; | [Hàm](./functions.md) |
| let, mut, shadowing, const | [Biến](./variables.md) |
| println!, {}, {:?}, print/flush | [In dữ liệu](./printing.md) |
| u32, u64, String, &str, char, tuple | [Kiểu dữ liệu](./types.md) |
| if/else, match, for, while, loop, if let/let else | [Điều kiện và vòng lặp](./control-flow.md) |
| struct, field, impl, Self, method | [Struct](./structs.md) |
| enum, variant, Choice | [Enum](./enums.md) |
| move, Copy/Clone, & và &mut | [Ownership và borrowing](./ownership.md) |
| array, slice, Vec, HashMap | [Danh sách và bảng tra](./collections.md) |
| Option, Result, unwrap/expect, ? | [Kết quả và lỗi](./errors.md) |
| mod, use, pub, crate, lib.rs | [Module và đọc nhiều file](./modules.md) |
| generic T, trait, bounds, From/FromStr/Display | [Generics và traits](./traits.md) |
| 'a, 'static, reference sống bao lâu | [Lifetimes](./lifetimes.md) |
| iter/map/filter/collect, closure | [Iterator](./iterators.md) |
| Future, await, Tokio, join/select | [Async](./async.md) |
| hash, leaf, root, sibling, proof | [Merkle tree](./merkle.md) |
| test, assert, cfg, derive và attributes | [Tests và attributes](./tests.md) |

<a id="thu-muc-nhap"></a>
## Chạy ví dụ ở một thư mục nháp riêng

Bạn giữ project đang làm trong thư mục của nó, ví dụ hello_rust hoặc practice. Tạo sandbox một lần để thử ví dụ trong các bài khái niệm, từ gốc repo:

```shell
cargo new curriculum/module-02-rust/sandbox --name rust-sandbox --edition 2021 --vcs none
cd curriculum/module-02-rust/sandbox
```

Nếu sandbox đã tồn tại, chỉ cd vào đó. Mỗi block Rust trong bài là một ví dụ độc lập: thay toàn bộ `sandbox/src/main.rs` bằng block có main rồi chạy `cargo run`. Block chỉ có câu lệnh có thể đặt bên trong main; khai báo hàm/kiểu có thể đặt bên ngoài main.

Block `compile_fail` là code cố tình sai để xem compiler giải thích; đọc nguyên nhân rồi chuyển sang bản sửa. Bài async có hướng dẫn bổ sung dependency ngay tại đó. Các ví dụ còn lại dùng thư viện chuẩn.

Để tiếp tục project, chuyển terminal về thư mục project đang làm. Nếu đang dùng hello_rust, mở terminal tại hello_rust. Với bản project đặt ở practice, ví dụ từ sandbox có thể chuyển về như sau:

```shell
cd ../01-gio-hang/practice
```

Bạn cũng có thể mở ví dụ độc lập trên [Rust Playground](https://play.rust-lang.org/).

[Chưa cài Rust](../bat-dau/01-cai-rust.md) · [Đọc folder Cargo](../bat-dau/02-doc-project.md) · [Về module](../README.md).
