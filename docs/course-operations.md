# Cách học khóa online

Repository này là tài liệu đồng hành cho khóa học quay sẵn. Mỗi module đi theo nhịp `Xem → Dừng video → Code → Test → Đối chiếu`; học viên tự học từ `starter`, không bắt đầu từ `final`.

## Lộ trình video

| Chặng | Module | Sản phẩm kiểm chứng | Thời lượng tự học gợi ý |
| --- | --- | --- | ---: |
| Chuẩn bị | 1 | Toolchain và Devnet wallet | 2–3 giờ |
| Nền tảng | 2–3 | Rust Poll Counter, Solana mental model | 6–8 giờ |
| Anchor và testing | 4–5 | PDA Counter cùng test matrix | 6–8 giờ |
| Core projects | 6–8 | Voting, SPL Token, Escrow | 12–16 giờ |
| Client và DeFi | 9–11 | Voting Frontend, Stablecoin, AMM | 12–16 giờ |
| Nhánh tự chọn | chọn 12, 13 hoặc 14 | Một optional lab hoàn chỉnh | 3–5 giờ |
| Automation | 15–17 | x402, MCP, AI Agent | 10–14 giờ |
| Production | 18 | Security checklist và capstone | 4–6 giờ |

Module 12–14 là ba nhánh độc lập. Module 18 nên được xem trước khi đưa MCP/AI Agent lên Devnet, dù số thứ tự của nó đứng cuối.

## Nhịp học cho mỗi module

1. Đọc prerequisite và kết quả đầu ra trong README module.
2. Xem phần Concept và Schema; dừng video để tự vẽ lại account/data flow.
3. Mở state `starter`, đọc phần “Học viên cần làm” và chạy command ban đầu.
4. Code cùng video. Chỉ dùng checkpoint khi cần phục hồi sau một đoạn lớn.
5. Dừng video trước phần test, tự bổ sung happy path và ít nhất một failure path.
6. Chạy toàn bộ lệnh trong README của state đang học.
7. Nộp source, test output, reflection ngắn và Explorer link nếu module dùng Devnet.
8. Chỉ đọc `final` sau khi đã hoàn thành hoặc ghi rõ điểm đang bị kẹt.

## Khi nào được chuyển bài

Học viên có thể chuyển module khi:

- giải thích được state nào thay đổi và account nào cho phép thay đổi đó;
- derive đúng PDA/ATA và mô tả signer, writable, owner;
- chạy xanh các test được mở ở state hiện tại;
- chứng minh ít nhất một transaction lỗi không làm thay đổi state;
- ghi lại một security risk và cách test regression cho nó.

## Cách dùng checkpoint

- `starter`: điểm bắt đầu mặc định, có TODO hoặc test đỏ/skip có chủ ý.
- `checkpoint-1`: đối chiếu sau instruction/state đầu tiên.
- `checkpoint-2`: đối chiếu sau flow chính, trước hardening.
- `final`: đáp án tham khảo và artifact dùng để xác nhận video.

Nếu dùng checkpoint, hãy so sánh diff và giải thích phần mình thiếu thay vì chép cả thư mục.

## Khi cần hỗ trợ

Chuẩn bị năm thông tin: hành vi mong đợi, hành vi thực tế, lỗi đầy đủ, version toolchain, và thay đổi nhỏ nhất có liên quan. Không chia sẻ seed phrase, private key hoặc keypair file.
