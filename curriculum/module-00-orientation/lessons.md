# Nội dung bài học — Module 0: Bootcamp Orientation

## 0.1 Welcome to the Solana Bootcamp

Khóa học dành cho lập trình viên mới tiếp cận Solana. Bạn nên biết cách đọc và viết code cơ bản; kinh nghiệm JavaScript, TypeScript hoặc Rust là một lợi thế. Rust cần thiết cho khóa học sẽ được dạy ở Module 2.

Sau khóa học, bạn có thể giải thích account/transaction model, viết và kiểm thử Solana program bằng Rust và Anchor, kết nối frontend, nhận diện lỗi validation và hoàn thiện một ứng dụng để trình bày trong portfolio.

Bạn sẽ bắt đầu với chương trình mẫu Hello Solana, sau đó xây các project như PDA Counter, Voting App, SPL Token và Escrow. Các phần sau mở rộng sang DeFi, AI/Agent và security. [Capstone](../../capstones/README.md) là nơi kết hợp kiến thức để xây sản phẩm theo hướng bạn chọn.

Cách học xuyên suốt là xem hướng dẫn, dừng lại để thực hành, kiểm tra kết quả và tự giải thích code. Mục tiêu là hiểu dữ liệu nào thay đổi, ai được phép thay đổi và làm sao kiểm chứng hành vi của ứng dụng.

**Thực hành:** ghi lại kinh nghiệm lập trình hiện tại, một năng lực muốn đạt được và một sản phẩm muốn xây sau khóa học.

**Kết quả:** bạn hiểu khóa học dành cho ai và hình dung được sản phẩm đầu ra của mình.

## 0.2 Your Learning Roadmap

[Chương trình](../README.md) gồm Module 0 + 18 module, tổng cộng 19 trang module:

| Giai đoạn | Module | Mục tiêu |
| --- | --- | --- |
| Định hướng | 0 | Hiểu cách học và sử dụng tài liệu |
| Nền tảng | 1–5 | Setup, Rust, Solana mental model, Anchor và testing |
| Core projects | 6–11 | Voting, token, escrow, frontend, stablecoin và AMM |
| Chuyên sâu tự chọn | Chọn 12, 13 hoặc 14 | Privacy & ZK, Data Indexing hoặc Forecasting App |
| AI/Agent track | 15–17 | x402 Payments, MCP và AI Agents |
| Hoàn thiện sản phẩm | 18 và capstone | Security, release readiness và trình bày sản phẩm |

Module 12–14 là ba hướng độc lập; không cần học tuần tự cả ba. Module 15–17 tạo thành track liên tục. Đọc [bản đồ phụ thuộc](../../docs/module-dependencies.md) trước khi chuyển module, nhất là khi chọn một hướng chuyên sâu. Xem nội dung security của Module 18 trước khi đưa MCP hoặc AI Agent lên Devnet.

Bạn chưa cần học toàn bộ Rust, validator internals hay cryptography trước khi viết chương trình đầu tiên. Hãy hoàn thành kiến thức cần thiết theo prerequisite của từng module.

**Thực hành:** chọn một hướng capstone dự kiến và ghi lại ba module/kiến thức cần hoàn thành trước hướng đó. Bạn có thể điều chỉnh lựa chọn khi hiểu rõ hơn các project.

**Kết quả:** bạn phân biệt được core track, nhánh tự chọn và AI/Agent track, đồng thời biết cách kiểm tra prerequisite.

## 0.3 Prerequisites & Readiness Check

Tự đánh giá những kỹ năng sau:

