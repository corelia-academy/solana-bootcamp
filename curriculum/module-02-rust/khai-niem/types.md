# Kiểu dữ liệu — Giá trị này là loại gì?

Kiểu cho Rust biết một giá trị là gì và làm được phép tính nào: số nguyên, số thực, bool, ký tự, chuỗi, tuple, array.

<a id="so"></a>
## 1. Số nguyên và bool

```rust
fn main() {
    let gia: u32 = 25000;
    let so_ly: u16 = 2;
    let tong: u64 = u64::from(gia) * u64::from(so_ly);
    let co_qua: bool = tong >= 60000;
    assert_eq!(tong, 50000);
    assert!(!co_qua);
}
```

Dấu `: u32` ghi kiểu cho biến hoặc tham số. `u` là số nguyên không âm; `i` là số nguyên có dấu, chứa cả số âm. Số phía sau là số bit: càng nhiều bit, miền giá trị càng rộng. Khi viết `let gia = 25000`, compiler suy ra kiểu `i32`; không nhất thiết phải ghi mọi chỗ.

| Kiểu | Nhỏ nhất | Lớn nhất |
| --- | --- | --- |
| `u8` | 0 | 255 |
| `u16` | 0 | 65.535 |
| `u32` | 0 | khoảng 4,3 tỉ |
| `u64` | 0 | khoảng 1,8 × 10¹⁹ |
| `u128` | 0 | khoảng 3,4 × 10³⁸ |
| `i8` | −128 | 127 |
| `i32` | khoảng −2,1 tỉ | khoảng 2,1 tỉ |
| `i64` | khoảng −9,2 × 10¹⁸ | khoảng 9,2 × 10¹⁸ |

`i16` và `i128` theo cùng quy luật: một nửa miền dành cho số âm. Mỗi kiểu có hằng `MIN` và `MAX`, ví dụ `u8::MAX` là 255. Trên Solana, số lamport và số dư token dùng `u64`.

Bool chỉ có true hoặc false. `usize` thường dùng cho chỉ số và độ dài trong bộ nhớ, như `items.len()`. `f32`/`f64` là số thực có sai số; để đếm tiền chính xác thường dùng số nguyên theo đơn vị nhỏ nhất.

Hai số khác kiểu không tự động cộng/nhân như mọi ngôn ngữ khác. `u64::from(gia)` chuyển một u32 sang u64 chứa vừa. Chuyển trước khi nhân, không đợi nhân tràn mới chuyển. Tránh dùng `as` tùy tiện vì một số cast có thể làm mất dữ liệu.

<a id="overflow"></a>
## 2. Kiểu có giới hạn

```rust
fn main() {
    assert_eq!(255_u8.checked_add(1), None);
    assert_eq!(254_u8.checked_add(1), Some(255));
    assert_eq!(255_u8.saturating_add(1), 255);
    assert_eq!(255_u8.wrapping_add(1), 0);
}
```

255 là giới hạn u8. Kết quả vượt miền giá trị của kiểu gọi là tràn số (overflow). Với phép `+` thường, bản debug (`cargo run`) dừng chương trình bằng panic "attempt to add with overflow"; bản release (`cargo run --release`) mặc định không kiểm tra và quay vòng về 0, trừ khi bật `overflow-checks = true` trong `Cargo.toml` như project Anchor làm sẵn.

Vì vậy hãy chọn hành vi rõ ràng:

| Method | Khi tràn | Dùng khi |
| --- | --- | --- |
| `checked_add` | Trả `None` | Tiền, số dư, bộ đếm: cần biết để báo lỗi |
| `saturating_add` | Dừng ở `MAX` | Giá trị chỉ cần chặn trên, như thanh tiến độ |
| `wrapping_add` | Quay vòng về 0 | Hiếm khi cần, như một số thuật toán băm |

Có `checked_sub`, `checked_mul`… tương tự. Khi audit, phép cộng trừ tiền không kiểm tra tràn là chỗ cần đặt câu hỏi. Xem [Option và Result](./errors.md) để xử lý kết quả `None`.

## 3. String và &str

```rust
fn chao(ten: &str) {
    println!("Chào {ten}");
}

fn main() {
    let literal = "Lan";
    let mut ten = String::from("Minh");
    ten.push_str(" Anh");
    chao(literal);
    chao(&ten);
    assert_eq!(ten, "Minh Anh");
}
```

String sở hữu buffer văn bản UTF-8 và có thể thay đổi độ dài. &str là lát nhìn vào chuỗi có sẵn, không sở hữu buffer. Hàm chỉ đọc tên thường nhận &str; cần lưu tên riêng thì dùng String.

`String::from("Lan")` hoặc `"Lan".to_owned()` tạo chuỗi sở hữu. `.as_str()` mượn phần chữ của String. Literal có kiểu `&'static str`, nhưng &str mượn từ một String không tự sống suốt chương trình. Đọc [ownership](./ownership.md) khi project bắt đầu mượn/sửa chuỗi.

## 4. Chữ, tuple và array

```rust
fn main() {
    let chu: char = 'ế';
    let mon: (&str, u32) = ("Trà", 18000);
    let gia: [u32; 2] = [25000, 18000];
    assert_eq!(chu, 'ế');
    assert_eq!(mon.0, "Trà");
    assert_eq!(gia[1], 18000);
    assert_eq!("ế".len(), 3);
    assert_eq!("ế".chars().count(), 1);
}
```

Char dùng nháy đơn, chứa một Unicode scalar value. Chuỗi dùng nháy kép; len của chuỗi đếm byte UTF-8. Một ký tự hiển thị có thể gồm nhiều scalar values, nên cũng không suy ra luôn số ký tự hiển thị từ chars().count().

Tuple gom các giá trị có thể khác kiểu; `.0` lấy giá trị đầu tiên. Array có cùng kiểu phần tử và độ dài cố định trong kiểu. Chỉ số bắt đầu từ 0. Danh sách cần thêm/bớt khi chạy thì xem [Vec](./collections.md).

## Tự làm

Đổi giá và số ly trong ví dụ đầu; chỉ ra kiểu của từng biến. Viết thêm một tên học viên bằng String, truyền bằng cách mượn cho hàm chào, rồi in tên lần nữa.

**Dùng trong:** [bài Hàm — đọc tham số](./functions.md#tham-so) · [hóa đơn — hàm tính tiền](../01-gio-hang/README.md#ham-tinh-tien) · [giỏ hàng — kiểu số và chuỗi](../01-gio-hang/gio-hang-day-du.md#gio-1).
