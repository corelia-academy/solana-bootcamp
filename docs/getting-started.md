# Những điều học viên cần biết trước khi bắt đầu

Khóa học dành cho lập trình viên mới tiếp cận Solana, có kiến thức lập trình cơ bản; không yêu cầu từng học blockchain hoặc có ví crypto. Bạn nên đọc được code, dùng terminal và hiểu Git ở mức cơ bản; Rust cần thiết được dạy ở Module 2.

Bắt đầu với [Module 0 — Bootcamp Orientation & Blockchain Basics](../curriculum/module-00-orientation/README.md) để hiểu đối tượng học, lộ trình, cách dùng tài liệu và các khái niệm blockchain trước khi cài môi trường ở Module 1.

## Truy cập khóa học

Mở [Solana Bootcamp trên Corelia Academy](https://corelia.academy/learn/courses/solana-bootcamp) để học theo từng lesson và xem các nội dung bổ trợ của khóa học. Video trên YouTube là phần bài giảng; hãy kết hợp với nội dung khóa học, tài liệu và bài thực hành trong GitHub repo để hoàn thành từng module.

## Bạn sẽ học được gì?

- Giải thích account/transaction model của Solana.
- Viết, kiểm thử và triển khai program bằng Rust và Anchor.
- Kết nối frontend TypeScript với program onchain.
- Nhận diện lỗi validation và rủi ro bảo mật phổ biến.
- Xây và trình bày một ứng dụng qua [capstone](../capstones/README.md).

## Lộ trình và cách học

[Chương trình](../curriculum/README.md) gồm **Module 0 + 18 module**, tổng cộng 19 trang module. Sau phần định hướng và blockchain cơ bản là nền tảng Module 1–5, core projects Module 6–11, một nhánh tự chọn trong Module 12–14, AI/Agent track Module 15–17 và Security & Production ở Module 18.

Đọc [Your Learning Roadmap](../curriculum/module-00-orientation/lessons.md#02-your-learning-roadmap) và [bản đồ phụ thuộc](./module-dependencies.md) để chọn hướng học. Mỗi bài thực hành đi theo nhịp **Xem → Dừng video → Code → Test → Đối chiếu**; [hướng dẫn dùng repo](../curriculum/module-00-orientation/lessons.md#04-how-to-use-the-github-repository) giải thích starter, checkpoint và final.

Module 0 giải thích blockchain, ví và chữ ký, transaction, program, account, các mạng thực hành và luồng hoạt động của dApp. Cuối module, [dùng thử Phantom và Explorer](../curriculum/module-00-orientation/lessons.md#010-dùng-thử-phantom-và-đọc-explorer): tạo ví, nhận SOL Devnet và xem giao dịch, chưa cần code. Hoàn thành [bài tự kiểm tra](../curriculum/module-00-orientation/lessons.md#tự-kiểm-tra-trước-module-1) để chắc rằng bạn hiểu các thuật ngữ sẽ gặp khi setup. Mô hình account/transaction chuyên sâu nằm ở Module 3.

## Video, docs và phiên bản

GitHub docs được cập nhật trong lúc quay video và sau khi phát hành, nên một số bước có thể khác video. Ưu tiên docs hiện hành của lesson/setup và dùng bộ phiên bản được khóa trong [setup guide](./setup.md#baseline-được-khóa). Phiên bản mới hơn có thể gây lỗi tương thích; chỉ cập nhật khi docs hướng dẫn.

Đọc [Video, Documentation & Tool Versions](../curriculum/module-00-orientation/lessons.md#05-video-documentation--tool-versions) để hiểu quy tắc đầy đủ và cách kiểm tra sai khác. Trang này không lặp bảng phiên bản; setup guide là nơi quản lý baseline.

## Chuẩn bị và xử lý lỗi

Chuẩn bị laptop macOS, Linux hoặc Windows qua WSL2, editor và kiến thức terminal/Git cơ bản. Hoàn thành [readiness checklist](../curriculum/module-00-orientation/readiness-checklist.md) trước Module 1; chưa cần cài toolchain để hoàn thành Module 0.

Khi gặp lỗi, đọc [troubleshooting](./troubleshooting.md), kiểm tra docs/version và ghi command, thư mục chạy lệnh, lỗi đầy đủ cùng các cách đã thử. Đăng câu hỏi lên [GitHub Discussions](https://github.com/corelia-academy/solana-bootcamp/discussions); trao đổi nhanh ở [Corelia Community](https://t.me/corelia_community), [Solana Devs Vietnam](https://t.me/solana_devs_vn) hoặc nhóm [Corelia Builders](https://www.facebook.com/groups/corelia.builders). Không chia sẻ seed phrase, private key, keypair file hoặc access token; chỉ chạy đề xuất sửa lỗi khi hiểu tác động.

## Điều kiện hoàn thành khóa học

Hoàn thành các module bắt buộc, một nhánh chuyên sâu tự chọn và capstone; nộp source code, test output cùng minh chứng theo yêu cầu. Điểm tối thiểu là **75/100**, mức **Đạt** trong [rubric đánh giá](./assessment.md). Đọc [cách học khóa online](./course-operations.md) để hiểu điều kiện chuyển bài và cách nộp kết quả.

## Bắt đầu

1. Truy cập [khóa Solana Bootcamp trên Corelia Academy](https://corelia.academy/learn/courses/solana-bootcamp).
2. Đọc [Module 0 — Bootcamp Orientation & Blockchain Basics](../curriculum/module-00-orientation/README.md).
3. Hoàn thành [readiness checklist](../curriculum/module-00-orientation/readiness-checklist.md).
4. Mở [Module 1 — Solana Setup & First Deployment](../curriculum/module-01-orientation/README.md), làm setup theo docs và thực hành lab từng bước.

## Ghi chú cập nhật

Bản thử nghiệm chuyển định hướng sang Module 0. Thứ tự bắt đầu nay là Module 0 → readiness checklist → Module 1 → setup/lab; bảng phiên bản được dẫn về setup guide để tránh lệch thông tin với docs cập nhật.
