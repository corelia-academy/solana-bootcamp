# Project 3 — Tự viết kiểm tra vé bằng Merkle proof

Project gồm hai việc: lấy danh sách khách bằng async, rồi kiểm tra một cái tên có trong danh sách đã cam kết. Nguồn khách dùng timer giả lập; chưa có request mạng hoặc lưu vé đã dùng.

<a id="ticket-0"></a>
## Bước 0 — Tạo project và thêm thư viện

Chưa rõ dependencies trong Cargo.toml: mở [đọc folder và cấu hình Cargo](../bat-dau/02-doc-project.md). Phần cài Rust nằm [ở đây](../bat-dau/01-cai-rust.md).

Từ gốc `solana-bootcamp`:

```shell
cargo new curriculum/module-02-rust/03-ve-su-kien/practice --name ve-su-kien --edition 2021 --vcs none
cd curriculum/module-02-rust/03-ve-su-kien/practice
```

**Thay toàn bộ `Cargo.toml`**:

<!-- file: Cargo.toml; mode: replace -->
```toml
[package]
name = "ve-su-kien"
version = "0.1.0"
edition = "2021"
rust-version = "1.87"
publish = false

[dependencies]
sha2 = "=0.10.9"
tokio = { version = "=1.48.0", features = ["rt", "macros", "time"] }
```

Tokio lo runtime và timer async; sha2 cung cấp SHA-256. `features` bật phần cần dùng; `=` giữ đúng phiên bản cho bài này. Lần build đầu cần internet tải thư viện. Mọi lệnh tiếp theo chạy tại `practice`.

<a id="ticket-1"></a>
## Bước 1 — Chờ một nguồn khách

**Khái niệm:** [Future và async/await](../khai-niem/async.md) · [lifetime và `'static`](../khai-niem/lifetimes.md)

**Thay toàn bộ `src/main.rs`**:

<!-- file: src/main.rs; mode: replace -->
```rust
use std::time::Duration;
use tokio::time::sleep;

async fn fetch_half(first: bool) -> Vec<&'static str> {
    sleep(Duration::from_millis(if first { 10 } else { 20 })).await;
    if first {
        vec!["Lan", "Minh"]
    } else {
        vec!["An", "Bình"]
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let pending = fetch_half(true);
    println!("Mới tạo future, chưa lấy xong khách");
    let guests = pending.await;
    println!("Khách: {guests:?}");
}
```

- `async fn` trả một future. Gọi hàm tạo công việc chưa chạy thân hàm ngay; `.await` chờ nó cho kết quả.
- `sleep(...).await` mô phỏng thời gian chờ nguồn dữ liệu. Khi chưa sẵn sàng, task có thể nhường cho việc khác.
- `Duration::from_millis(10)` là khoảng 10 mili giây.
- `Vec<&'static str>` chứa các chuỗi literal sống suốt chương trình. Dữ liệu đọc thật thường cần String; không thêm static để ép chuỗi tạm sống lâu hơn.
- `#[tokio::main(...)]` tạo runtime để chạy async main. `current_thread` dùng một thread.

Chạy `cargo run`: sau dòng thông báo, thấy `Khách: ["Lan", "Minh"]`. Đổi tham số `true` thành `false` để thấy nguồn còn lại, rồi khôi phục.

<a id="ticket-2"></a>
## Bước 2 — Lấy cả hai nguồn, đua hai cổng

**Khái niệm:** [join/select và concurrency](../khai-niem/async.md)

**Thêm vào cuối `src/main.rs`**, ngoài main:

<!-- file: src/main.rs; mode: append -->
```rust
async fn load_guests() -> Vec<&'static str> {
    let (mut first, second) = tokio::join!(fetch_half(true), fetch_half(false));
    first.extend(second);
    first
}

async fn gate(label: &'static str, delay_ms: u64) -> &'static str {
    sleep(Duration::from_millis(delay_ms)).await;
    label
}

async fn fastest_gate() -> &'static str {
    tokio::select! {
        biased;
        label = gate("cổng nhanh", 10) => label,
        label = gate("cổng chậm", 100) => label,
    }
}
```

