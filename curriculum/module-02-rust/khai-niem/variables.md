# Biến — Đặt tên cho giá trị

Biến đặt tên cho một giá trị để dùng lại. Mặc định biến không đổi được; muốn gán giá trị mới phải khai báo `mut`.

## 1. Đọc một dòng let

```rust
fn main() {
    let gia = 25000;
    let so_ly = 2;
    let tong = gia * so_ly;
    println!("{tong}");
    assert_eq!(tong, 50000);
}
```

`let` tạo binding giữa tên và giá trị. `gia` là tên tự chọn; `25000` là giá trị. `=` ở đây gắn tên cho giá trị, không phải câu hỏi “hai bên có bằng nhau không”. So sánh bằng nhau dùng `==`.

Máy đọc từ trên xuống. Khi tính tong, nó đọc giá trị mà gia và so_ly đang có. Tên không chứa dấu cách; có thể viết `gia_ca_phe` để dễ đọc.

## 2. Tổng không tự cập nhật khi đầu vào đổi

```rust
fn main() {
    let mut gia = 25000;
    let tong = gia * 2;
    gia = 30000;
    assert_eq!(gia, 30000);
    assert_eq!(tong, 50000);
}
```

Tong đã nhận kết quả 50000 lúc dòng tính chạy. Nó không giữ một công thức tự tính lại. Muốn có tổng mới phải chạy phép tính mới.

<a id="mut"></a>
## 3. Vì sao cần mut?

Mặc định một binding không cho gán lại:

```compile_fail,E0384
fn main() {
    let so_ly = 2;
    so_ly = 3;
}
```

Cho phép sửa bằng `mut`:

```rust
fn main() {
    let mut so_ly = 2;
    so_ly += 1;
    assert_eq!(so_ly, 3);
}
```

`+= 1` là cộng thêm một rồi gán lại. Dùng mut khi biến cần đổi trong lúc chương trình chạy. Việc bạn sửa số 2 thành 3 trong file rồi chạy lại là một lần chạy mới, không đòi mut.

<a id="const"></a>
## 4. Shadowing và const

```rust
fn main() {
    let input = "42";
    let input: u32 = input.parse().expect("chuỗi số cố định");
    const GIA_NUOC: u32 = 8000;
    assert_eq!(input + GIA_NUOC, 8042);
}
```

`let input` lần hai tạo binding mới cùng tên, gọi là shadowing. Nó có thể mang kiểu khác. Mut cho sửa giá trị của binding hiện tại, không cho tự đổi kiểu từ chuỗi sang số.

Const khai báo hằng, phải ghi kiểu và dùng biểu thức hợp lệ trong ngữ cảnh hằng. Tên thường viết hoa. Expect trong ví dụ là cách lấy kết quả với dữ liệu đã biết; input thật cần [xử lý lỗi](./errors.md).

## Tự làm

Tạo gia = 20000 và so_ly = 3. Tính tong. Sau đó tăng so_ly thêm 1, tính tổng mới vào một tên khác. Hai tổng phải là 60000 và 80000. Đạt khi giải thích được tại sao tổng cũ không tự đổi.

**Dùng trong:** [hóa đơn — đặt tên cho giá](../01-gio-hang/README.md#dat-ten) · [hóa đơn — mốc quà const](../01-gio-hang/README.md#ham-tinh-tien) · [giỏ hàng — tổng giỏ](../01-gio-hang/gio-hang-day-du.md#gio-3).
