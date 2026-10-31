# Project 2 — Tự viết bình chọn terminal

Chương trình nhận phiếu, báo lỗi khi nhập sai và in kết quả khi thoát. Bắt đầu bằng project trống; code cần gõ đều nằm trong README này.

<a id="poll-0"></a>
## Bước 0 — Tạo project

Chưa cài Rust: [cài đặt](../bat-dau/01-cai-rust.md). Chưa rõ Cargo.toml/main.rs: [đọc folder](../bat-dau/02-doc-project.md). Project này tạo practice riêng cho bình chọn.

Từ gốc `solana-bootcamp`:

```shell
cargo new curriculum/module-02-rust/02-binh-chon/practice --name binh-chon --edition 2021 --vcs none
cd curriculum/module-02-rust/02-binh-chon/practice
```

Các lệnh sau chạy tại `practice`. Ta viết hai file: `src/poll.rs` xử lý phiếu, `src/main.rs` giao tiếp terminal.

<a id="poll-1"></a>
## Bước 1 — Biến chữ người dùng nhập thành một lựa chọn

**Khái niệm:** [module và pub](../khai-niem/modules.md) · [enum](../khai-niem/enums.md) · [Result](../khai-niem/errors.md) · [FromStr](../khai-niem/traits.md)

**Tạo `src/poll.rs`**, ghi toàn bộ đoạn sau:

<!-- file: src/poll.rs; mode: replace -->
```rust
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Choice {
    Yes,
    No,
    Abstain,
}

impl FromStr for Choice {
    type Err = &'static str;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        match input.trim().to_ascii_lowercase().as_str() {
            "yes" => Ok(Self::Yes),
            "no" => Ok(Self::No),
            "abstain" => Ok(Self::Abstain),
            _ => Err("chỉ nhận yes, no hoặc abstain"),
        }
    }
}
```

- `enum Choice` giới hạn phiếu vào ba trường hợp; một phiếu không thể vừa Yes vừa No.
- `pub` cho file khác dùng kiểu này. `use` đưa một tên có sẵn vào phạm vi sử dụng.
- `derive` nhờ compiler tạo hành vi: Debug để in, Clone/Copy để sao chép, PartialEq/Eq để so sánh, Hash để sau này làm khóa bảng đếm. `Choice` được Copy; `String` thì không.
- `impl FromStr for Choice` dạy Rust cách đọc chuỗi thành Choice. Vì vậy ta gọi được `.parse::<Choice>()`.
- `Self` là Choice; `type Err` chọn kiểu lỗi. `&'static str` ở đây là thông báo literal viết sẵn, có thể tồn tại suốt chương trình.
- `Result<Self, Self::Err>` có hai dạng: `Ok(lựa_chọn)` hoặc `Err(lý_do)`.
- `trim` bỏ khoảng trắng hai đầu; `to_ascii_lowercase` chuyển chữ ASCII sang thường; `as_str` cho match trên lát chuỗi.
- `match` chọn nhánh; `_` nhận phần còn lại. Mỗi `=>` nối điều kiện khớp với giá trị trả về.

**Thay toàn bộ `src/main.rs`**:

<!-- file: src/main.rs; mode: replace -->
```rust
mod poll;
use poll::Choice;

fn main() {
    for input in [" YES ", "no", "abstain", "maybe"] {
        println!("{input:?} -> {:?}", input.parse::<Choice>());
    }
}
```

`mod poll;` tìm file `poll.rs`. `use poll::Choice` cho gọi tên Choice ngắn gọn. `::<Choice>` chỉ rõ muốn parse ra kiểu gì; `{:?}` in bằng Debug.

Chạy `cargo run`: ba dòng đầu là Ok, dòng `maybe` là Err. Chuỗi sai là một kết quả mà ta xử lý được, chương trình không sập.

<a id="poll-2"></a>
## Bước 2 — Lưu và đếm phiếu

**Khái niệm:** [struct/impl](../khai-niem/structs.md) · [HashMap và Option](../khai-niem/collections.md) · [checked_add và ?](../khai-niem/errors.md) · [iterator tính tổng](../khai-niem/iterators.md) · [lifetime](../khai-niem/lifetimes.md)

**Thêm dòng này lên đầu `src/poll.rs`**, giữ phần đã viết:

<!-- file: src/poll.rs; mode: prepend -->
```rust
use std::collections::HashMap;
```

**Thêm vào cuối `src/poll.rs`**, ngoài các block đang có:

<!-- file: src/poll.rs; mode: append -->
```rust
pub struct Poll {
    title: String,
    counts: HashMap<Choice, u64>,
}

impl Poll {
    pub fn new(title: &str) -> Result<Self, &'static str> {
        if title.trim().is_empty() {
            return Err("tiêu đề không được rỗng");
        }
        Ok(Self { title: title.to_owned(), counts: HashMap::new() })
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn count(&self, choice: Choice) -> u64 {
        self.counts.get(&choice).copied().unwrap_or(0)
    }

    pub fn vote(&mut self, choice: Choice) -> Result<(), &'static str> {
        let next = self.count(choice).checked_add(1).ok_or("quá nhiều phiếu")?;
        self.counts.insert(choice, next);
        Ok(())
    }

    pub fn total(&self) -> u128 {
        self.counts.values().map(|count| u128::from(*count)).sum()
    }
}
```

