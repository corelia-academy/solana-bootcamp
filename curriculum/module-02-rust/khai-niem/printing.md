# In ra màn hình — println và các dấu ngoặc

Gặp `println!("Tiền: {tong}đ")` thì đọc bài này. Ví dụ chạy riêng trong [thư mục nháp](./README.md#thu-muc-nhap).

## 1. In một câu cố định

```rust
fn main() {
    println!("Chào Lan");
}
```

Phần trong dấu nháy kép là văn bản. `println!` in một dòng rồi xuống dòng. Dấu `!` cho biết đây là macro: công cụ sinh code trong quá trình compile. Hiện tại bạn chỉ cần dùng đúng cú pháp gọi nó.

## 2. Chèn giá trị vào câu

```rust
fn main() {
    let tong = 50000;
    println!("Tiền: {tong}đ");
    println!("Tiền: {}đ", tong);
}
```

Hai dòng cùng in `Tiền: 50000đ`. `{tong}` lấy biến theo tên. `{}` lấy đối số phía sau dấu phẩy theo thứ tự.

```rust
fn main() {
    let ten = "Lan";
    let so_ly = 2;
    println!("{} mua {} ly", ten, so_ly);
}
```

Kết quả `Lan mua 2 ly`. Dấu ngoặc nhọn bên trong chuỗi là vị trí chèn dữ liệu; ngoặc nhọn bên ngoài chuỗi dùng tạo block code. Muốn in ngoặc nhọn nguyên văn trong chuỗi format, dùng `{{` và `}}`.

## 3. Debug khác với Display

```rust
fn main() {
    let ten = "Lan";
    let gia = [25000, 18000];
    println!("{ten}");
    println!("{ten:?}");
    println!("{gia:?}");
}
```

Display với `{}` thường để trình bày cho người dùng. Debug với `{:?}` hoặc `{gia:?}` để xem cấu trúc dữ liệu; string có thể kèm dấu nháy, array hiện cả danh sách. Struct của mình có thể thêm `#[derive(Debug)]` nếu các field hỗ trợ. Muốn tự quyết cách in Choice bằng `{}`, xem [traits](./traits.md).

## 4. Print, eprintln và flush

`print!` không tự xuống dòng, phù hợp dấu nhắc `> `. `eprintln!` ghi vào luồng lỗi stderr. Vòng nhập liệu dùng `stdout().flush()` để đẩy dấu nhắc ra ngay trước khi đợi người dùng gõ. Hai luồng stdout/stderr có thể hiển thị xen nhau.

## Tự làm

In “Lan mua 3 ly, tổng 75000đ”, giữ tên, số ly, tổng ở ba biến riêng. Đổi tên thành Minh mà không sửa nguyên câu format.

**Quay lại:** [hóa đơn — in tiền](../01-gio-hang/README.md#in-tien) · [bình chọn — in Choice](../02-binh-chon/README.md#poll-3).