| Kỹ năng | Câu hỏi tự kiểm tra | Nếu chưa sẵn sàng |
| --- | --- | --- |
| Lập trình cơ bản | Bạn đọc được biến, hàm, điều kiện và vòng lặp trong một đoạn code ngắn? | Ôn lại các khái niệm này bằng ngôn ngữ đã học trước khi code-along |
| Terminal | Bạn biết xem thư mục hiện tại, liệt kê file và chuyển thư mục? | Tập dùng `pwd`, `ls`, `cd` trên thư mục thử nghiệm |
| Git | Bạn hiểu clone, diff và commit dùng để làm gì? | Ôn Git cơ bản và tập trên repo dùng thử trước khi làm bài tập |
| Đọc lỗi | Bạn tìm được lệnh thất bại và thông báo lỗi đầy đủ? | Tập phân biệt command, output và error; đọc quy trình ở lesson 0.5 |

Bạn cần laptop macOS, Linux hoặc Windows qua WSL2 và editor như VS Code. Đọc [setup guide](../../docs/setup.md) để biết môi trường được hỗ trợ; chưa cần cài công cụ ở lesson này.

Rust nền tảng, account model, Anchor và testing sẽ được dạy trong khóa học. Bạn không cần biết trước PDA hay viết Solana program để hoàn thành Module 0.

**Thực hành:** đánh dấu kỹ năng đã có, ghi phần cần ôn và việc cụ thể sẽ làm trước Module 1. Đây là tự đánh giá, không phải bài thi cài đặt.

**Kết quả:** bạn biết prerequisite nào đã đáp ứng và phần nào cần chuẩn bị thêm.

## 0.4 How to Use the GitHub Repository

