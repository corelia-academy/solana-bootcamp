# Bài đầu tiên — Tính tiền một đơn cà phê

Một ly cà phê giá 25.000đ. Khách mua hai ly. Bạn tính được 50.000đ trên giấy; bây giờ ta viết một chương trình làm việc đó.

**Bài này chỉ có ba việc:** đặt tên cho số, tính tiền, chọn thông báo. Mỗi lần đọc một bước, chạy được rồi mới đi tiếp.

<a id="chuan-bi"></a>
## Bắt đầu

Chạy được [Hello World](../bat-dau/01-cai-rust.md) rồi thì dùng tiếp project hello_rust đó. Nếu đang làm ở practice từ trước, cứ dùng tiếp thư mục ấy.

Mỗi bước dưới thay nội dung `src/main.rs`. Lưu file và chạy `cargo run` trong thư mục project để xem kết quả.

<a id="in-tien"></a>
## 1. Cho máy in một số tiền

**Khái niệm:** [hàm main](../khai-niem/functions.md#main) · [in ra màn hình](../khai-niem/printing.md)

Gõ:

<!-- file: src/main.rs; mode: replace -->
```rust
fn main() {
    println!("Tiền cần trả: 25000đ");
}
```

`main` là nơi chương trình bắt đầu. Hai dấu `{` và `}` bao quanh những việc cần chạy. Ở giữa, `println!` yêu cầu máy in một dòng; phần trong dấu nháy là chữ cần in. Dấu `;` kết thúc câu lệnh.

Chạy `cargo run`. Dòng của chương trình cần là:

```text
Tiền cần trả: 25000đ
```

**Tự đổi:** thay chữ `Tiền cần trả` thành `Hóa đơn của Lan`. Chạy lại để thấy chính dòng bạn sửa xuất hiện, rồi đổi lại như cũ.

<a id="dat-ten"></a>
## 2. Đặt tên cho giá cà phê

**Khái niệm:** [biến và let](../khai-niem/variables.md)

Nếu số 25000 có tên là `gia`, ta có thể lấy nó ra dùng:

<!-- file: src/main.rs; mode: replace -->
```rust
fn main() {
    let gia = 25000;
    println!("Tiền cần trả: {gia}đ");
}
```

Dòng mới duy nhất cần hiểu là `let gia = 25000;`:

- `let`: tạo một tên để giữ giá trị.
- `gia`: tên tự đặt; ở đây có nghĩa là giá một ly.
- `= 25000`: giá trị mà tên đó đang giữ.

Tên giữ giá trị như vậy gọi là **biến**. `{gia}` trong dòng in nghĩa là: lấy giá trị của biến gia để chèn vào đây.

| Máy vừa chạy xong dòng nào? | Nó đang biết gì? |
| --- | --- |
| `let gia = 25000;` | gia là 25000 |
| `println!(...)` | Lấy 25000 để in ra |

Chạy: vẫn ra 25000đ.

**Thử:** nếu đổi dòng đầu thành `let gia = 30000;`, dòng in có phải sửa nữa không? Chạy để kiểm tra, rồi đổi lại 25000.

<details>
<summary>Đối chiếu</summary>

Không cần sửa dòng in. Nó đọc giá trị từ biến gia nên tự in 30000đ.

</details>

<a id="nhan-so-ly"></a>
## 3. Khách mua hai ly

Trên giấy: `25000 × 2 = 50000`. Trong Rust, dấu nhân viết là `*`:

<!-- file: src/main.rs; mode: replace -->
```rust
fn main() {
    let gia = 25000;
    let so_ly = 2;
    let tong = gia * so_ly;
    println!("Tiền cần trả: {tong}đ");
}
```

`so_ly` là số ly khách mua. `tong` giữ kết quả phép nhân. Máy chạy từ trên xuống:

| Sau dòng | Giá trị |
| --- | --- |
| `let gia = 25000;` | gia = 25000 |
| `let so_ly = 2;` | so_ly = 2 |
| `let tong = gia * so_ly;` | tong = 25000 × 2 = 50000 |

Chạy: cần thấy `Tiền cần trả: 50000đ`.

**Tự làm:** khách mua ba ly. Chỉ sửa một số, dự đoán số tiền rồi chạy. Đạt khi thấy 75000đ. Sau đó đổi về hai ly.

<a id="cong-tra"></a>
## 4. Mua thêm một ly trà

Trà giá 18.000đ. Đơn hàng là `tiền cà phê + tiền trà`:

<!-- file: src/main.rs; mode: replace -->
```rust
fn main() {
    let gia_ca_phe = 25000;
    let so_ly = 2;
    let tien_ca_phe = gia_ca_phe * so_ly;
    let tien_tra = 18000;
    let tong = tien_ca_phe + tien_tra;
    println!("Tiền cần trả: {tong}đ");
}
```

Ở bước này ta đổi tên `gia` thành `gia_ca_phe` cho rõ đang nói đến món nào. Dấu `+` cộng hai số. Các dòng `let` vẫn làm đúng việc bạn đã biết: đặt tên cho một giá trị.

Tính trước: tiền cà phê 50000, tiền trà 18000, tổng 68000. Chạy để đối chiếu.

**Tự làm:** đổi giá trà thành 20000. Nếu tổng là 70000đ thì bạn đã sửa đúng chỗ. Đổi lại 18000 trước bước tiếp theo.

<a id="qua-tang"></a>
## 5. Đủ 60.000đ thì tặng nước

**Khái niệm:** [if/else](../khai-niem/control-flow.md)

Quán có quy định: tổng từ 60.000đ trở lên thì có quà. Máy cần kiểm tra điều kiện trước khi chọn câu để in.

<!-- file: src/main.rs; mode: replace -->
```rust
fn main() {
    let gia_ca_phe = 25000;
    let so_ly = 2;
    let tien_ca_phe = gia_ca_phe * so_ly;
    let tien_tra = 18000;
    let tong = tien_ca_phe + tien_tra;
    println!("Tiền cần trả: {tong}đ");

    if tong >= 60000 {
        println!("Được tặng nước");
    } else {
        println!("Chưa đủ tiền nhận quà");
    }
}
```

Đọc phần mới thành tiếng:

> **Nếu** tổng lớn hơn hoặc bằng 60000, in “Được tặng nước”. **Còn không**, in “Chưa đủ tiền nhận quà”.

`if` là “nếu”; `>=` là “lớn hơn hoặc bằng”; `else` là trường hợp còn lại. Mỗi cặp ngoặc `{ ... }` giữ câu lệnh thuộc trường hợp đó. Một lần chạy chỉ chọn một trong hai thông báo quà.

Với hai ly cà phê và một ly trà, kết quả:

```text
Tiền cần trả: 68000đ
Được tặng nước
```

**Thử:** đổi so_ly thành 1. Tổng còn 43000đ nên phải in thông báo chưa đủ tiền. Đổi lại 2.

<a id="tu-lam"></a>
## 6. Tự viết một đơn khác

Giữ chương trình ở bước 5, tự sửa để:

- Cà phê giá 20.000đ, mua hai ly.
- Trà giá 18.000đ, mua một ly.
- Quy định quà vẫn là từ 60.000đ trở lên.

Tính tổng và chọn thông báo quà trước khi chạy.

<details>
<summary>Đối chiếu kết quả</summary>

Tổng là 58000đ; chưa đủ tiền nhận quà. Chỉ cần sửa gia_ca_phe thành 20000 trong ví dụ bước 5.

</details>

Tự kiểm tra: chỉ ra được dòng nào giữ giá, dòng nào giữ số lượng, dòng nào tính tiền, dòng nào quyết định có quà.

Bài thêm: viết đơn một cà phê 25.000đ và một trà 18.000đ. Kết quả phải là 43000đ, chưa nhận quà.

<a id="ham-tinh-tien"></a>
## 7. Dùng cùng một phép tính cho nhiều món

Giá nhân số lượng dùng được cho cả cà phê lẫn trà. Ta đặt tên công thức là tinh_tien để gọi lại với những số khác nhau.

**Khái niệm:** [hàm: tham số, `->` và giá trị trả về](../khai-niem/functions.md#tham-so) · [kiểu số](../khai-niem/types.md#so)

Thay toàn bộ src/main.rs bằng:

<!-- file: src/main.rs; mode: replace -->
```rust
fn tinh_tien(gia: u32, so_ly: u32) -> u32 {
    gia * so_ly
}

fn main() {
    let tien_ca_phe = tinh_tien(25000, 2);
    let tien_tra = tinh_tien(18000, 1);
    let tong = tien_ca_phe + tien_tra;
    println!("Tiền cần trả: {tong}đ");
    if tong >= 60000 {
        println!("Được tặng nước");
    } else {
        println!("Chưa đủ tiền nhận quà");
    }
}
```

Chạy cargo run: vẫn là 68000đ và được tặng nước. Code đã dùng chung công thức cho hai món.

**Tự làm:** khách mua hai ly trà, vẫn hai cà phê. Sửa đúng lời gọi tính trà; tổng mới phải là 86000đ. Chỉ ra 18000 vào tham số nào, 2 vào tham số nào, và kết quả của hàm được giữ ở biến nào.

[Bài giỏ hàng đầy đủ để học tiếp](./gio-hang-day-du.md) · [Tìm một bài khái niệm](../khai-niem/README.md) · [Về module](../README.md).
