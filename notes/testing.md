# Chiến lược kiểm thử

| Lớp kiểm thử | Phù hợp nhất với | Đánh đổi |
| --- | --- | --- |
| Rust unit test | Phép tính thuần và validation helper | Không kiểm tra hành vi runtime/account |
| LiteSVM | Thực thi program và thiết lập account nhanh | Cần thêm phần setup test bằng Rust |
| Anchor TypeScript | Hành vi IDL/client và luồng gần thực tế | Chậm hơn và phụ thuộc integration nhiều hơn |
| Local validator | Deployment và hành vi end-to-end | Chậm nhất và phụ thuộc môi trường |

Mỗi instruction cần có happy-path test, test thiếu hoặc sai authority, test quan hệ account không hợp lệ và các boundary test liên quan.
