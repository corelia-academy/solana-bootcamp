# Danh sách và bảng tra — Array, slice, Vec, HashMap

Gặp `vec!`, `&[CartItem]` hoặc `HashMap<Choice, u64>` thì đọc đúng phần dưới. Chạy ví dụ trong [thư mục nháp](./README.md#thu-muc-nhap).

## 1. Array và chỉ số

```rust
fn main() {
    let gia = [25000, 18000];
    assert_eq!(gia[0], 25000);
    assert_eq!(gia.get(9), None);
}
```

Array chứa các phần tử cùng kiểu, độ dài cố định trong kiểu. Index bắt đầu từ 0. Dùng `[index]` với index vượt giới hạn sẽ panic. Get trả Option để caller xử lý trường hợp không tồn tại.

## 2. Vec thêm/bớt được khi chạy

```rust
fn main() {
    let mut gio: Vec<String> = vec![String::from("Cà phê")];
    gio.push(String::from("Trà"));
    assert_eq!(gio.len(), 2);
    for mon in &gio {
        println!("{mon}");
    }
    assert_eq!(gio.len(), 2);
}
```

`Vec<String>` là vector chứa String. Macro vec! tạo danh sách ban đầu, push thêm một phần tử. `&gio` cho vòng lặp mượn từng món nên giữ được giỏ. Duyệt Vec sở hữu bằng `for mon in gio` sẽ tiêu thụ vector.

## 3. Slice là cách mượn một đoạn dãy

```rust
fn tong(items: &[u32]) -> u32 {
    items.iter().sum()
}

fn main() {
    let a = [1, 2, 3];
    let v = vec![4, 5];
    assert_eq!(tong(&a), 6);
    assert_eq!(tong(&v), 9);
    assert_eq!(tong(&a[..2]), 3);
}
```

`&[u32]` là slice reference, có thể nhận cả array và vector. Slice không sở hữu danh sách mới. `[..2]` lấy trước index 2, tức index 0 và 1. Muốn hiểu dấu &: [borrowing](./ownership.md).

## 4. HashMap tìm bằng khóa

```rust
use std::collections::HashMap;

fn main() {
    let mut phieu: HashMap<&str, u64> = HashMap::new();
    assert_eq!(phieu.get("yes"), None);
    phieu.insert("yes", 2);
    assert_eq!(phieu.get("yes"), Some(&2));
    phieu.insert("yes", 3);
    assert_eq!(phieu.get("yes").copied().unwrap_or(0), 3);
}
```

HashMap<K,V> gắn khóa K với giá trị V. Insert vào khóa đã có thay giá trị cũ. Get trả reference đến value, nên thấy Some(&2). Copied biến Option<&u64> thành Option<u64>; unwrap_or cung cấp mặc định nếu None.

Trong poll, khóa là Choice nên Choice cần Eq/Hash. HashMap không hứa thứ tự duyệt cố định; main dùng một array các Choice để in theo thứ tự mong muốn.

## Tự làm

Tạo danh bạ tên → email. Thử tìm một tên không có, xử lý None bằng thông báo. Sau đó tạo vector ba món và in mà vẫn giữ vector dùng được sau vòng lặp.

**Quay lại:** [giỏ hàng — thêm món](../01-gio-hang/gio-hang-day-du.md#gio-3) · [bình chọn — bảng đếm](../02-binh-chon/README.md#poll-2).
