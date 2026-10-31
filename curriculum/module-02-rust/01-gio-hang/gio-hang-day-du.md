# Giỏ hàng đầy đủ — Tài liệu học tiếp

Bài này dùng struct, String, Vec và mượn dữ liệu. Hãy làm [bài hóa đơn đầu tiên](./README.md) trước.

Code của từng bước nằm trong README này và chạy được ngay; `starter` và `final` chỉ để đối chiếu.

<a id="gio-0"></a>
## Bước 0 — Tạo project của mình

Đã có practice từ bài hóa đơn thì chỉ cd vào đó, bỏ qua cargo new. Lưu bản hóa đơn trước khi thay bằng bài giỏ hàng. Chưa rõ file nào để sửa: [đọc folder](../bat-dau/02-doc-project.md).

Từ thư mục gốc `solana-bootcamp`:

```shell
cargo new curriculum/module-02-rust/01-gio-hang/practice --name gio-hang --edition 2021 --vcs none
cd curriculum/module-02-rust/01-gio-hang/practice
cargo run
```

Thấy `Hello, world!` là được. Từ giờ, mọi lệnh `cargo` trong bài chạy tại thư mục `practice` này. File cần sửa là `practice/src/main.rs`.

<a id="gio-1"></a>
## Bước 1 — Bán thử hai ly cà phê

