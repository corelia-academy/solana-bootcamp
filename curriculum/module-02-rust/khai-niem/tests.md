# Test — Cho code một đầu vào và kiểm tra điều đã hứa

Project cần biết có đếm đúng, có từ chối input sai và có giữ dữ liệu khi lỗi không. Tests giúp kiểm tra lại các hành vi đó. Chạy trong [sandbox](./README.md#thu-muc-nhap).

## 1. Một hàm, một kiểm tra

```rust
fn cong(a: u32, b: u32) -> u32 {
    a + b
}

fn main() {
    assert_eq!(cong(2, 3), 5);
}

#[cfg(test)]
mod tests {
    use super::cong;

    #[test]
    fn cong_hai_so() {
        assert_eq!(cong(2, 3), 5);
    }
}
```

Cargo run chạy main và assert nhanh ở đó. Cargo test tìm các hàm có #[test] và chạy chúng. Nếu cong(2,3) không bằng 5, test báo thất bại.

`#[cfg(test)]` chỉ đưa module vào cấu hình test. Use super::cong lấy hàm ở module cha. Test bên trong module con có thể truy cập các phần riêng tư phù hợp của cha, nên test trong poll.rs kiểm tra được counts.

## 2. Chọn ví dụ kiểm tra theo rủi ro

| Hành vi | Ví dụ |
| --- | --- |
| Đúng bình thường | yes tạo đúng một phiếu |
| Sai định dạng | maybe trả Err |
| Ranh giới | counter u64::MAX không tăng tiếp được |
| Lỗi không làm hỏng dữ liệu | Thao tác thất bại giữ counter cũ |
| Dữ liệu bị sửa | Đổi sibling hash thì verify false |

Unwrap trong test dùng với fixture mà test mong là hợp lệ; sai thì test cần thất bại. Main nhận input thật vẫn phải xử lý Err. Tests không thay thế việc tự hiểu code; chúng kiểm tra hành vi đã chọn, không chứng minh mọi trường hợp có thể có.

## 3. Các loại test nằm ở đâu?

Unit test thường ở cạnh code trong module tests. Integration test nằm trong `tests/`, dùng API public như người sử dụng thư viện. Doctest là các ví dụ Rust trong tài liệu của crate được cargo test kiểm tra khi cấu hình tương ứng.

<a id="attributes"></a>
## 4. Đừng gom mọi #[...] thành một loại macro

Derive như `#[derive(Debug)]` sinh implementation trait. `#[test]` đánh dấu hàm test; cfg điều kiện compile. Attribute macro là một nhóm khác, ví dụ `#[tokio::test]` hoặc `#[tokio::main]` chuẩn bị runtime. `println!`/`vec!` là macro dạng lời gọi với dấu !.

Đọc tác dụng tại chỗ, chưa cần tự viết macro để làm các project này.

## Tự làm

Thêm test cho hàm tính tiền với số ly bằng 0. Cố tình sửa công thức để test thất bại, rồi khôi phục. Đạt khi đọc được test báo đầu vào nào và mong kết quả gì.

**Quay lại:** [giỏ hàng — test](../01-gio-hang/gio-hang-day-du.md#gio-5) · [bình chọn — test](../02-binh-chon/README.md#poll-5) · [vé — test](../03-ve-su-kien/README.md#ticket-5).
