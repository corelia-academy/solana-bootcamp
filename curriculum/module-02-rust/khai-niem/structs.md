# Struct và impl — Dữ liệu của một món và việc nó làm

Struct gom các dữ liệu thuộc cùng một thứ, như tên, giá và số lượng của một món; `impl` gắn hành vi cho kiểu đó.

## 1. Từ ba biến rời đến một món

```rust
struct Mon {
    ten: String,
    gia: u32,
    so_ly: u32,
}

fn main() {
    let ca_phe = Mon {
        ten: String::from("Cà phê"),
        gia: 25000,
        so_ly: 2,
    };
    println!("{}: {}đ", ca_phe.ten, ca_phe.gia * ca_phe.so_ly);
}
```

`struct Mon` khai báo một kiểu, chưa tạo món cụ thể. Trong main, `Mon { ... }` tạo một giá trị theo kiểu đó. Ten, gia, so_ly là các field; dấu `.` lấy field từ giá trị.

Trong phần khai báo kiểu, `gia: u32` nói field có kiểu gì. Khi tạo giá trị, `gia: 25000` điền giá trị cho field. Cùng dấu hai chấm nhưng khác vị trí, vì một bên định nghĩa khuôn và một bên điền dữ liệu.

String sở hữu tên để món giữ được tên riêng. Chi tiết ở [kiểu dữ liệu](./types.md).

## 2. Thêm hành vi bằng impl

```rust
struct Mon {
    gia: u32,
    so_ly: u32,
}

impl Mon {
    fn new(gia: u32, so_ly: u32) -> Self {
        Self { gia, so_ly }
    }

    fn thanh_tien(&self) -> u64 {
        u64::from(self.gia) * u64::from(self.so_ly)
    }

    fn them_ly(&mut self) {
        self.so_ly += 1;
    }
}

fn main() {
    let mut mon = Mon::new(25000, 2);
    assert_eq!(mon.thanh_tien(), 50000);
    mon.them_ly();
    assert_eq!(mon.thanh_tien(), 75000);
}
```

| Gặp | Đọc thành lời |
| --- | --- |
| `impl Mon` | Các hành vi của kiểu Mon |
| `Self` | Kiểu hiện tại, ở đây là Mon |
| `Self { gia, so_ly }` | Tạo Mon; viết tắt gia: gia, so_ly: so_ly |
| `Mon::new(...)` | Gọi hàm gắn với kiểu, không cần một món có sẵn |
| `mon.thanh_tien()` | Gọi method trên món cụ thể |
| `&self` | Mượn món để đọc, vẫn giữ món cho caller |
| `&mut self` | Mượn món để sửa |

New là tên theo quy ước, không phải từ khóa đặc biệt. Method là hàm nhận self theo một dạng nào đó. Một kiểu có thể có nhiều block impl. Đọc [hàm](./functions.md) nếu đầu vào/kết quả còn lạ; đọc [borrowing](./ownership.md) để hiểu vì sao có dấu &.

## 3. Pub và derive

`pub struct` mở kiểu ra khỏi module; từng field vẫn có quyền truy cập riêng. Giữ field riêng tư cho phép các method kiểm soát cách sửa dữ liệu.

`#[derive(Debug)]` sinh khả năng in bằng Debug nếu các field hỗ trợ. `derive(Clone)` cho tạo bản sao bằng clone; không có nghĩa là mọi clone đều miễn phí.

## Tự làm

Thêm field ten vào ví dụ method, truyền tên khi new. Thêm method chỉ đọc tên. Đạt khi tự chọn đúng receiver đọc hoặc sửa và giải thích được Self là gì.

**Dùng trong:** [giỏ hàng — gom một món](../01-gio-hang/gio-hang-day-du.md#gio-2) · [bình chọn — lưu poll](../02-binh-chon/README.md#poll-2).