**Khái niệm:** [kiểu số và chuỗi](../khai-niem/types.md) · [hàm main](../khai-niem/functions.md#main)

**Thay toàn bộ `src/main.rs`** bằng:

<!-- file: src/main.rs; mode: replace -->
```rust
fn main() {
    let name = "Cà phê";
    let price: u32 = 25_000;
    let quantity: u16 = 2;
    let amount = u64::from(price) * u64::from(quantity);
    println!("{name} x{quantity} = {amount}đ");
}
```

Đọc từng cái vừa dùng:

- `fn main()` là nơi chương trình bắt đầu chạy.
- `let name = ...` đặt tên cho giá trị. `"Cà phê"` là chuỗi viết sẵn, kiểu `&str`.
- `: u32` và `: u16` ghi kiểu số nguyên không âm. Dấu `_` trong `25_000` chỉ giúp dễ đọc.
- `u64::from(...)` chuyển từng số sang kiểu rộng hơn **trước khi nhân**.
- `println!` in ra terminal; `{amount}` lấy giá trị biến để chèn vào chuỗi.

Chạy `cargo run`. Cần thấy:

```text
Cà phê x2 = 50000đ
```

**Thử:** đổi quantity thành 3. Tính trước số tiền, chạy lại, rồi đổi về 2.

<a id="gio-2"></a>
## Bước 2 — Gom một món thành một struct

**Khái niệm:** [struct, impl, Self và method](../khai-niem/structs.md) · [hàm và kết quả](../khai-niem/functions.md#tra-ve)

Giờ tên, giá và số lượng đang rời nhau. Gom chúng thành một kiểu `CartItem` để mỗi món mang đủ dữ liệu.

**Thay toàn bộ `src/main.rs`** bằng:

<!-- file: src/main.rs; mode: replace -->
```rust
struct CartItem {
    name: String,
    price: u32,
    quantity: u16,
}

impl CartItem {
    fn subtotal(&self) -> u64 {
        u64::from(self.price) * u64::from(self.quantity)
    }
}

fn main() {
    let coffee = CartItem {
        name: String::from("Cà phê"),
        price: 25_000,
        quantity: 2,
    };
    println!("{} x{} = {}đ", coffee.name, coffee.quantity, coffee.subtotal());
}
```

- `struct CartItem` là khuôn dữ liệu; `CartItem { ... }` tạo một món cụ thể.
- `String` là chuỗi mà món sở hữu. Ta chọn nó để sau này đổi tên món được.
- `impl CartItem` chứa hành vi của món. `subtotal` là hàm tính tiền một dòng hóa đơn.
- `&self` nghĩa là **mượn món hiện tại để đọc**. Gọi hàm không làm mất `coffee`.
- `-> u64` là kiểu kết quả. Dòng tính tiền cuối hàm không có `;` vì đó là giá trị trả về.
- `coffee.name` lấy field; `coffee.subtotal()` gọi method.

Chạy `cargo run`: vẫn ra 50.000đ. Ta đổi cách tổ chức code, kết quả chưa đổi.

<a id="gio-3"></a>
## Bước 3 — Thêm trà và tính tổng giỏ

**Khái niệm:** [Vec và slice](../khai-niem/collections.md) · [ownership/borrowing](../khai-niem/ownership.md) · [iterator](../khai-niem/iterators.md)

**Thêm hàm sau vào cuối file, bên ngoài `main`**:

<!-- file: src/main.rs; mode: append -->
```rust
fn total(items: &[CartItem]) -> u128 {
    let mut amount = 0_u128;
    for item in items {
        amount += u128::from(item.subtotal());
    }
    amount
}
```

`&[CartItem]` là một lát mượn của dãy món. `mut` cho phép sửa biến `amount`. `for` lấy từng món để cộng tiền; `u128` giữ tổng rộng hơn subtotal của một món.

**Chỉ thay hàm `main`**, giữ nguyên struct, impl và hàm `total`:

<!-- file: src/main.rs; mode: main -->
```rust
fn main() {
    let mut cart = vec![CartItem {
        name: String::from("Cà phê"),
        price: 25_000,
        quantity: 2,
    }];
    cart.push(CartItem {
        name: String::from("Trà"),
        price: 18_000,
        quantity: 1,
    });

    for item in &cart {
        println!("{} x{} = {}đ", item.name, item.quantity, item.subtotal());
    }
    let amount = total(&cart);
    let gets_gift = amount >= 60_000;
    let message = if gets_gift { "Được tặng nước" } else { "Chưa có quà" };
    let currency: char = 'đ';
    println!("Tổng: {amount}{currency} — {message}");
    println!("Giỏ vẫn còn {} món", cart.len());
}
```

- `vec![...]` tạo `Vec`, danh sách có thể thêm món bằng `.push(...)`. Vì vậy `cart` cần `mut`.
- `&cart` cho mượn giỏ để in/tính tổng. Sau đó vẫn dùng được `cart.len()`.
- `gets_gift` là bool; `if/else` chọn thông báo. `'đ'` là char, khác chuỗi `"đ"`.

Chạy `cargo run`:

```text
Cà phê x2 = 50000đ
Trà x1 = 18000đ
Tổng: 68000đ — Được tặng nước
Giỏ vẫn còn 2 món
```

**Thử ownership:** trước vòng `for`, thêm `let receipt = cart;`. Chạy `cargo check`: E0382 vì giỏ chuyển sang tên `receipt`, không còn dùng qua `cart` được. Đổi thành `let receipt = &cart;` và in `receipt.len()`: chỉ mượn, không lấy giỏ. Xóa đoạn thử trước khi tiếp tục.

<a id="gio-4"></a>
## Bước 4 — Đổi tên trà bằng mutable borrow

**Khái niệm:** [`&mut self` và mutable borrow](../khai-niem/ownership.md)

**Thêm vào cuối file**, bên ngoài các hàm:

<!-- file: src/main.rs; mode: append -->
```rust
impl CartItem {
    fn rename(&mut self, name: &str) {
        self.name = name.to_owned();
    }
}
```

Một kiểu có thể có nhiều block `impl`. `&mut self` cho method quyền sửa món. `name: &str` mượn tên đầu vào; `.to_owned()` tạo `String` mới để lưu vào field của món.

**Trong `main`, ngay sau `cart.push(...);` và trước vòng `for`, thêm đúng dòng này**:

<!-- file: src/main.rs; mode: before-cart-loop -->
```rust
cart[1].rename("Trà đá");
```

Chỉ số bắt đầu từ 0 nên `cart[1]` là món thứ hai. Chạy `cargo run`: dòng trà đổi thành `Trà đá x1 = 18000đ`; tổng vẫn 68.000đ.

<a id="gio-5"></a>
## Bước 5 — Tự kiểm tra rồi thêm món của bạn

**Khái niệm:** [test, assert và attributes](../khai-niem/tests.md)

**Thêm vào cuối file**:

<!-- file: src/main.rs; mode: append -->
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cart_counts_quantity_and_keeps_its_items() {
        let mut cart = vec![CartItem {
            name: String::from("Trà"), price: 18_000, quantity: 2,
        }];
        assert_eq!(cart[0].subtotal(), 36_000);
        assert_eq!(total(&cart), 36_000);
        cart[0].rename("Trà đá");
        assert_eq!(cart[0].name, "Trà đá");
        assert_eq!(total(&[]), 0);
    }
}
```

`#[cfg(test)]` chỉ đưa module này vào khi chạy test. `use super::*` lấy các tên từ module cha. `#[test]` đánh dấu kiểm tra; `assert_eq!` so kết quả thật với mong đợi.

```shell
cargo test
cargo fmt
```

Cần **1 test pass**. Sau đó tự thêm nước giá 8.000đ vào giỏ: tổng phải thành 76.000đ.

Muốn thử iterator? Thay **riêng thân hàm `total`** bằng `items.iter().map(|item| u128::from(item.subtotal())).sum()`. `.iter()` mượn từng món, `.map(...)` biến món thành số tiền, `.sum()` cộng các số. Kết quả và test giữ nguyên.

Muốn in menu? Thử array các tuple: `let menu = [("Cà phê", 25_000_u32), ("Trà", 18_000)];`, rồi duyệt `for (name, price) in menu { ... }`. Array có số phần tử cố định; tuple gom tên và giá khác kiểu.

Xong khi tự thêm được món và phân biệt được `&self` với `&mut self`. [Final](./final/src/main.rs) chỉ để đối chiếu sau khi làm; nó có thêm menu và test giới hạn số.

[Tiếp: Project 2](../02-binh-chon/README.md) · [Về module](../README.md)
