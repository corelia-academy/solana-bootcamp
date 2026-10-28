# Cách học khóa online

Repository này là tài liệu đồng hành cho khóa học quay sẵn. Các module thực hành đi theo nhịp `Xem → Dừng video → Code → Test → Đối chiếu`; học viên tự học từ `starter`, không bắt đầu từ `final`.

Bắt đầu từ [Module 0](../curriculum/module-00-orientation/README.md). Module 0 gồm định hướng, blockchain cơ bản và readiness checklist; nhịp code-along áp dụng từ Module 1. Khi video khác cách thao tác trong docs, đọc [quy tắc video, docs và phiên bản](../curriculum/module-00-orientation/lessons.md#05-video-documentation--tool-versions).

## Học trên Corelia Academy

Truy cập [khóa Solana Bootcamp](https://corelia.academy/learn/courses/solana-bootcamp) để học theo từng lesson cùng các nội dung bổ trợ. Khi theo dõi video trên YouTube, mở thêm nội dung khóa học và docs của lesson để biết mục tiêu, bài thực hành và kết quả cần hoàn thành.

GitHub repo cung cấp docs cập nhật, code thực hành và checklist. Sau mỗi video, thực hiện bài tập/lab tương ứng rồi đối chiếu kết quả trước khi chuyển bài.

## Lộ trình video

| Chặng | Module | Sản phẩm kiểm chứng | Thời lượng tự học gợi ý |
| --- | --- | --- | ---: |
| Định hướng và blockchain cơ bản | 0 | Mục tiêu học, lộ trình, sơ đồ giao dịch và readiness checklist | 60–90 phút |
| Setup và deploy đầu tiên | 1 | Hello Solana build/test local, deploy/upgrade, IDL và test Devnet | 2–3 giờ |
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

Với Module 0, chuyển bài khi hoàn thành [readiness checklist](../curriculum/module-00-orientation/readiness-checklist.md). Với Module 1, hoàn thành [setup & first deployment checklist](../curriculum/module-01-orientation/setup-checklist.md). Không yêu cầu kiến thức PDA hoặc constraint chưa học để hoàn thành hai module này.

Từ các module xây dựng program/project, áp dụng những tiêu chí sau theo nội dung đã được dạy trong module:

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
