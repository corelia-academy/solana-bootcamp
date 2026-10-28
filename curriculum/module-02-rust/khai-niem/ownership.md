# Ownership và borrowing — Ai giữ dữ liệu, ai được đọc/sửa?

Bạn gặp String, `&cart`, `&self`, `&mut self`. Bài này dùng một cái tên để giải thích trước, rồi quay lại giỏ hàng. Chạy ví dụ riêng trong [thư mục nháp](./README.md#thu-muc-nhap).

## 1. String có người sở hữu

```rust
fn main() {
    let ten = String::from("Lan");
    let ten_moi = ten;
    println!("{ten_moi}");
}
```

Sau phép gán, ownership chuyển từ binding ten sang ten_moi. Việc chuyển gọi là move. Ten cũ không còn được dùng. Khi owner ra khỏi scope, giá trị được drop và tài nguyên của nó được dọn.

```compile_fail,E0382
fn main() {
    let ten = String::from("Lan");
    let ten_moi = ten;
    println!("{ten}");
}
```

Bạn không cần tự gọi free cho String trong các ví dụ này. Compiler kiểm tra đường sử dụng để tránh dùng dữ liệu đã hết quyền/hết hiệu lực.

## 2. Muốn xem mà vẫn giữ bản gốc: mượn

```rust
fn chao(ten: &str) {
    println!("Chào {ten}");
}

fn main() {
    let ten = String::from("Lan");
    chao(&ten);
    println!("Vẫn giữ: {ten}");
}
```

`&ten` tạo reference, cho hàm truy cập mà không lấy ownership. Ở đây &String chuyển thành &str theo kiểu tham số cần. Hàm chào xong thì caller vẫn giữ String.

Trong project, `total(&cart)` cũng mượn để đọc giỏ. Nếu nhận nguyên Vec sở hữu và caller truyền cart, giỏ sẽ bị move.

## 3. Muốn sửa: mượn bằng &mut

```rust
fn doi_ten(ten: &mut String) {
    ten.push_str(" Nguyễn");
}

fn main() {
    let mut ten = String::from("Lan");
    doi_ten(&mut ten);
    assert_eq!(ten, "Lan Nguyễn");
}
```

Mut trên biến cho phép tạo mutable borrow. &mut ở tham số cho phép hàm sửa dữ liệu nó mượn. `mut ten: &String` không biến shared reference thành &mut String.

Với cùng vùng dữ liệu và các borrow còn hiệu lực: nhiều reference đọc `&T`, hoặc một reference độc quyền `&mut T`. Với các kiểu cơ bản trong bài, shared reference dùng để đọc; interior mutability là chủ đề về sau.

## 4. Borrow còn sống tới lúc nào?

```compile_fail,E0502
fn main() {
    let mut ten = String::from("Lan");
    let view = &ten;
    ten.push('!');
    println!("{view}");
}
```

View còn được đọc sau khi sửa ten nên hai borrow chồng nhau. Sửa thứ tự để dùng xong view trước:

```rust
fn main() {
    let mut ten = String::from("Lan");
    let view = &ten;
    println!("{view}");
    ten.push('!');
    assert_eq!(ten, "Lan!");
}
```

Borrow thường kết thúc sau lần dùng cuối mà compiler xác định, không nhất thiết phải hết block. Reference không được sống quá dữ liệu gốc; xem [lifetimes](./lifetimes.md).

## 5. Khi nào dùng Copy, khi nào dùng Clone?

Số như u32 là Copy: `let b = a` giữ cả a và b dùng được. String không Copy. `ten.clone()` tạo String sở hữu bản nội dung riêng, có chi phí theo độ dài. Clone đúng khi cần hai bản độc lập; chỉ cần xem dữ liệu thì borrow phù hợp hơn.

Chuỗi String thường có phần mô tả gồm con trỏ, độ dài, sức chứa và buffer nội dung trên heap. Move không bắt buộc sao chép toàn bộ buffer. Stack/heap là mô hình hữu ích để đọc dữ liệu; quyền sử dụng được quyết định theo kiểu và ownership, không chỉ bởi vị trí vật lý.

## Tự làm

Viết hàm nhận &str và in tên hai lần; gọi xong vẫn in tên ở main. Viết thêm hàm nhận &mut String để ghép chữ. Tự giải thích vì sao hai chữ ký khác nhau.

**Quay lại:** [giỏ hàng — giữ giỏ sau khi tính](../01-gio-hang/gio-hang-day-du.md#gio-3) · [giỏ hàng — đổi tên món](../01-gio-hang/gio-hang-day-du.md#gio-4) · [bình chọn — mượn tiêu đề](../02-binh-chon/README.md#poll-2).