Đọc theo việc chương trình phải làm:

1. `new` tạo poll: tiêu đề rỗng thì `return Err(...)` sớm; hợp lệ thì giữ bản String riêng. `Self { ... }` ở đây tạo Poll.
2. `HashMap<Choice, u64>` tra lựa chọn → số phiếu. Fields không có pub nên bên ngoài chỉ sửa qua methods.
3. `get(&choice)` trả `Option<&u64>`: Some khi có khóa, None khi chưa có. `.copied()` lấy bản số u64; `.unwrap_or(0)` cho mặc định 0 khi None, không phải unwrap gây panic.
4. `vote(&mut self, ...)` được sửa poll. `checked_add` kiểm tra tràn số; `ok_or` đổi None thành lỗi; `?` lấy số thành công hoặc trả lỗi sớm. Insert chỉ xảy ra sau khi đã kiểm tra.
5. `Result<(), ...>` nghĩa là thành công không mang thêm dữ liệu. `Ok(())` là kết quả ấy.
6. `total` duyệt các counter, chuyển từng số sang u128 trước khi cộng. `|count| ...` là hàm nhỏ gọi là closure; `*count` lấy số qua reference.

**Thay toàn bộ `src/main.rs`** để thử dữ liệu cố định trước:

<!-- file: src/main.rs; mode: replace -->
```rust
mod poll;
use poll::{Choice, Poll};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut poll = Poll::new("Có nên học bằng project?")?;
    for choice in [Choice::Yes, Choice::No, Choice::Yes] {
        poll.vote(choice)?;
    }
    println!("{}", poll.title());
    println!("Yes: {}", poll.count(Choice::Yes));
    println!("Tổng: {}", poll.total());
    Ok(())
}
```

Chạy `cargo run`: Yes bằng 2, tổng bằng 3. `Box<dyn Error>` cho main trả các kiểu lỗi khác nhau qua hành vi Error chung; chưa cần tự tạo kiểu Box. Dấu `?` chuyển lỗi ra caller, không tự in hay chạy lại.

`title()` trả lát mượn từ String của poll. Chữ ký có thể viết đầy đủ là `title<'a>(&'a self) -> &'a str`: kết quả chỉ hợp lệ trong thời gian mượn poll còn hợp lệ. Compiler suy ra được nên ta viết ngắn. Ghi lifetime không kéo dài tuổi thọ dữ liệu.

<a id="poll-3"></a>
## Bước 3 — In lựa chọn thành chữ dễ đọc

**Khái niệm:** [trait From và Display](../khai-niem/traits.md) · [`{}` và `{:?}`](../khai-niem/printing.md)

Hiện tại Choice in bằng Debug thành `Yes`. Ta muốn `println!("{}", choice)` ra `yes`.

**Thêm lên đầu `src/poll.rs`**:

<!-- file: src/poll.rs; mode: prepend -->
```rust
use std::fmt::{self, Display};
```

**Thêm vào cuối `src/poll.rs`**:

<!-- file: src/poll.rs; mode: append -->
```rust
impl From<Choice> for &'static str {
    fn from(choice: Choice) -> Self {
        match choice {
            Choice::Yes => "yes",
            Choice::No => "no",
            Choice::Abstain => "abstain",
        }
    }
}

impl Display for Choice {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let label: &str = (*self).into();
        formatter.write_str(label)
    }
}
```

`From<Choice>` là trait có tham số kiểu: chuyển Choice thành nhãn &str. `.into()` gọi phép chuyển đó; `*self` lấy Choice, được copy vì có Copy.

`Display` quy định cách in bằng `{}`. `formatter` là nơi ghi nội dung; `write_str` ghi nhãn vào đó và trả trạng thái format. `<'_>` để compiler suy ra lifetime của formatter.

Để thử ngay, **thêm `println!("{}", Choice::Yes);` trong main trước `Ok(())`**, chạy để thấy `yes`, rồi bỏ dòng thử. Chưa thay các phần khác.

<a id="poll-4"></a>
## Bước 4 — Nhận input thật trong vòng lặp

**Khái niệm:** [generic và trait bound](../khai-niem/traits.md) · [vòng lặp và match](../khai-niem/control-flow.md) · [in và flush](../khai-niem/printing.md)

**Thay toàn bộ `src/main.rs`** bằng đoạn này; giữ nguyên `poll.rs`:

