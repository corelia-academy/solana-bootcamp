# Lifetime — Reference hợp lệ trong thời gian nào?

Lifetime mô tả một reference còn hợp lệ trong bao lâu, viết bằng `'a` hoặc `'static`. Lifetime không kéo dài tuổi thọ dữ liệu; nó giúp compiler kiểm tra reference không sống lâu hơn dữ liệu nó trỏ tới.

## 1. Reference cần dữ liệu gốc còn sống

```compile_fail,E0597
fn main() {
    let view;
    {
        let ten = String::from("Lan");
        view = ten.as_str();
    }
    println!("{view}");
}
```

Ten bị drop khi ra khỏi block trong; view muốn dùng sau đó. Compiler từ chối để tránh reference trỏ vào dữ liệu không còn hợp lệ. Sửa bằng cách đặt owner ở scope sống đủ lâu hoặc chuyển ra giá trị sở hữu.

```rust
fn main() {
    let ten = String::from("Lan");
    let view = ten.as_str();
    println!("{view}");
}
```

## 2. Khi chỉ có một nguồn mượn

```rust
fn xem(ten: &str) -> &str {
    ten
}

fn main() {
    let ten = String::from("Lan");
    assert_eq!(xem(&ten), "Lan");
}
```

Compiler suy ra quan hệ: đầu ra mượn từ đầu vào. Viết rõ thì `fn xem<'a>(ten: &'a str) -> &'a str`. `'a` là tên quan hệ lifetime, không phải số giây, không cấp phát dữ liệu.

Method `title(&self) -> &str` của Poll cũng được suy ra: kết quả gắn với borrow của self. Không phải mọi hàm nhiều reference đều cần annotation; có các quy tắc suy ra cho trường hợp thường gặp.

## 3. Nhiều nguồn có thể tạo cùng một kết quả mượn

```rust
fn chon<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.is_empty() { b } else { a }
}

fn main() {
    let a = String::from("Lan");
    let b = String::from("Tên mặc định");
    assert_eq!(chon(&a, &b), "Lan");
}
```

Hàm có thể trả a hoặc b. Chữ ký yêu cầu kết quả dùng trong khoảng mà các borrow đầu vào đáp ứng lifetime được chọn. Không bắt hai owner tạo/hủy cùng lúc; compiler có thể chọn khoảng chung ngắn hơn.

## 4. Annotation không cứu dữ liệu đã bị drop

```compile_fail,E0515
fn sai<'a>() -> &'a str {
    let ten = String::from("Lan");
    ten.as_str()
}
```

Dù có `'a`, ten cục bộ vẫn bị drop. Trả String nếu muốn chuyển dữ liệu cho caller. Ghi lifetime mô tả quan hệ; không kéo dài tuổi thọ thật.

`&'static str` thường gặp với literal. Nó nói dữ liệu được tham chiếu có thể hợp lệ suốt chương trình. Một &str mượn từ String không tự có static. Vì vậy nguồn khách giả lập có thể trả Vec<&'static str>, còn chuỗi từ request thường cần giá trị sở hữu.

## Tự làm

Viết `struct View<'a> { name: &'a str }`, tạo nó từ một String. Thử đưa View ra khỏi scope owner rồi dùng để thấy lỗi; sửa để owner sống đủ lâu.

**Dùng trong:** [bình chọn — title](../02-binh-chon/README.md#poll-2) · [vé — nguồn khách literal](../03-ve-su-kien/README.md#ticket-1).