Truy cập [Solana Bootcamp trên Corelia Academy](https://corelia.academy/learn/courses/solana-bootcamp) để học theo từng lesson cùng các nội dung bổ trợ của khóa học. Nếu xem video trên YouTube, mở thêm nội dung khóa học và docs của lesson; sau video, hoàn thành bài thực hành và checklist tương ứng.

GitHub repo chứa tài liệu và code đồng hành với video. Bắt đầu từ [README của repo](../../README.md), mở [trang chương trình](../README.md), rồi đọc README và lessons của module đang học.

| Thư mục | Nội dung | Khi sử dụng |
| --- | --- | --- |
| `curriculum/` | Mục tiêu, prerequisite, lessons và lab | Trước và trong mỗi module |
| `docs/` | Setup, troubleshooting, cách học và đánh giá | Khi chuẩn bị môi trường hoặc cần hướng dẫn chung |
| `projects/` | Code-along theo các trạng thái | Khi thực hành project tương ứng |
| `exercises/` | Bài tập code bổ sung | Khi lesson yêu cầu bài tập |
| `notes/` | Ghi chú khái niệm và sơ đồ | Khi cần ôn hoặc giải thích lại kiến thức |
| `capstones/` | Hướng dẫn dự án cuối khóa | Khi chọn và hoàn thiện capstone |

Với project có nhiều trạng thái:

- **starter:** điểm bắt đầu để tự làm, có thể có TODO hoặc test đỏ/skip có chủ ý.
- **checkpoint-1, checkpoint-2:** điểm đối chiếu hoặc phục hồi khi bị kẹt; đọc diff và giải thích phần thiếu trước khi tiếp tục.
- **final:** bản tham khảo để kiểm tra sau khi đã tự làm hoặc ghi rõ vấn đề đang gặp.

Đọc README của đúng trạng thái trước khi chạy lệnh; không phải mọi thư mục đều có cùng command hoặc cấu trúc. Với Module 1, bạn sẽ tạo project mẫu bên ngoài repo theo hướng dẫn riêng, chưa dùng một starter có sẵn.

Nhịp học là **Xem → Dừng video → Code → Test → Đối chiếu**. Trước khi xem, đọc mục tiêu; trong lúc xem, dừng để tự làm; cuối lesson, kiểm tra kết quả và yêu cầu lab. [Cách học khóa online](../../docs/course-operations.md) giải thích chi tiết việc sử dụng checkpoint và chuyển bài.

**Thực hành:** từ trang chương trình, tìm Module 1, [setup guide](../../docs/setup.md) và [troubleshooting](../../docs/troubleshooting.md). Sau đó mở [PDA Counter](../../projects/pda-counter/README.md) để tìm README starter, checkpoint và final; chỉ tìm đường dẫn, chưa chạy code của module tương lai.

**Kết quả:** bạn tìm được đúng tài liệu/code và biết lúc nào nên dùng từng trạng thái project.

## 0.5 Video, Documentation & Tool Versions

### Video và docs được cập nhật như thế nào?

Video phản ánh công cụ và code tại thời điểm quay. Trong quá trình sản xuất video và sau khi khóa học được phát hành, tài liệu trên GitHub vẫn tiếp tục được cập nhật để sửa lỗi, làm rõ bước thực hành và điều chỉnh hướng dẫn.

Bạn có thể thấy khác biệt về phiên bản công cụ, câu lệnh, cấu trúc file, giao diện hoặc kết quả hiển thị. Khi cách thao tác trong video khác tài liệu, **ưu tiên docs hiện hành của lesson và tài liệu setup trong repo khóa học**. Video giúp bạn hiểu quy trình; docs cung cấp các bước thực hành được cập nhật.

Đọc ghi chú cập nhật ở tài liệu liên quan trước khi làm theo. Nếu dùng bản clone cũ, đối chiếu với trang GitHub hiện hành; xem `git status` và bảo toàn thay đổi bài làm trước khi cập nhật bản local. Nếu docs và code bạn đang dùng khác phiên bản, xác định commit/release và phần hướng dẫn tương ứng trước khi tiếp tục.

### Vì sao cần dùng phiên bản của khóa học?

Dùng bộ phiên bản trong [setup guide](../../docs/setup.md#baseline-được-khóa). Phiên bản mới hơn có thể thay đổi API, template, lệnh CLI hoặc cách build/test, dẫn tới lỗi tương thích với code trong khóa học. Không tự chọn `latest` hoặc cập nhật toàn bộ công cụ chỉ để thử sửa lỗi.

Chỉ cập nhật khi docs hướng dẫn và đọc các bước chuyển đổi đi kèm. Tài liệu tham khảo bên ngoài có thể dùng phiên bản khác; đối chiếu với baseline của khóa trước khi áp dụng. Bảng phiên bản được quản lý tại setup guide để tránh thông tin lệch giữa các lesson.

### Khi kết quả khác video

1. **Kiểm tra docs và ghi chú cập nhật:** mở đúng lesson và xác định bước đang thực hiện.
2. **Kiểm tra phiên bản:** so output version với setup guide; lưu cả hệ điều hành và terminal đang dùng.
3. **Kiểm tra ngữ cảnh:** thư mục hiện tại, command, cấu hình cluster/wallet và code/checkpoint tương ứng.
4. **Tra troubleshooting:** bắt đầu từ lệnh đầu tiên thất bại, đọc toàn bộ lỗi và thử từng thay đổi có lý do.
5. **Ghi lại vấn đề nếu chưa giải quyết:** command, thư mục chạy lệnh, kết quả mong đợi/thực tế, lỗi đầy đủ, phiên bản và các cách đã thử cùng kết quả.

Không đưa seed phrase, private key, keypair file, access token hoặc secret vào báo cáo, screenshot hay chat. Public address, Program ID và transaction signature có thể dùng làm minh chứng.

**Thực hành:** mô tả cách xử lý tình huống video dùng một command nhưng docs đã có ghi chú thay thế. Tìm nơi kiểm tra baseline và liệt kê thông tin cần ghi lại nếu command vẫn lỗi.

**Kết quả:** bạn biết nguồn hướng dẫn cần ưu tiên, lý do dùng phiên bản được khóa và cách chẩn đoán sai khác mà không cập nhật công cụ tùy tiện.

## Hoàn thành Module 0

Hoàn thành [readiness checklist](./readiness-checklist.md), sau đó chuyển sang [Module 1 — Solana Setup & First Deployment](../module-01-orientation/README.md).
