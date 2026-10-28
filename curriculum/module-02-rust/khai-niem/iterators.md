# Iterator và closure — Biến đổi từng phần tử

Khi chuỗi `.iter().map(...).sum()` làm bạn rối, theo dõi **kiểu phần tử sau mỗi bước**. Chạy ví dụ ở [thư mục nháp](./README.md#thu-muc-nhap).

## 1. Từ vòng for đến iterator

```rust
fn main() {
    let gia = vec![25000_u32, 18000];
    let mut tong = 0;
    for value in &gia {
        tong += value;
    }
    let tong_2: u32 = gia.iter().sum();
    assert_eq!(tong, 43000);
    assert_eq!(tong, tong_2);
    assert_eq!(gia.len(), 2);
}
```

Iterator tạo phần tử lần lượt. `.iter()` mượn từng phần tử; `.sum()` tiêu thụ iterator để cộng. Vector gốc vẫn còn. Gọi `next()` thủ công sẽ nhận Some(item) hoặc None khi hết.

## 2. Closure là hàm nhỏ không cần đặt tên

```rust
fn main() {
    let tang_mot = |n: u32| n + 1;
    assert_eq!(tang_mot(2), 3);
    let ds: Vec<u32> = [1, 2, 3].iter().copied().map(tang_mot).collect();
    assert_eq!(ds, vec![2, 3, 4]);
}
```

Phần giữa hai dấu `|` là tham số; phần sau là thân. Trong project, `|item| item.subtotal()` nhận một item, trả số tiền. Closure còn có thể truy cập biến xung quanh theo quy tắc borrow/move phù hợp; các ví dụ này chưa cần chi tiết đó.

## 3. Lọc rồi đổi rồi gom

```rust
fn main() {
    let so = vec![1_u32, 2, 3, 4, 5];
    let binh_phuong: Vec<u32> = so.iter().copied()
        .filter(|n| *n % 2 == 1)
        .map(|n| n * n)
        .collect();
    assert_eq!(binh_phuong, vec![1, 9, 25]);
    assert_eq!(so.len(), 5);
}
```

| Bước | Item |
| --- | --- |
| iter | &u32 |
| copied | u32 |
| filter | Vẫn u32; predicate nhận &u32 để kiểm tra |
| map | u32 là bình phương |
| collect | Gom item thành Vec theo kiểu yêu cầu |

Map/filter là adaptor: phần lớn công việc xảy ra khi iterator được duyệt hoặc tiêu thụ, như collect/sum/for. Chỉ tạo chuỗi map chưa có nghĩa đã chạy hết việc trong đó.

## 4. Iter, iter_mut, into_iter trên Vec sở hữu

Iter trả &T, chỉ mượn. Iter_mut trả &mut T, cho sửa từng phần tử. Into_iter tiêu thụ Vec sở hữu và trả T; không dùng lại tên Vec cũ sau đó. IntoIterator trên reference có hành vi mượn tương ứng, nên đừng áp dụng máy móc quy tắc của Vec sở hữu cho mọi receiver.

Trong cây Merkle, `chunks(2)` duyệt các slice tối đa hai phần tử; map băm từng cặp; collect tạo tầng mới. Enumerate thêm chỉ số vào mỗi item, phù hợp sinh proof cho từng khách.

## Tự làm

Viết cùng một phép tính “tổng gấp đôi từng giá” bằng for, rồi bằng map/sum. Vector gốc phải vẫn dùng được. Đạt khi chỉ ra được item đang là số hay reference tại mỗi bước.

**Quay lại:** [giỏ hàng — tổng](../01-gio-hang/gio-hang-day-du.md#gio-3) · [bình chọn — tổng counter](../02-binh-chon/README.md#poll-2) · [vé — tầng mới](../03-ve-su-kien/README.md#ticket-3).
