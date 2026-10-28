# Enum — Một giá trị thuộc trường hợp nào?

Một phiếu chọn Yes hoặc No hoặc Abstain. Enum biểu diễn đúng việc “chọn một trong số đó”. Ví dụ chạy ở [thư mục nháp](./README.md#thu-muc-nhap).

## 1. Tạo tập lựa chọn

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum Choice {
    Yes,
    No,
    Abstain,
}

fn main() {
    let phieu = Choice::Yes;
    let nhan = match phieu {
        Choice::Yes => "Đồng ý",
        Choice::No => "Không đồng ý",
        Choice::Abstain => "Không chọn bên nào",
    };
    assert_eq!(nhan, "Đồng ý");
}
```

Choice là kiểu. Yes/No/Abstain là các variant. `Choice::Yes` là một giá trị cụ thể. Dấu `::` đi qua tên kiểu đến variant, khác `.` để truy cập field/method của giá trị.

Match buộc xử lý mọi variant. Nếu thêm Veto nhưng chưa sửa match, compiler có thể chỉ ra trường hợp thiếu. Đây là lý do giữ enum thay cho các chuỗi tùy ý ở phần xử lý bên trong.

## 2. Variant có thể mang dữ liệu

```rust
enum TrangThai {
    ChuaGui,
    DangGui { lan: u32 },
    Loi(String),
}

fn main() {
    let ds = [
        TrangThai::ChuaGui,
        TrangThai::DangGui { lan: 2 },
        TrangThai::Loi(String::from("Mất mạng")),
    ];
    for state in ds {
        match state {
            TrangThai::ChuaGui => println!("Chưa gửi"),
            TrangThai::DangGui { lan } => println!("Đang gửi lần {lan}"),
            TrangThai::Loi(ly_do) => println!("Lỗi: {ly_do}"),
        }
    }
}
```

Một variant có thể không mang dữ liệu, mang field có tên, hoặc mang giá trị trong ngoặc tròn. Match vừa chọn trường hợp vừa lấy dữ liệu bên trong ra dùng.

Struct thích hợp khi nhiều field cùng tồn tại; enum thích hợp khi giá trị ở một trong nhiều trường hợp. Poll là struct; Choice là enum. Option và Result cũng là enum có sẵn, xem [xử lý lỗi](./errors.md).

## 3. Các derive của Choice dùng để làm gì?

Debug cho in kiểm tra. PartialEq/Eq cho so sánh bằng. Hash cho băm làm khóa HashMap. Clone cho sao chép tường minh; Copy cho copy ngầm ở các phép gán/truyền phù hợp. Enum chỉ có các variant không dữ liệu như Choice có thể derive các trait này; nếu chứa String thì không derive Copy được.

## Tự làm

Thêm Veto vào ví dụ đầu, chạy để đọc lỗi match thiếu, rồi bổ sung nhánh. Tiếp theo thử thêm lý do lỗi vào một trạng thái riêng.

**Quay lại:** [bình chọn — Choice](../02-binh-chon/README.md#poll-1).