<!-- file: src/main.rs; mode: replace -->
```rust
mod poll;

use poll::{Choice, Poll};
use std::fmt::Display;
use std::io::{self, Write};

fn show<T: Display>(value: T) {
    println!("{value}");
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut poll = Poll::new("Có nên học bằng project?")?;
    show(poll.title());
    println!("yes / no / abstain; quit để thoát");

    loop {
        print!("> ");
        io::stdout().flush()?;
        let mut input = String::new();
        if io::stdin().read_line(&mut input)? == 0 {
            break;
        }
        if input.trim().eq_ignore_ascii_case("quit") {
            break;
        }
        match input.parse::<Choice>() {
            Ok(choice) => match poll.vote(choice) {
                Ok(()) => show(choice),
                Err(error) => eprintln!("{error}"),
            },
            Err(error) => eprintln!("{error}"),
        }
    }

    for choice in [Choice::Yes, Choice::No, Choice::Abstain] {
        println!("{choice}: {}", poll.count(choice));
    }
    print!("Tổng: ");
    show(poll.total());
    Ok(())
}
```

Theo một lượt nhập:

- `loop` lặp cho đến `break`. `print!` không xuống dòng; `flush` đẩy dấu nhắc ra màn hình ngay.
- `read_line(&mut input)` sửa String để giữ dữ liệu nhập. Trả 0 byte là EOF: không còn dữ liệu, cần thoát.
- Gõ quit cũng thoát. Input khác được parse; lỗi thì `eprintln!` báo lỗi và vòng lặp vẫn tiếp tục.
- Hai match xử lý hai việc có thể thất bại: đọc lựa chọn và cộng phiếu.
- `show<T: Display>` là hàm generic: nhận kiểu T miễn là in được. Vì vậy dùng cùng hàm cho tiêu đề, Choice và số tổng. `T: Display` gọi là trait bound.

Chạy `cargo run`, nhập `yes`, `NO`, `abstain`, `yes`, `maybe`, `quit`. Cuối cùng cần:

```text
yes: 2
no: 1
abstain: 1
Tổng: 4
```

`maybe` có thông báo lỗi nhưng không được cộng vào tổng.

<a id="poll-5"></a>
## Bước 5 — Thêm kiểm tra tự động

**Khái niệm:** [tests và attributes](../khai-niem/tests.md) · [unwrap và xử lý lỗi](../khai-niem/errors.md)

**Thêm vào cuối `src/poll.rs`**:

<!-- file: src/poll.rs; mode: append -->
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_and_counts_votes() {
        assert_eq!(" YES ".parse(), Ok(Choice::Yes));
        assert_eq!("no".parse(), Ok(Choice::No));
        assert_eq!("abstain".parse(), Ok(Choice::Abstain));
        assert!("maybe".parse::<Choice>().is_err());
        assert!(Poll::new("   ").is_err());
        let mut poll = Poll::new("Học Rust?").unwrap();
        for choice in [Choice::Yes, Choice::No, Choice::Abstain, Choice::Yes] {
            poll.vote(choice).unwrap();
        }
        assert_eq!(poll.count(Choice::Yes), 2);
        assert_eq!(poll.total(), 4);
        assert_eq!(Choice::No.to_string(), "no");
    }

    #[test]
    fn overflow_keeps_counter_unchanged() {
        let mut poll = Poll::new("Giới hạn").unwrap();
        poll.counts.insert(Choice::Yes, u64::MAX);
        poll.counts.insert(Choice::No, 1);
        assert!(poll.vote(Choice::Yes).is_err());
        assert_eq!(poll.count(Choice::Yes), u64::MAX);
        assert_eq!(poll.total(), u128::from(u64::MAX) + 1);
    }
}
```

Trong test, unwrap lấy kết quả của dữ liệu cố định mà ta mong chắc chắn hợp lệ; nếu sai thì test thất bại. Với input thật ở main, ta vẫn xử lý Result bằng match.

```shell
cargo test
printf 'yes\nNO\nabstain\nmaybe\n' | cargo run
cargo fmt
```

Cần **2 tests pass**; lệnh pipe phải tự thoát ở EOF, tổng bằng 3.

**Tự làm tiếp:** thêm Veto vào Choice, cập nhật parser, nhãn và danh sách in kết quả. Compiler sẽ nhắc những match chưa xử lý variant mới.

Muốn thấy lỗi borrow? Trước vòng nhập, giữ `let title = poll.title();`, gọi `poll.vote(Choice::Yes)?;` rồi mới in title. Borrow đọc còn được dùng nên không cho sửa cùng lúc. In title trước khi vote rồi bỏ đoạn thử.

Muốn thử `let else`? Trong vòng nhập, `let Ok(choice) = input.parse::<Choice>() else { eprintln!("Phiếu sai"); continue; };` loại nhánh sai sớm; sau đó xử lý `poll.vote(choice)`. `if let Ok(choice) = ...` phù hợp khi chỉ cần làm gì đó trong nhánh đúng. Đây là cách viết khác của control flow đã dùng, không cần để hoàn thành bài.

[Final](./final/src/poll.rs) để đối chiếu sau, có thêm một số assertions. [Tiếp: Project 3](../03-ve-su-kien/README.md) · [Về module](../README.md)
