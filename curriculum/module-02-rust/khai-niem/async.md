# Async/await — Tiến triển việc khác trong lúc chờ

Async cho chương trình tiếp tục việc khác trong lúc chờ dữ liệu, như chờ mạng hay timer, thay vì giữ thread đứng yên.

## 1. Bài toán trước cú pháp

Một nguồn chờ 10 ms, nguồn kia chờ 20 ms. Nếu xong nguồn một mới bắt đầu hai, thời gian chờ gần 30 ms. Nếu cả hai tiến triển cùng lúc trong thời gian chờ, có thể gần 20 ms cộng overhead.

Concurrency là nhiều việc cùng tiến triển, có thể xen kẽ trên một thread. Parallelism là thực thi cùng lúc trên nhiều tài nguyên xử lý. Async không tự làm phép tính CPU nặng chạy nhanh hơn.

## 2. Chạy ví dụ riêng

Trong [sandbox](./README.md#thu-muc-nhap), thay phần `[dependencies]` trống ở Cargo.toml bằng phần sau. Nếu đã có Tokio, dùng lại một khai báo, không tạo hai section dependencies:

```toml
[dependencies]
tokio = { version = "=1.48.0", features = ["rt", "macros", "time"] }
```

Thay src/main.rs bằng:

```rust
use std::time::Duration;

async fn lay_ten() -> String {
    tokio::time::sleep(Duration::from_millis(10)).await;
    String::from("Lan")
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let pending = lay_ten();
    println!("Mới tạo future");
    let ten = pending.await;
    assert_eq!(ten, "Lan");
    println!("{ten}");
}
```

Async fn tạo future. Khi gọi lay_ten, thân hàm chưa chạy ngay. Future được poll để tiến triển; runtime và await phối hợp việc đó. Nếu future chưa sẵn sàng, await có thể nhường task; nếu đã sẵn sàng thì không nhất thiết dừng.

Tokio::main chuẩn bị runtime. Current_thread dùng một thread. Rt/macros/time là các phần Tokio được bật để có runtime, macro và timer. Std::thread::sleep giữ thread; Tokio sleep nhường trong lúc chờ. Một nhánh blocking sẽ cản những nhánh cùng task.

## 3. Join cần tất cả; select lấy một nhánh

```rust
use std::time::Duration;

async fn nguon(nhan: &'static str, ms: u64) -> &'static str {
    tokio::time::sleep(Duration::from_millis(ms)).await;
    nhan
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let both = tokio::join!(nguon("A", 10), nguon("B", 20));
    assert_eq!(both, ("A", "B"));
    let first = tokio::select! {
        biased;
        label = nguon("nhanh", 10) => label,
        label = nguon("chậm", 100) => label,
    };
    assert_eq!(first, "nhanh");
}
```

Join trả tuple theo thứ tự nhánh viết, đợi tất cả. Nếu các kết quả là Result, join vẫn đợi cả nhánh lỗi; try_join là lựa chọn cho trường hợp cần trả sớm khi Err.

Select chọn nhánh hoàn tất có pattern phù hợp; ở đây các future timer còn lại do macro sở hữu bị drop. Biased ưu tiên thứ tự khi nhiều nhánh cùng sẵn sàng. Bỏ biased thì thứ tự kiểm tra mặc định không phải thứ tự viết cố định.

Drop future không hoàn tác side effect đã xảy ra. Select trên JoinHandle của task đã spawn cũng không tự dừng task khi drop handle. Ví dụ timer trực tiếp không có các side effect đó.

Nguồn API: [Tokio main](https://docs.rs/tokio/1.48.0/tokio/attr.main.html), [join](https://docs.rs/tokio/1.48.0/tokio/macro.join.html), [select](https://docs.rs/tokio/1.48.0/tokio/macro.select.html).

## Tự làm

Dùng select để đua nguồn dữ liệu và timer hết hạn. Đổi nguồn nhanh hơn/chậm hơn timeout để quan sát. Không assert thời gian chính xác theo đồng hồ thật vì lịch chạy còn tùy môi trường.

**Dùng trong:** [vé — nguồn khách](../03-ve-su-kien/README.md#ticket-1) · [vé — join/select](../03-ve-su-kien/README.md#ticket-2).