- `join!` cho hai future tiến triển và đợi **cả hai**, trả tuple theo thứ tự viết. `first.extend(second)` chuyển các phần tử nguồn hai vào vector nguồn một.
- `select!` chọn **một** nhánh hoàn tất phù hợp; `label = ... => label` lấy kết quả và trả nó.
- `biased;` ưu tiên nhánh đầu nếu nhiều nhánh cùng sẵn sàng lúc poll, để demo nhất quán. Không phải lúc nào ứng dụng cũng cần ưu tiên này.
- Hai future timer ở đây thuộc select; nhánh còn lại bị drop. Hủy future không tự hoàn tác side effect đã xảy ra ở bên ngoài.

**Chỉ thay hàm main và attribute ngay trên nó**; giữ imports và các hàm khác:

<!-- file: src/main.rs; mode: main -->
```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let guests = load_guests().await;
    println!("Số khách: {}", guests.len());
    println!("Phản hồi đầu tiên: {}", fastest_gate().await);
}
```

Chạy `cargo run`:

```text
Số khách: 4
Phản hồi đầu tiên: cổng nhanh
```

Một thread vẫn làm nhiều việc **xen kẽ trong lúc chờ**: đó là concurrency. Tính toán cùng lúc trên nhiều core là parallelism. Nếu thay timer async bằng `std::thread::sleep`, thread bị giữ; các việc khác trên thread phải đợi. Chưa cần tự tạo threads cho bài này.

<a id="ticket-3"></a>
## Bước 3 — Băm danh sách thành một root

**Khái niệm:** [Merkle tree và root](../khai-niem/merkle.md) · [module](../khai-niem/modules.md) · [iterator](../khai-niem/iterators.md) · [Option/Result](../khai-niem/errors.md)

Hash là dấu vân tay có độ dài cố định của dữ liệu. SHA-256 cho 32 byte; nó không phải mã hóa để giải ngược ra tên. Merkle tree băm từng tên thành leaf, ghép hash từng cặp rồi băm tiếp đến khi chỉ còn một root.

**Tạo `src/tree.rs`** với toàn bộ đoạn sau:

<!-- file: src/tree.rs; mode: replace -->
```rust
use sha2::{Digest, Sha256};

pub type Hash = [u8; 32];

fn hash_leaf(value: &str) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update([0]);
    hasher.update(value.as_bytes());
    hasher.finalize().into()
}

fn hash_pair(left: &Hash, right: &Hash) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update([1]);
    hasher.update(left);
    hasher.update(right);
    hasher.finalize().into()
}

fn next_level(level: &[Hash]) -> Vec<Hash> {
    level.chunks(2)
        .map(|pair| hash_pair(&pair[0], pair.get(1).unwrap_or(&pair[0])))
        .collect()
}

pub fn merkle_root(values: &[&str]) -> Option<Hash> {
    let mut level: Vec<Hash> = values.iter().map(|value| hash_leaf(value)).collect();
    while level.len() > 1 {
        level = next_level(&level);
    }
    level.first().copied()
}
```

Đi theo dữ liệu:

1. `type Hash = [u8; 32]` đặt tên ngắn cho array đúng 32 byte, không tạo kiểu dữ liệu mới.
2. `Digest` là trait cung cấp các method băm. `new` tạo hasher, `update` nạp byte, `finalize` lấy kết quả; `.into()` chuyển kết quả sang array.
3. Prefix `[0]` cho leaf, `[1]` cho node để phân biệt hai miền dữ liệu. `as_bytes` lấy byte UTF-8 của tên.
4. `chunks(2)` chia tầng thành cặp. `map` băm mỗi cặp; `collect` gom thành tầng mới. Thiếu phần tử thứ hai thì `unwrap_or` dùng phần tử đầu, tức lặp node cuối.
5. `values.iter().map(...)` băm từng tên. `while` thu gọn tầng đến khi có một hash; `first().copied()` trả Some(hash), hoặc None nếu danh sách rỗng.

