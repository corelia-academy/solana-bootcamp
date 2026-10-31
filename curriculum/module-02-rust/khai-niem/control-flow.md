# Điều kiện và vòng lặp — Máy chọn việc gì, lặp đến đâu?

`if`/`else` và `match` chọn đoạn code sẽ chạy; `for`, `while` và `loop` lặp lại một đoạn code.

## 1. If/else chọn theo điều kiện bool

```rust
fn main() {
    let tong = 68000;
    if tong >= 60000 {
        println!("Được tặng nước");
    } else {
        println!("Chưa đủ tiền nhận quà");
    }
    let co_qua = tong >= 60000;
    assert!(co_qua);
}
```

If đọc là “nếu”, else là “còn không”. `>=` kiểm tra lớn hơn hoặc bằng, cho true/false. So sánh khác thường gặp: `==`, `!=`, `<`, `>`, `<=`. Dấu `=` đơn dùng gán, không dùng hỏi bằng nhau.

Có thể dùng if làm giá trị: `let nhan = if co_qua { "Có" } else { "Không" };`. Hai nhánh phải có kiểu tương thích. Rust yêu cầu điều kiện là bool, không tự coi số 0 hoặc chuỗi rỗng là false.

## 2. Match chọn theo các trường hợp

```rust
fn main() {
    let input = "yes";
    let nhan = match input {
        "yes" => "Đồng ý",
        "no" => "Không đồng ý",
        _ => "Không hợp lệ",
    };
    assert_eq!(nhan, "Đồng ý");
}
```

Bên trái `=>` là pattern cần khớp; bên phải là việc/giá trị của nhánh. `_` bắt phần còn lại. Match phải bao phủ mọi trường hợp. Với enum, viết rõ từng variant giúp compiler nhắc khi thêm variant mới.

## 3. For, while, loop

```rust
fn main() {
    let mut tong = 0;
    for gia in [25000, 18000] {
        tong += gia;
    }
    assert_eq!(tong, 43000);

    let mut con_lai = 2;
    while con_lai > 0 {
        con_lai -= 1;
    }

    let mut lan = 0;
    loop {
        lan += 1;
        if lan == 3 { break; }
    }
    assert_eq!(lan, 3);
}
```

For duyệt từng phần tử. While kiểm tra điều kiện trước mỗi lượt. Loop lặp đến khi break. Continue bỏ phần còn lại của lượt hiện tại và sang lượt kế tiếp. Trong CLI, gặp EOF phải break vì đã hết input.

`0..3` gồm 0,1,2; `0..=3` gồm cả 3. `break value` còn có thể trả kết quả từ loop.

## 4. If let và let else

```rust
fn first(items: &[u32]) -> u32 {
    let Some(value) = items.first() else {
        return 0;
    };
    *value
}

fn main() {
    if let Some(value) = [10, 20].first() {
        println!("{value}");
    }
    assert_eq!(first(&[]), 0);
    assert_eq!(first(&[7]), 7);
}
```

If let dùng khi chỉ muốn xử lý một pattern. Let else giữ trường hợp đúng cho phần còn lại và loại trường hợp sai sớm; nhánh else phải rời luồng hiện tại, như return/continue/break phù hợp. Hai cú pháp này match pattern, không phải so sánh bằng nhau.

## Tự làm

Đổi tổng ở ví dụ đầu thành 60000 rồi 59999. Xác định mỗi trường hợp có nhận quà không. Sau đó viết vòng for cộng ba giá món do bạn tự chọn.

**Dùng trong:** [hóa đơn — quà tặng](../01-gio-hang/README.md#qua-tang) · [bình chọn — nhập nhiều lần](../02-binh-chon/README.md#poll-4) · [vé — thu gọn cây](../03-ve-su-kien/README.md#ticket-3).
