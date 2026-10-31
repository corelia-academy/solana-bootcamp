# Hàm — Đặt tên cho một việc để gọi lại

Hàm đặt tên cho một đoạn code nhận đầu vào và trả kết quả, để gọi lại nhiều lần; `main` là hàm chương trình chạy đầu tiên.

<a id="main"></a>
## 1. Main là nơi bắt đầu

```rust
fn main() {
    println!("Bắt đầu bán hàng");
}
```

`fn` khai báo một hàm. `main` là tên hàm đặc biệt được gọi khi chương trình binary chạy. `()` là chỗ cho đầu vào; main ở đây không có tham số. `{ ... }` giữ các câu lệnh cần làm.

Máy bắt đầu ở main, chạy dòng in, rồi kết thúc. Kết quả là `Bắt đầu bán hàng`.

**Thử:** thêm một println ở dưới dòng cũ; nó chạy sau dòng cũ. Main chứa các việc chương trình chạy theo thứ tự từ trên xuống.

<a id="tham-so"></a>
## 2. Vì sao cần tự viết hàm?

Bạn đang tính hai đơn hàng. Công thức của cả hai đều là giá nhân số ly. Đặt tên công thức là `tinh_tien`, rồi đưa từng bộ số vào:

```rust
fn tinh_tien(gia: u32, so_ly: u32) -> u32 {
    gia * so_ly
}

fn main() {
    let don_a = tinh_tien(25000, 2);
    let don_b = tinh_tien(18000, 3);
    println!("Đơn A: {don_a}đ");
    println!("Đơn B: {don_b}đ");
    assert_eq!((don_a, don_b), (50000, 54000));
}
```

Kết quả: đơn A 50000đ, đơn B 54000đ. Một công thức, hai lần gọi. Hàm có thể được khai báo trước hoặc sau main nếu nằm trong phạm vi gọi được.

Đọc từng phần chữ ký:

| Viết | Nghĩa |
| --- | --- |
| `fn tinh_tien` | Khai báo việc có tên tinh_tien |
| `gia: u32` | Đầu vào thứ nhất tên gia, là số nguyên không âm 32 bit |
| `so_ly: u32` | Đầu vào thứ hai, cùng kiểu số |
| `-> u32` | Kết quả trả về cũng là u32 |
| `gia * so_ly` | Công thức tạo kết quả |

Tên đầu vào trong khai báo gọi là **tham số**. Các số cụ thể 25000 và 2 khi gọi gọi là **đối số**. Thứ tự có ý nghĩa: đối số thứ nhất vào gia, thứ hai vào so_ly. Kiểu `u32`: xem [kiểu số](./types.md#so).

Công thức ví dụ dùng số nhỏ cố định. Khi nhận số lớn từ bên ngoài, phải xét miền giá trị và [overflow](./types.md#overflow).

## 3. Máy đi qua một lời gọi như thế nào?

Với `let don_a = tinh_tien(25000, 2);`:

| Lần lượt | Chuyện xảy ra |
| --- | --- |
| 1 | Main gọi tinh_tien với 25000 và 2 |
| 2 | Bên trong hàm: gia = 25000, so_ly = 2 |
| 3 | Tính 25000 × 2 thành 50000 |
| 4 | Trả 50000 về main |
| 5 | Main gắn tên don_a cho kết quả đó |

Biến so_ly bên trong hàm không tự trở thành biến trong main. Đầu vào và kết quả là cách hai bên trao đổi dữ liệu rõ ràng.

<a id="tra-ve"></a>
## 4. In ra khác với trả về

```rust
fn in_loi_chao() {
    println!("Chào bạn");
}

fn tinh_tong(a: u32, b: u32) -> u32 {
    a + b
}

fn main() {
    in_loi_chao();
    let ket_qua = tinh_tong(2, 3);
    assert_eq!(ket_qua * 2, 10);
}
```

`in_loi_chao` làm một việc trên màn hình, không trả con số cho caller. Hàm không ghi kiểu trả về thì mặc định trả `()`, gọi là unit.

`tinh_tong` trả số 5, nên main còn dùng số đó để nhân 2 được. `println!` bên trong một hàm không tự biến thứ đã in thành dữ liệu trả về.

## 5. Vì sao dòng cuối không có dấu chấm phẩy?

```rust
fn tinh_tien(gia: u32, so_ly: u32) -> u32 {
    gia * so_ly
}
```

Biểu thức cuối không có `;` là kết quả của block. Thêm `;` sẽ bỏ giá trị đó, block trả unit, không khớp u32 đã hứa:

```compile_fail,E0308
fn tinh_tien(gia: u32, so_ly: u32) -> u32 {
    gia * so_ly;
}
```

Có thể viết `return gia * so_ly;` để trả rõ ràng. Khi thoát sớm giữa hàm, return rất hữu ích:

```rust
fn tinh_tien(gia: u32, so_ly: u32) -> u32 {
    if so_ly == 0 {
        return 0;
    }
    gia * so_ly
}

fn main() {
    assert_eq!(tinh_tien(25000, 0), 0);
}
```

## 6. Khi gặp method như coffee.subtotal()

Hàm gắn với một đối tượng được gọi là method. `&self` nói method đọc đối tượng hiện tại; `&mut self` cho sửa; `self` nhận ownership. Hai phần này được giải thích bằng món cà phê tại [struct và impl](./structs.md), [ownership và borrowing](./ownership.md).

`println!` có `!` vì là macro; nó không dùng cú pháp lời gọi hàm thông thường. Xem [in dữ liệu](./printing.md).

## Tự kiểm tra

Viết hàm `cong_tien(ca_phe: u32, tra: u32) -> u32`. Gọi với 50000 và 18000, lấy kết quả để in 68000. Sau đó gọi bằng hai số khác. Đạt khi chỉ ra được đầu vào, công thức và chỗ nhận kết quả, không cần nhìn mẫu.

Nguồn đối chiếu cú pháp: [Functions — Rust Book](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html).

**Dùng trong:** [hóa đơn — tự viết hàm](../01-gio-hang/README.md#ham-tinh-tien) · [giỏ hàng — subtotal](../01-gio-hang/gio-hang-day-du.md#gio-2) · [bình chọn — methods](../02-binh-chon/README.md#poll-2).