**Thêm lên đầu `src/main.rs`**:

<!-- file: src/main.rs; mode: prepend -->
```rust
mod tree;
use tree::merkle_root;
```

**Chỉ thay main và attribute của nó**:

<!-- file: src/main.rs; mode: main -->
```rust
#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let guests = load_guests().await;
    println!("Số khách: {}", guests.len());
    println!("Phản hồi đầu tiên: {}", fastest_gate().await);
    let root = merkle_root(&guests).ok_or("danh sách rỗng")?;
    println!("Root có {} byte", root.len());
    Ok(())
}
```

`ok_or(...)` đổi Option thành Result để dùng `?`. Giống project 2, main trả Result để truyền lỗi ra ngoài.

Chạy `cargo run`: thêm dòng `Root có 32 byte`. Chưa cần đọc chuỗi hash dài trên terminal.

<a id="ticket-4"></a>
## Bước 4 — Tạo proof cho Minh rồi xác minh

**Khái niệm:** [proof và hướng sibling](../khai-niem/merkle.md) · [struct](../khai-niem/structs.md) · [dấu ? trên Option](../khai-niem/errors.md)

Cây bốn tên có dạng:

```text
                    root
                  /      \
              N(A,B)     N(C,D)
               /  \       /  \
           A=Lan B=Minh C=An D=Bình
```

A/B/C/D là hash của tên. Từ Minh đi lên root chỉ cần **A ở bên trái**, rồi **N(C,D) ở bên phải**. Proof chứa hai sibling hash đó và hướng ghép.

**Thêm vào cuối `src/tree.rs`**:

<!-- file: src/tree.rs; mode: append -->
```rust
#[derive(Clone, Debug)]
pub struct ProofStep {
    sibling: Hash,
    sibling_is_left: bool,
}

pub fn get_proof(values: &[&str], mut index: usize) -> Option<Vec<ProofStep>> {
    values.get(index)?;
    let mut level: Vec<Hash> = values.iter().map(|value| hash_leaf(value)).collect();
    let mut proof = Vec::new();

    while level.len() > 1 {
        let sibling_is_left = index % 2 == 1;
        let sibling_index = if sibling_is_left { index - 1 } else { index + 1 };
        let sibling = level.get(sibling_index).unwrap_or(&level[index]);
        proof.push(ProofStep { sibling: *sibling, sibling_is_left });
        level = next_level(&level);
        index /= 2;
    }
    Some(proof)
}

pub fn verify(value: &str, proof: &[ProofStep], root: &Hash) -> bool {
    let mut current = hash_leaf(value);
    for step in proof {
        current = if step.sibling_is_left {
            hash_pair(&step.sibling, &current)
        } else {
            hash_pair(&current, &step.sibling)
        };
    }
    current == *root
}
```

Đọc `get_proof` từng bước:

- `values.get(index)?`: index sai thì trả None sớm. Hàm trả Option nên dấu `?` ở đây truyền None, không truyền Err.
- `% 2 == 1`: index lẻ, node hiện tại nằm bên phải, sibling ở bên trái.
- Lấy sibling: trừ 1 nếu bên trái, cộng 1 nếu bên phải; thiếu node cuối thì dùng chính nó.
- `*sibling` copy array 32 byte vào proof. `.push` thêm một bước.
- Qua tầng mới, chia index cho 2 bằng phép chia nguyên. Ví dụ Minh index 1 lên tầng trên thành index 0.

`verify` tự băm tên rồi lần lượt ghép sibling đúng thứ tự. Cuối cùng `current == *root` trả bool. Đổi tên hoặc đổi proof sẽ dẫn đến hash khác.

**Thêm lên đầu `src/main.rs`**; giữ dòng use merkle_root đã có:

<!-- file: src/main.rs; mode: prepend -->
```rust
use tree::{get_proof, verify};
```

**Chỉ thay main và attribute của nó**:

<!-- file: src/main.rs; mode: main -->
```rust
#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let guests = load_guests().await;
    println!("Số khách: {}", guests.len());
    println!("Phản hồi đầu tiên: {}", fastest_gate().await);
    let root = merkle_root(&guests).ok_or("danh sách rỗng")?;
    let proof = get_proof(&guests, 1).ok_or("index không tồn tại")?;
    println!("Minh có vé: {}", verify("Minh", &proof, &root));
    println!("Đổi tên có vé: {}", verify("Người khác", &proof, &root));
    println!("Số hash trong proof: {}", proof.len());
    Ok(())
}
```

Chạy `cargo run`. Ba dòng cuối:

```text
Minh có vé: true
Đổi tên có vé: false
Số hash trong proof: 2
```

Root phải lấy từ nguồn đáng tin trước khi xác minh. Lab dùng SHA-256, prefix leaf 0x00/node 0x01, giữ thứ tự và lặp node cuối khi lẻ. Hai bên phải dùng cùng quy ước. Proof này kiểm tra membership; không xác thực danh tính, số lần xuất hiện hoặc tổng số khách.

<a id="ticket-5"></a>
## Bước 5 — Kiểm tra tên sai, cây lẻ và async

**Khái niệm:** [tests và attributes](../khai-niem/tests.md) · [runtime cho test async](../khai-niem/async.md)

**Thêm vào cuối `src/tree.rs`**:

<!-- file: src/tree.rs; mode: append -->
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_list_and_invalid_index() {
        assert_eq!(merkle_root(&[]), None);
        assert!(get_proof(&["Lan"], 1).is_none());
    }

    #[test]
    fn every_guest_verifies_even_with_odd_width() {
        let names = ["Lan", "Minh", "An", "Bình", "Hà"];
        for len in 1..=names.len() {
            let guests = &names[..len];
            let root = merkle_root(guests).unwrap();
            for (index, name) in guests.iter().enumerate() {
                let proof = get_proof(guests, index).unwrap();
                assert!(verify(name, &proof, &root));
                assert!(!verify("Tên khác", &proof, &root));
            }
        }
    }

    #[test]
    fn rejects_changed_proof() {
        let guests = ["Lan", "Minh", "An", "Bình"];
        let root = merkle_root(&guests).unwrap();
        let mut proof = get_proof(&guests, 1).unwrap();
        assert_eq!(proof.len(), 2);
        proof[0].sibling[0] ^= 1;
        assert!(!verify("Minh", &proof, &root));
    }
}
```

`1..=names.len()` gồm cả điểm cuối. `&names[..len]` mượn phần đầu của array để thử nhiều kích thước cây. `enumerate()` đưa cả chỉ số lẫn tên. `^= 1` lật một bit để cố tình làm hỏng proof.

**Thêm vào cuối `src/main.rs`**:

<!-- file: src/main.rs; mode: append -->
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test(flavor = "current_thread")]
    async fn joins_both_guest_lists() {
        assert_eq!(load_guests().await, vec!["Lan", "Minh", "An", "Bình"]);
    }

    #[tokio::test(flavor = "current_thread")]
    async fn selects_fast_gate() {
        assert_eq!(fastest_gate().await, "cổng nhanh");
    }
}
```

`#[tokio::test]` tạo runtime cho một test async, giống cách tokio::main chạy main.

```shell
cargo test
cargo fmt
```

Cần **5 tests pass**. Sau đó tự đổi tên khách, sinh proof mới và kiểm tra. [Final](./final/src/tree.rs) có thêm tests root/hướng ghép để đối chiếu sau khi làm.

Muốn luyện thêm: dùng `HashSet<String>` để chặn một vé dùng lại. Đó là bước lưu trạng thái bổ sung, ngoài kiểm tra membership hiện tại.

[Về module](../README.md)
