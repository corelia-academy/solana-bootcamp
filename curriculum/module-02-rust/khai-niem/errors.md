# Option, Result và dấu ? — Kết quả có thể thiếu hoặc sai

Khi nhập maybe vào chương trình bình chọn, chương trình cần báo lỗi và cho nhập lại. Dữ liệu sai là trường hợp phải biểu diễn, không phải luôn làm chương trình sập. Chạy ví dụ ở [thư mục nháp](./README.md#thu-muc-nhap).

## 1. Option: có hoặc không

```rust
fn main() {
    let gia = [25000, 18000];
    assert_eq!(gia.get(0), Some(&25000));
    assert_eq!(gia.get(9), None);
    match gia.get(9) {
        Some(value) => println!("Giá: {value}"),
        None => println!("Không có món đó"),
    }
}
```

Option<T> là enum có Some(T) hoặc None. T là kiểu dữ liệu bên trong. Get trả Option vì index có thể không tồn tại. Không tìm thấy ở đây chưa cần lý do lỗi phức tạp.

## 2. Result: thành công hoặc lỗi có lý do

```rust
fn doc_so(input: &str) -> Result<u32, &'static str> {
    input.trim().parse::<u32>().map_err(|_| "cần số nguyên không âm")
}

fn main() {
    assert_eq!(doc_so(" 42 "), Ok(42));
    assert_eq!(doc_so("abc"), Err("cần số nguyên không âm"));
}
```

Result<T,E> có Ok(T) hoặc Err(E). T là kết quả, E là kiểu lỗi. Map_err chuyển lỗi gốc thành thông báo mình chọn; `|_|` là closure bỏ qua giá trị lỗi đầu vào.

Hàm trả Result chưa tự in gì. Caller chọn hiển thị, nhập lại hay dừng.

## 3. Unwrap và expect

Unwrap lấy dữ liệu trong Some/Ok nhưng panic khi None/Err. Expect tương tự, có thêm thông báo. Dùng trong test với fixture đã biết có thể hợp lý; không dùng để bỏ qua lỗi input thật.

`unwrap_or(0)` khác unwrap: cung cấp 0 nếu không có giá trị. Chỉ dùng mặc định khi đúng ý nghĩa nghiệp vụ, như counter chưa tồn tại bằng 0.

## 4. Dấu hỏi chấm lấy thành công, trả lỗi sớm

```rust
fn tang_mot(input: &str) -> Result<u32, &'static str> {
    let n = input.parse::<u32>().map_err(|_| "cần số")?;
    let next = n.checked_add(1).ok_or("số quá lớn")?;
    Ok(next)
}

fn main() {
    assert_eq!(tang_mot("41"), Ok(42));
    assert_eq!(tang_mot("abc"), Err("cần số"));
    assert_eq!(tang_mot("4294967295"), Err("số quá lớn"));
}
```

Dòng đầu: Ok thì lấy số n; Err thì thoát hàm ngay. Dòng sau: checked_add cho Option, ok_or chuyển None thành Err rồi mới dùng ?. Vì vậy một lỗi có thể làm những dòng dưới không chạy.

Trong hàm trả Option, ? lấy Some hoặc truyền None sớm. Không dùng ? trực tiếp trên Option trong hàm trả Result; chuyển bằng ok_or trước. Lỗi Result có thể được chuyển qua From nếu kiểu trả về hỗ trợ; ví dụ dùng map_err cho tường minh.

## 5. Result<(), E> và Box<dyn Error>

Unit `()` biểu diễn không có dữ liệu hữu ích cần trả. Vote thành công chỉ cần Ok(()), thất bại có E.

Main trong project trả `Result<(), Box<dyn std::error::Error>>` để nhận nhiều kiểu lỗi khác nhau qua trait Error. Box giữ giá trị sở hữu trên heap, dyn dùng hành vi chung khi không ghi một kiểu lỗi cụ thể ở chữ ký. Chưa cần tự cài cơ chế này để dùng main; trait được giải thích tại [traits](./traits.md).

## Tự làm

Viết parser nhận điểm u8, từ chối điểm trên 100. Thử 0,100,101,abc,256. Dùng Result để phân biệt kết quả, không panic vì abc.

**Quay lại:** [bình chọn — parser](../02-binh-chon/README.md#poll-1) · [bình chọn — checked counter](../02-binh-chon/README.md#poll-2) · [vé — Option root](../03-ve-su-kien/README.md#ticket-3) · [vé — index proof](../03-ve-su-kien/README.md#ticket-4).
