# Những điều học viên cần biết trước khi bắt đầu

Trang này giúp bạn kiểm tra khóa học có phù hợp hay không, chuẩn bị môi trường và hiểu cách học trước khi bắt đầu Module 1.

## Khóa học dành cho ai?

Khóa học dành cho lập trình viên mới tiếp cận Solana. Bạn nên có kiến thức lập trình cơ bản; kinh nghiệm với JavaScript, TypeScript hoặc Rust là một lợi thế.

Đây không phải khóa học “zero-code”. Rust nền tảng được dạy trong Module 2, nhưng bạn vẫn cần biết cách đọc code, sử dụng terminal và làm việc với Git ở mức cơ bản.

## Bạn sẽ học được gì?

Sau khóa học, bạn có thể:

- giải thích Solana mental model, transaction và account model;
- tạo ví học tập, sử dụng Devnet và kiểm tra giao dịch trên Solana Explorer;
- sử dụng Solana CLI trong quy trình phát triển;
- viết, kiểm thử và triển khai Solana program bằng Rust và Anchor;
- kết nối frontend TypeScript với program onchain;
- nhận diện các lỗi validation và rủi ro bảo mật phổ biến;
- xây dựng, kiểm thử và trình bày một ứng dụng Solana hoàn chỉnh.

## Khóa học gồm những phần nào?

[Chương trình đầy đủ](../curriculum/README.md) gồm 18 module:

1. **Nền tảng (Module 1–5):** định hướng và môi trường, Rust Survival Kit, Solana Mental Model, Anchor Fundamentals và Testing Stack.
2. **Core projects (Module 6–11):** Voting App, SPL Token, Escrow, Frontend Integration, Stablecoin Lite và Simple AMM.
3. **Nhánh tự chọn (chọn Module 12, 13 hoặc 14):** Privacy & ZK, Data Indexing hoặc Forecasting App.
4. **AI và automation (Module 15–17):** x402 Payments, Model Context Protocol và AI Agents on Solana.
5. **Production (Module 18):** security, release readiness và capstone.

Ba module 12–14 là các hướng chuyên sâu độc lập. Module 18 nên được xem trước khi đưa MCP hoặc AI Agent lên Devnet.

## Học theo hình thức nào?

Mỗi module đi theo nhịp:

`Xem → Dừng video → Code → Test → Đối chiếu`

Bạn sẽ:

- xem video bài giảng theo đúng thứ tự prerequisite;
- bắt đầu bài thực hành từ `starter` và code theo hướng dẫn;
- hoàn thành bài tập, test và minh chứng sau mỗi module;
- chỉ dùng checkpoint để phục hồi khi bị kẹt và chỉ đọc `final` sau khi đã tự làm hoặc ghi rõ vấn đề;
- tham gia workshop hoặc mentor session nếu có lịch: `[quy định mentor session]`;
- xây dựng và nộp dự án cuối khóa theo [hướng dẫn capstone](../capstones/README.md).

Đọc [Cách học khóa online](./course-operations.md) để hiểu quy trình nộp bài, điều kiện chuyển module và cách sử dụng checkpoint.

## Cần chuẩn bị gì?

### Thiết bị và tài khoản

- laptop chạy macOS, Linux hoặc Windows qua WSL2;
- Git và tài khoản GitHub;
- VS Code hoặc editor tương đương;
- một ví Solana riêng chỉ dùng để học trên Devnet.

Không dùng ví mainnet làm ví học tập. Không commit hoặc chia sẻ seed phrase, private key hay keypair file.

### Toolchain

Khóa học sử dụng baseline sau:

| Công cụ | Phiên bản |
| --- | --- |
| Rust | 1.87.0 |
| Solana CLI | 3.0.10 |
| Anchor CLI | 0.31.1 |
| Node.js | 22 LTS |
| pnpm | 9.x |

Làm theo [Hướng dẫn cài đặt môi trường](./setup.md) và hoàn thành phần kiểm tra cài đặt trước Module 2. Không cài theo phiên bản `latest` nếu tài liệu khóa học đã khóa phiên bản.

## Khi gặp lỗi thì hỏi ở đâu?

Kênh hỏi đáp và hỗ trợ chính thức: [GitHub Discussions](https://github.com/corelia-academy/solana-bootcamp/discussions).

Trước khi đăng câu hỏi:

1. Đọc [Hướng dẫn xử lý lỗi](./troubleshooting.md).
2. Tận dụng AI để phân tích thông báo lỗi và gợi ý hướng kiểm tra.
3. Đọc kỹ từng đề xuất, chỉ chạy lệnh hoặc sửa code khi bạn hiểu tác động.
4. Tìm trong GitHub Discussions để tránh tạo câu hỏi trùng lặp.
5. Nếu vẫn chưa giải quyết được, hãy tạo Discussion mới và chuẩn bị:

- hành vi bạn mong đợi;
- hành vi thực tế;
- toàn bộ thông báo lỗi hoặc ảnh chụp lỗi rõ ràng;
- đoạn code nhỏ nhất có liên quan;
- hệ điều hành và phiên bản Rust, Solana CLI, Anchor, Node.js, pnpm;
- prompt đã hỏi AI và phần phản hồi có liên quan;
- những giải pháp đã thử và kết quả của từng giải pháp.

Không cung cấp seed phrase, private key, keypair file, access token hoặc secret khác cho AI hay trong Discussion. Không chạy lệnh do AI đề xuất nếu bạn chưa hiểu lệnh đó sẽ đọc, sửa hoặc xóa dữ liệu nào.

Nếu vấn đề liên quan đến mất tiền, lộ khóa, giao dịch đáng ngờ hoặc một rủi ro bảo mật đang diễn ra, hãy ngừng thử nghiệm và hỏi hỗ trợ ngay. Không cần tiếp tục thử với AI trước khi đăng câu hỏi.

## Điều kiện hoàn thành khóa học

Để được ghi nhận hoàn thành, học viên cần:

- hoàn thành các module bắt buộc và một nhánh chuyên sâu tự chọn;
- nộp đầy đủ bài tập, source code, test output và các minh chứng được yêu cầu;
- hoàn thành và nộp capstone;
- đạt tối thiểu **75/100**, tương ứng mức **Đạt** trong [rubric đánh giá](./assessment.md).

Workshop hoặc mentor session không phải điều kiện bắt buộc, trừ khi `[quy định mentor session]` quy định khác.

## Học viên nhận được gì?

Học viên đáp ứng điều kiện hoàn thành có thể nhận:

- chứng nhận hoàn thành khóa học do `[đơn vị cấp chứng nhận]` cấp;
- huy hiệu kỹ năng theo `[cách nhận huy hiệu]`;
- một dự án capstone để bổ sung vào portfolio;
- nền tảng để tiếp tục xây dựng sản phẩm hoặc tham gia UniHackfest và các Solana hackathon.

Khóa học cung cấp kiến thức và sản phẩm thực hành để chuẩn bị cho hackathon; không đảm bảo việc được tuyển chọn hoặc đạt giải.

## Bắt đầu

1. Đọc [chương trình 18 module](../curriculum/README.md).
2. Hoàn thành [cài đặt môi trường](./setup.md).
3. Bắt đầu với [Module 1 — Định hướng & môi trường](../curriculum/module-01-orientation/README.md).
