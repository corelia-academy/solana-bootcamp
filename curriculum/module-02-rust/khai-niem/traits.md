# Generics và traits — Kiểu này có thể làm gì?

Bình chọn dùng FromStr để đọc chữ, Display để in và `show<T: Display>` để dùng chung hàm. Đọc từng phần theo thứ đang gặp. Ví dụ chạy ở [thư mục nháp](./README.md#thu-muc-nhap).

## 1. Generic là vị trí để điền kiểu

```rust
struct Hop<T> {
    value: T,
}

impl<T> Hop<T> {
    fn value(&self) -> &T {
        &self.value
    }
}

fn main() {
    let so = Hop { value: 42_u32 };
    let chu = Hop { value: String::from("Lan") };
    assert_eq!(*so.value(), 42);
    assert_eq!(chu.value(), "Lan");
}
```

T là tên tham số kiểu, không phải một kiểu có sẵn. Hop<u32> chứa u32; Hop<String> chứa String. Compiler vẫn kiểm tra kiểu cụ thể tại cách dùng, không tự coi dữ liệu là “bất cứ thứ gì” khi chạy.

Bạn đã gặp cách điền kiểu ở Vec<String> và Result<u32, Error>.

## 2. Trait mô tả hành vi, bound yêu cầu hành vi

```rust
use std::fmt::Display;

fn show<T: Display>(value: T) {
    println!("{value}");
}

fn main() {
    show("Lan");
    show(50000_u32);
}
```

T có thể khác nhau ở từng lời gọi. `T: Display` buộc kiểu đó in được bằng `{}`, nên bên trong hàm được phép format value. Yêu cầu này gọi là trait bound.

Có thể viết `fn show(value: impl Display)` trong trường hợp này. Hoặc dùng `where T: Display` sau chữ ký để nhiều bound dễ đọc hơn. Với nhiều tham số, cùng một T buộc chúng cùng kiểu; hai tham số impl Display có thể khác kiểu.

`Display` và `Debug` là hai hành vi khác nhau; derive Debug không tự cho Display. Đọc [in dữ liệu](./printing.md) khi phân vân {} và {:?}.

## 3. Implement trait cho kiểu của mình

```rust
use std::fmt::{self, Display};

struct Diem(u8);

impl Display for Diem {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}/100", self.0)
    }
}

fn main() {
    assert_eq!(Diem(80).to_string(), "80/100");
    println!("{}", Diem(80));
}
```

`impl Display for Diem` nghĩa là cài hành vi Display cho Diem. Method và chữ ký phải đáp ứng trait yêu cầu. Formatter là nơi ghi, fmt::Result là trạng thái việc ghi; `'_` để compiler suy ra lifetime. Diem(u8) là struct một field không tên, lấy bằng `.0`.

## 4. FromStr và associated type Err

```rust
use std::str::FromStr;

#[derive(Debug, PartialEq)]
struct Diem(u8);

impl FromStr for Diem {
    type Err = &'static str;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        let n = input.parse::<u8>().map_err(|_| "không phải u8")?;
        if n > 100 { return Err("điểm vượt 100"); }
        Ok(Self(n))
    }
}

fn main() {
    assert_eq!("80".parse::<Diem>(), Ok(Diem(80)));
    assert_eq!("101".parse::<Diem>(), Err("điểm vượt 100"));
}
```

Self là Diem. `type Err` chọn kiểu lỗi cho implementation đó, gọi là associated type. `Self::Err` đọc là kiểu Err đã chọn. FromStr quy định cách đọc chuỗi; parse sử dụng implementation này.

## 5. Generic trait như From<Choice>

Trait cũng có thể có tham số kiểu. `impl From<Choice> for &'static str` trong poll cài cách chuyển Choice thành nhãn literal. Một kiểu có thể implement From từ nhiều kiểu nguồn khác nhau. `let label: &str = choice.into()` dùng kiểu đích để chọn phép chuyển.

Phân biệt:

| Cú pháp | Mục đích |
| --- | --- |
| impl Poll | Hành vi gắn với kiểu Poll |
| impl Display for Choice | Cài trait cho Choice |
| T: Display hoặc impl Display ở tham số | Yêu cầu kiểu được truyền vào có Display |
| dyn Error | Dùng hành vi Error chung qua trait object |

## 6. Derive sinh implementation giúp mình

Debug/Clone/Copy/PartialEq/Eq/Hash trong derive tạo các implementation phù hợp nếu field đáp ứng điều kiện. Không phải mọi trait đều derive được; Display của Choice được viết bằng tay. Attribute là nhóm cú pháp rộng hơn; không phải mọi `#[...]` đều là macro.

## Tự làm

Thêm một kiểu Gia(u32), implement Display để in “25000đ”. Truyền Gia vào show mà không sửa show. Đạt khi giải thích được vì sao T cần bound.

**Quay lại:** [bình chọn — FromStr](../02-binh-chon/README.md#poll-1) · [bình chọn — From và Display](../02-binh-chon/README.md#poll-3) · [bình chọn — show generic](../02-binh-chon/README.md#poll-4).
