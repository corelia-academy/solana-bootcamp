# Nội dung bài học — Module 0: Bootcamp Orientation & Blockchain Basics

Lesson 0.1–0.4 giúp bạn biết mình sẽ học gì và học như thế nào; lesson 0.5–0.8 cung cấp kiến thức blockchain cơ bản; lesson 0.9 giới thiệu Solana, cách build và những gì bạn sẽ build được. Cuối module, lesson 0.10 hướng dẫn cài Phantom và xem giao dịch đầu tiên trên Explorer. Chưa cần terminal hoặc code.

## 0.1 Welcome to the Solana Bootcamp

Khóa học dành cho lập trình viên mới tiếp cận blockchain và Solana: developer frontend/backend muốn làm ứng dụng onchain, sinh viên đã học lập trình cơ bản hoặc developer từ blockchain khác muốn học Solana. Bạn không cần từng mua crypto, tạo ví hay viết smart contract.

Bạn nên biết cách đọc và viết code cơ bản; kinh nghiệm JavaScript, TypeScript hoặc Rust là một lợi thế. Nếu chưa biết biến, hàm, điều kiện và vòng lặp, hãy bổ sung lập trình nhập môn trước các bài code-along; [readiness checklist](./readiness-checklist.md) giúp bạn tự đánh giá (bài code theo video). Rust cần thiết cho khóa học sẽ được dạy ở Module 2. Mục tiêu khóa học là xây ứng dụng và kiểm chứng code; bài thực hành sử dụng môi trường học tập, không yêu cầu mua SOL.

Sau khóa học, bạn có thể giải thích account/transaction model, viết và kiểm thử Solana program bằng Rust và Anchor, kết nối frontend, nhận diện lỗi kiểm tra dữ liệu đầu vào (validation) và hoàn thiện một ứng dụng để đưa vào portfolio (bộ sản phẩm cá nhân).

Bạn sẽ bắt đầu với chương trình mẫu Hello Solana, sau đó xây các project như PDA Counter, Voting App, SPL Token và Escrow. Các phần sau mở rộng sang DeFi, AI/Agent và security. [Capstone](../../capstones/README.md) là nơi kết hợp kiến thức để xây sản phẩm theo hướng bạn chọn.

Cách học xuyên suốt là xem hướng dẫn, dừng lại để thực hành, kiểm tra kết quả và tự giải thích code. Mục tiêu là hiểu dữ liệu nào thay đổi, ai được phép thay đổi và làm sao kiểm chứng hành vi của ứng dụng.

**Thực hành:** ghi lại kinh nghiệm lập trình hiện tại, một năng lực muốn đạt được và một sản phẩm muốn xây sau khóa học.

**Kết quả:** bạn hiểu khóa học dành cho ai và hình dung được sản phẩm đầu ra của mình.

## 0.2 Your Learning Roadmap

[Chương trình](../README.md) gồm Module 0 + 18 module, tổng cộng 19 trang module:

| Giai đoạn | Module | Mục tiêu |
| --- | --- | --- |
| Định hướng và blockchain cơ bản | 0 | Hiểu cách học, thuật ngữ và luồng giao dịch trước khi setup |
| Nền tảng | 1–5 | Setup, Rust, Solana mental model, Anchor và testing |
| Core projects | 6–11 | Voting, token, escrow, frontend, stablecoin và AMM |
| Chuyên sâu tự chọn | Chọn 12, 13 hoặc 14 | Privacy & ZK, Data Indexing hoặc Forecasting App |
| AI/Agent track | 15–17 | x402 Payments, MCP và AI Agents |
| Hoàn thiện sản phẩm | 18 và capstone | Security, release readiness và trình bày sản phẩm |

Module 12–14 là ba hướng độc lập; không cần học tuần tự cả ba. Module 15–17 tạo thành track liên tục. Đọc [bản đồ phụ thuộc](../../docs/module-dependencies.md) trước khi chuyển module, nhất là khi chọn một hướng chuyên sâu. Xem nội dung security của Module 18 trước khi đưa MCP hoặc AI Agent lên Devnet.

Bạn chưa cần học toàn bộ Rust, validator internals hay cryptography trước khi viết chương trình đầu tiên. Hãy hoàn thành kiến thức cần thiết theo prerequisite của từng module.

**Thực hành:** chọn một hướng capstone dự kiến và ghi lại ba module/kiến thức cần hoàn thành trước hướng đó. Bạn có thể điều chỉnh lựa chọn khi hiểu rõ hơn các project.

**Kết quả:** bạn phân biệt được core track, nhánh tự chọn và AI/Agent track, đồng thời biết cách kiểm tra prerequisite.

## 0.3 How to Use the GitHub Repository

Video của khóa học được đăng chính trên [kênh YouTube chính thức của Solana](https://www.youtube.com/@solana). Bạn cũng có thể học trên [Solana Bootcamp tại Corelia Academy](https://corelia.academy/learn/courses/solana-bootcamp) và kênh của Corelia; đây là lựa chọn thêm. Dù xem ở đâu, hãy mở docs của lesson trong repo; sau video, hoàn thành bài thực hành và checklist tương ứng.

GitHub repo chứa tài liệu và code đồng hành với video. Bắt đầu từ [README của repo](../../README.md), mở [trang chương trình](../README.md), rồi đọc README và lessons của module đang học.

| Thư mục | Nội dung | Khi sử dụng |
| --- | --- | --- |
| `curriculum/` | Mục tiêu, prerequisite, lessons và lab (bài thực hành của module) | Trước và trong mỗi module |
| `docs/` | Setup, troubleshooting, cách học và đánh giá | Khi chuẩn bị môi trường hoặc cần hướng dẫn chung |
| `projects/` | Code-along theo các trạng thái | Khi thực hành project tương ứng |
| `exercises/` | Bài tập code bổ sung | Khi lesson yêu cầu bài tập |
| `notes/` | Ghi chú khái niệm và sơ đồ | Khi cần ôn hoặc giải thích lại kiến thức |
| `capstones/` | Hướng dẫn dự án cuối khóa | Khi chọn và hoàn thiện capstone |

Với project có nhiều trạng thái:

- **starter:** điểm bắt đầu để tự làm, có thể có TODO, test chưa chạy qua (báo đỏ) hoặc test được tạm bỏ qua (skip) có chủ ý.
- **checkpoint-1, checkpoint-2:** điểm đối chiếu hoặc phục hồi khi bị kẹt; so sánh phần khác nhau (diff) với code của bạn và giải thích phần thiếu trước khi tiếp tục.
- **final:** bản tham khảo để kiểm tra sau khi đã tự làm hoặc ghi rõ vấn đề đang gặp.

Đọc README của đúng trạng thái trước khi chạy lệnh; không phải mọi thư mục đều có cùng command hoặc cấu trúc. Với Module 1, bạn sẽ tạo project mẫu bên ngoài repo theo hướng dẫn riêng, chưa dùng một starter có sẵn.

Nhịp học là **Xem → Dừng video → Code → Test → Đối chiếu**. Trước khi xem, đọc mục tiêu; trong lúc xem, dừng để tự làm; cuối lesson, kiểm tra kết quả và yêu cầu lab. [Cách học khóa online](../../docs/course-operations.md) giải thích chi tiết việc sử dụng checkpoint và chuyển bài.

**Thực hành:** từ trang chương trình, tìm Module 1, [setup guide](../../docs/setup.md) và [troubleshooting](../../docs/troubleshooting.md). Sau đó mở [PDA Counter](../../projects/pda-counter/README.md) để tìm README starter, checkpoint và final; chỉ tìm đường dẫn, chưa chạy code của module tương lai.

**Kết quả:** bạn tìm được đúng tài liệu/code và biết lúc nào nên dùng từng trạng thái project.

## 0.4 Video, Documentation & Tool Versions

**Tóm gọn:** video có thể cũ hơn docs. Khi khác nhau, làm theo docs. Dùng đúng phiên bản trong setup guide, không tự cập nhật lên bản mới nhất. Không bao giờ gửi seed phrase hay private key khi hỏi lỗi.

### Vì sao video và docs có thể khác nhau?

Video ghi lại công cụ và code tại thời điểm quay. Sau đó, tài liệu trên GitHub vẫn được cập nhật để sửa lỗi và làm rõ các bước. Vì vậy câu lệnh, cấu trúc file hoặc giao diện có thể khác video. Video giúp bạn hiểu quy trình; **docs hiện hành của lesson và setup guide** cho bạn các bước đúng.

### Vì sao cần dùng phiên bản của khóa học?

Dùng bộ phiên bản trong [setup guide](../../docs/setup.md#baseline-được-khóa). Phiên bản mới hơn có thể đổi lệnh, template hoặc cách build/test, khiến code trong khóa học bị lỗi. Không tự chọn `latest` hoặc cập nhật toàn bộ công cụ chỉ để thử sửa lỗi; chỉ cập nhật khi docs hướng dẫn.

### Khi gặp lỗi

Bạn sẽ cần phần này từ Module 1, khi bắt đầu chạy lệnh. Phần lớn lỗi có thể hỏi AI trước; nếu chưa xong, mở [troubleshooting](../../docs/troubleshooting.md). Dù hỏi AI hay hỏi người, hãy gửi kèm: lệnh đã chạy, thông báo lỗi đầy đủ, phiên bản công cụ và những cách đã thử.

Không đưa seed phrase, private key, file keypair, access token hoặc mật khẩu vào báo cáo, screenshot, chat hoặc khung hỏi AI. Public address, Program ID (địa chỉ của program) và transaction signature có thể chia sẻ.

**Thực hành:** video dùng một command nhưng docs ghi lệnh khác; bạn làm theo cái nào? Tìm bảng phiên bản trong setup guide và liệt kê bốn thông tin cần gửi khi hỏi lỗi.

**Kết quả:** bạn biết ưu tiên docs, hiểu vì sao dùng đúng phiên bản và biết cần gửi gì khi hỏi lỗi.

## 0.5 Từ Web1 đến Web3: blockchain giải quyết vấn đề gì?

### Web1, Web2, Web3 nhìn từ góc developer

| | Web1 | Web2 | Web3 |
| --- | --- | --- | --- |
| Người dùng | Đọc | Đọc và viết | Đọc, viết và sở hữu |
| Dữ liệu nằm ở đâu | File HTML trên server | Database của nền tảng | Account trên blockchain công khai |
| Ai đặt quy tắc | Người viết trang | Backend của công ty, có thể đổi bất cứ lúc nào | Program công khai, ai cũng kiểm tra được |
| Đăng nhập | Không cần | Email, mật khẩu, OAuth | Ví và chữ ký |
| Ví dụ | Trang tin tĩnh | Mạng xã hội, sàn thương mại điện tử, ngân hàng | Ví, sàn hoán đổi token, bình chọn onchain |

Web3 không thay thế Web2. Phần lớn ứng dụng Web3 vẫn có frontend và backend bình thường; blockchain chỉ giữ phần cần công khai và kiểm chứng như tài sản, quyền sở hữu và quy tắc. Phần còn lại của lesson giải thích blockchain làm điều đó bằng cách nào; lesson 0.9 so sánh chi tiết kiến trúc một ứng dụng Web2 và Web3.

### Từ cơ sở dữ liệu đến sổ cái chung

Hình dung một ứng dụng ghi nhận số dư của An và Bình. Với ứng dụng thông thường, backend của đơn vị vận hành kiểm tra yêu cầu và cập nhật database. Các bên sử dụng tin đơn vị đó quản lý bản ghi đúng.

Blockchain cho phép nhiều bên duy trì và kiểm tra một lịch sử giao dịch theo quy tắc chung. **Sổ cái (ledger)** là lịch sử các bản ghi; **trạng thái (state)** là kết quả hiện tại sau khi áp dụng các giao dịch hợp lệ, như số dư hoặc số phiếu. Tham khảo [giới thiệu blockchain và trạng thái](https://ethereum.org/en/developers/docs/intro-to-ethereum/).

### Block, hash và đồng thuận

- **Transaction:** yêu cầu thực hiện một thay đổi, ví dụ chuyển tài sản.
- **Block:** nhóm giao dịch được ghi vào lịch sử của mạng.
- **Hash:** giá trị băm dùng như dấu vân tay của dữ liệu; dữ liệu đổi thì hash cũng thay đổi với xác suất rất cao. Các block liên kết bằng tham chiếu hash, giúp phát hiện việc thay đổi lịch sử. Hash không dùng để giấu nội dung giao dịch. Xem [Blocks](https://ethereum.org/en/developers/docs/blocks/).
- **Node:** máy tính chạy phần mềm tham gia mạng. **Validator:** node tham gia kiểm tra và đồng thuận về các block.
- **Consensus (đồng thuận):** cơ chế để các bên thống nhất lịch sử và trạng thái hợp lệ dù không có một database do một người toàn quyền sửa. Hash giúp kiểm tra dữ liệu; cơ chế đồng thuận quyết định lịch sử được mạng chấp nhận. Xem [Consensus mechanisms](https://ethereum.org/en/developers/docs/consensus-mechanisms/).

Với blockchain công khai, dữ liệu onchain thường có thể được người khác đọc và kiểm chứng. Khi muốn cập nhật trạng thái, bạn gửi giao dịch mới theo quy tắc của mạng. Developer phải thiết kế quyền thay đổi dữ liệu và cách người dùng kiểm tra kết quả.

**Thực hành:** viết hai câu giải thích sự khác nhau giữa một backend tự quản lý số dư và một sổ cái được nhiều bên kiểm tra. Chỉ ra đâu là lịch sử giao dịch, đâu là trạng thái hiện tại trong ví dụ An và Bình.

**Kết quả:** bạn giải thích được vì sao blockchain cần cả dữ liệu liên kết lẫn cơ chế đồng thuận.

## 0.6 Wallet, public key và chữ ký

Ví giúp người dùng quản lý khóa và ký yêu cầu. Tài sản được ghi nhận trên blockchain; giao diện ví đọc các bản ghi để hiển thị số dư. Xem [Wallet Basics](https://solana.com/learn/what-is-a-wallet).

| Khái niệm | Cách hiểu khi học |
| --- | --- |
| Public key / public address | Địa chỉ công khai; dùng để nhận tài sản và tra cứu account |
| Private key | Khóa bí mật dùng để tạo chữ ký; không gửi cho người khác |
| Keypair | Cặp public key và private key; file keypair có chứa bí mật |
| Seed phrase | Cụm từ khôi phục có thể tái tạo khóa của ví; cần giữ bí mật như private key |
| Signature | Chữ ký số để người khác kiểm tra yêu cầu đã được khóa tương ứng ký |

Ký transaction là ký nội dung yêu cầu cụ thể. Mạng kiểm tra chữ ký và các quy tắc thực thi; có chữ ký hợp lệ vẫn có thể thất bại nếu thiếu số dư hoặc vi phạm điều kiện của program. Chữ ký không tiết lộ private key. Xem [Transaction Pipeline](https://solana.com/docs/core/transactions/transaction-pipeline).

Trong báo cáo bài tập, public address và transaction signature có thể chia sẻ để đối chiếu. Seed phrase, private key và nội dung file keypair phải được giữ riêng. Lesson 0.10 hướng dẫn tạo ví Phantom để làm quen; ở đây chỉ cần hiểu vai trò từng thành phần.

**Thực hành:** phân loại public address, seed phrase, transaction signature và file keypair thành “có thể đưa vào bài nộp” hoặc “cần giữ bí mật”. Không dùng dữ liệu từ ví thật.

**Kết quả:** bạn hiểu ví dùng khóa để ký và biết dữ liệu nào được chia sẻ.

## 0.7 Transaction, smart contract và Solana program

> **Tóm gọn:** program là code, account là nơi lưu dữ liệu, instruction là một lệnh gọi program, transaction là gói các lệnh đó kèm chữ ký. Mỗi transaction tốn một khoản phí nhỏ trả bằng SOL.

**Smart contract** là code chạy trên blockchain, kiểm tra điều kiện và thực hiện logic của ứng dụng. Trên Solana, code này gọi là **program**. Deploy đưa code lên mạng để có thể được gọi; mỗi lần người dùng sử dụng ứng dụng là một yêu cầu thực thi riêng. Xem [Programs](https://solana.com/docs/core/programs).

Ba khái niệm sẽ gặp ngay khi thực hành:

| Khái niệm | Vai trò | Ví dụ bình chọn |
| --- | --- | --- |
| Account | Đơn vị lưu trạng thái trên Solana, được xác định bằng địa chỉ | Dữ liệu cuộc bình chọn và số phiếu |
| Program | Code xử lý quy tắc; trạng thái ứng dụng nằm trong các data account riêng | Kiểm tra cuộc bình chọn còn mở rồi tăng số phiếu |
| Instruction | Một yêu cầu gọi program, chỉ rõ account liên quan và dữ liệu đầu vào | Chọn phương án A trong cuộc bình chọn |

Account ở đây là khái niệm lưu dữ liệu của Solana; một ứng dụng có thể dùng nhiều account. Xem [Accounts](https://solana.com/docs/core/accounts) và [Instructions](https://solana.com/docs/core/instructions).

Một **transaction** gói một hoặc nhiều instruction cùng các chữ ký cần thiết. Các instruction được thực thi như một đơn vị: nếu một instruction lỗi, các thay đổi ứng dụng trong transaction được hoàn tác. Mạng vẫn tốn công kiểm tra giao dịch lỗi, nên phí vẫn có thể bị trừ dù kết quả không được ghi lại. Xem [Transactions](https://solana.com/docs/core/transactions).

**SOL** là tài sản gốc dùng để trả phí transaction trên Solana. **Fee payer** là bên trả phí, có thể khác người thực hiện hành động. Phí giao dịch chi trả tài nguyên xử lý của mạng. Khóa học dùng SOL thử nghiệm ở môi trường học tập; bạn sẽ học thao tác cụ thể trong Module 1. Xem [Fees](https://solana.com/docs/core/fees).

Ví dụ trên giấy: An có 3 SOL thử nghiệm, muốn chuyển 1 SOL cho Bình. Giả sử An cũng trả phí `f`, giao dịch thành công làm số dư An giảm `1 + f` SOL và Bình tăng 1 SOL. Nếu program từ chối giao dịch đã được xử lý, Bình không nhận 1 SOL nhưng An vẫn có thể mất phí xử lý.

**Thực hành:** trong ví dụ bình chọn, xác định yêu cầu của người dùng, code kiểm tra quy tắc và dữ liệu cần cập nhật. Giải thích vì sao “ký xong” chưa có nghĩa “bình chọn thành công”. Đây là ví dụ khái niệm, chưa yêu cầu viết code.

**Kết quả:** bạn phân biệt được transaction, instruction, program và account trước khi nhìn project Anchor đầu tiên. Module 3 sẽ đi sâu vào mô hình account/transaction và quyền truy cập.

## 0.8 Mạng thực hành và luồng hoạt động của dApp

> **Tóm gọn:** cluster là một mạng Solana (Localnet, Devnet hoặc Mainnet). dApp là ứng dụng có phần logic hoặc dữ liệu trên blockchain. RPC là cổng để ứng dụng đọc dữ liệu và gửi transaction tới mạng. Explorer là trang tra cứu kết quả. Onchain là phần nằm trên blockchain; offchain là phần còn lại, như giao diện.

### Localnet, Devnet và mainnet

**Cluster** là một mạng Solana gồm các node cùng phục vụ một sổ cái. Khi đọc số dư hay gửi transaction, bạn cần xác định đang dùng mạng nào.

| Môi trường | Dùng để làm gì trong khóa học? |
| --- | --- |
| Localnet | Mạng chạy trên máy để test và debug cục bộ |
| Devnet | Mạng công khai dành cho developer thử ứng dụng với SOL thử nghiệm |
| Mainnet | Mạng vận hành thật, có tài sản mang giá trị thực |

Các môi trường có trạng thái riêng. Cùng một public address có thể có số dư khác nhau ở mỗi mạng. Devnet SOL không chuyển thành SOL mainnet bằng cách đổi cấu hình. Xem [Clusters](https://solana.com/docs/references/clusters).

### Từ giao diện đến blockchain

**dApp** là ứng dụng có một phần logic hoặc trạng thái trên blockchain. **RPC** là giao diện API mà frontend, script hoặc CLI dùng để đọc trạng thái và gửi transaction tới mạng. RPC endpoint quyết định mạng bạn đang truy cập. **Explorer** là giao diện tra cứu account, transaction và kết quả xử lý. Xem [RPC Overview](https://solana.com/docs/rpc) và [Explorer theo cluster](https://solana.com/docs/references/clusters#using-explorers-with-different-clusters).

Ví dụ luồng bình chọn:

```text
Người dùng chọn A trên giao diện
  → Ứng dụng tạo transaction gọi program bình chọn
  → Ví ký transaction sau khi người dùng kiểm tra
  → Ứng dụng gửi qua RPC tới đúng mạng
  → Mạng kiểm tra và thực thi program với các account liên quan
  → Ứng dụng kiểm tra trạng thái xử lý và lỗi, đọc lại số phiếu
```

Transaction signature giúp tra cứu giao dịch; nhận được signature chưa đủ để kết luận thành công. Cần kiểm tra xác nhận và kết quả thực thi. Xem [kết quả trả về của sendTransaction](https://solana.com/docs/rpc/http/sendtransaction).

Đọc số phiếu qua RPC không cần gửi transaction hoặc trả phí transaction onchain. Bấm bình chọn làm thay đổi dữ liệu nên cần transaction được ký và có bên trả phí. Dịch vụ RPC có thể có giới hạn hoặc tính phí dịch vụ riêng. Xem [RPC Overview](https://solana.com/docs/rpc).

**Onchain** là dữ liệu hoặc logic được lưu/thực thi trên blockchain, như số phiếu và quy tắc bình chọn. **Offchain** là phần nằm ngoài blockchain, như giao diện, ảnh minh họa hoặc backend tìm kiếm. Với bài tập này, hãy đặt quy tắc quyết định phiếu hợp lệ trong program; giao diện giúp người dùng gửi yêu cầu và xem kết quả.

**Thực hành:** vẽ lại luồng bình chọn và đánh dấu ví, RPC, program, account cùng phần onchain/offchain. Giải thích vì sao một transaction Devnet không thể được tìm trong lịch sử mainnet.

**Kết quả:** bạn biết các thành phần sẽ gặp ở Module 1 và hiểu mình đang thao tác trên môi trường nào.

## 0.9 Solana: cách hoạt động, cách build và bạn sẽ build được gì

> **Tóm gọn:** Solana tách code (program) khỏi dữ liệu (account) và bắt mỗi transaction khai báo trước account sẽ dùng. Nhờ vậy mạng chạy được nhiều transaction cùng lúc, nhanh và phí thấp. Một ứng dụng Solana gồm program viết bằng Rust, frontend TypeScript và ví của người dùng.

### Solana khác gì?

- **Program không giữ dữ liệu.** Như ở lesson 0.7, mọi trạng thái nằm trong account riêng. Một program có thể phục vụ hàng nghìn account, mỗi account là một bản ghi.
- **Chạy song song.** Mỗi transaction ghi rõ trước các account sẽ đọc và ghi. Hai transaction không đụng cùng account có thể được xử lý cùng lúc, giống hai request không khóa cùng một dòng database. Xem [Transactions](https://solana.com/docs/core/transactions).
- **Nhanh và phí thấp.** Phí cơ bản là 5.000 lamport cho mỗi chữ ký (1 SOL = 1 tỷ lamport). Tháng 10/2026, mainnet kích hoạt nâng cấp đồng thuận Alpenglow, nhắm thời gian chốt giao dịch khoảng 150 ms. Xem [Fees](https://solana.com/docs/core/fees).
- **Lưu dữ liệu cần ký quỹ.** Account phải giữ một lượng SOL tối thiểu tùy theo kích thước dữ liệu; đóng account thì nhận lại. Xem [Accounts](https://solana.com/docs/core/accounts).

### Kiến trúc: ứng dụng Web2 và ứng dụng Web3

Cùng là app bình chọn, đây là cách hai kiểu ứng dụng được ghép lại.

**Web2:** mọi thứ đi qua server của công ty.

```text
Trình duyệt (React)
   │  HTTPS + session/JWT
   ▼
Backend API (Node, Java, Go...)    ← kiểm tra đăng nhập và quy tắc bình chọn
   │  SQL
   ▼
Database (PostgreSQL, MySQL...)    ← lưu số phiếu; công ty sửa được
```

**Web3 trên Solana:** quy tắc và dữ liệu quan trọng nằm onchain, người dùng tự ký.

```text
Trình duyệt (React)  ◄──►  Ví (Phantom)        ← ví giữ khóa và ký transaction
   │  đọc account / gửi transaction đã ký
   ▼
RPC endpoint                                    ← cổng vào mạng Solana
   │
   ▼
Program (Rust/Anchor)  ──đọc/ghi──►  Account    ← quy tắc công khai + số phiếu
─────────────────────────────── offchain, tùy chọn ───────────────────────────────
Indexer / backend phụ   ← tìm kiếm, thống kê, lịch sử
Lưu trữ file            ← ảnh, mô tả dài (không đưa lên chain)
```

| Lớp | Web2 | Web3 trên Solana |
| --- | --- | --- |
| Giao diện | Web/mobile app | Web/mobile app, giống Web2 |
| Xác thực | Email, mật khẩu, session | Ví ký bằng private key; không có mật khẩu lưu ở server |
| Logic nghiệp vụ | Backend API riêng của công ty | Program công khai trên mạng |
| Lưu dữ liệu | Database của công ty | Account onchain; dữ liệu lớn hoặc phụ để offchain |
| Đọc dữ liệu | Gọi API của backend | Gọi RPC đọc account, miễn phí transaction |
| Ghi dữ liệu | Gửi request, server tự ghi | Gửi transaction có chữ ký, trả phí bằng SOL |
| Ai có thể sửa dữ liệu | Công ty, admin, ai chiếm được server | Chỉ qua quy tắc trong program |
| Cập nhật logic | Deploy bản mới bất cứ lúc nào | Chỉ bên giữ quyền nâng cấp program được deploy lại; có thể khóa vĩnh viễn |

Khác biệt lớn nhất: program đã deploy là API công khai. Ai cũng gọi được, kể cả không qua giao diện của bạn, nên program phải tự kiểm tra ai được phép làm gì. Backend Web2 thường tin frontend của mình; program Solana không tin ai cả.

### Các bước build một ứng dụng Solana

1. **Viết program** bằng Rust, dùng framework Anchor để bớt code lặp (giai đoạn Nền tảng).
2. **Test** trên Localnet trước khi đưa lên mạng công khai.
3. **Viết client**: frontend TypeScript kết nối ví, gửi transaction qua RPC và đọc lại account.
4. **Thêm phần offchain nếu cần**: indexer cho tìm kiếm và thống kê, nơi lưu file lớn.
5. **Deploy** lên Devnet để thử; Mainnet chỉ khi đã kiểm tra bảo mật (Module 18).

### Người ta đang xây gì trên Solana?

- **Thanh toán và stablecoin:** chuyển tiền nhanh, phí thấp.
- **DeFi:** sàn hoán đổi token (AMM), cho vay, ký quỹ (escrow).
- **Token và NFT:** điểm thưởng, vé, chứng chỉ, tài sản số.
- **Ứng dụng tiêu dùng:** game, bình chọn, mạng xã hội.
- **AI agent:** agent tự thanh toán và gọi dịch vụ onchain.

### Sau khóa học bạn xây được gì?

| Giai đoạn | Bạn làm được |
| --- | --- |
| Nền tảng | Program Rust/Anchor đầu tiên có test, deploy lên Devnet (Hello Solana, PDA Counter) |
| Core projects | Voting App, SPL Token, Escrow, frontend kết nối ví, stablecoin và AMM |
| Chuyên sâu tự chọn | Privacy & ZK, Data Indexing hoặc Forecasting App |
| AI/Agent track | Thanh toán x402, MCP server và AI agent dùng Solana |
| Hoàn thiện | Kiểm tra bảo mật, chuẩn bị ra mắt và capstone của riêng bạn |

**Thực hành:** chọn một ứng dụng Web2 quen thuộc (ví dụ app tích điểm hoặc bình chọn). Ghi lại phần nào nên đưa onchain, phần nào giữ offchain và cần những account nào.

**Kết quả:** bạn giải thích được Solana khác gì, các thành phần của một ứng dụng Solana và hình dung được sản phẩm mình sẽ xây.

## 0.10 Dùng thử Phantom và đọc Explorer

**Mục tiêu:** trong khoảng 15–20 phút, bạn có ví học tập, nhận được SOL thử và tự tìm thấy giao dịch trên Explorer. Chỉ dùng **Solana Devnet**, không cần mua hoặc nạp tiền thật.

### Bước 1 — Cài Phantom và tạo ví học tập

Mở [trang tải Phantom chính thức](https://phantom.com/download), chọn trình duyệt và cài extension. Mở Phantom, chọn **Create a New Wallet → Create a Recovery Phrase Wallet**, đặt mật khẩu rồi làm theo hướng dẫn. Ghi recovery phrase ra giấy và giữ riêng; không chụp hoặc đưa vào bài nộp. Mật khẩu dùng để mở extension trên máy, recovery phrase dùng để khôi phục ví. Xem [hướng dẫn tạo ví của Phantom](https://phantom.com/learn/guides/how-to-create-a-new-wallet).

**Bạn vừa làm gì?** Tạo khóa để ví ký giao dịch. Số dư ban đầu bằng 0 là bình thường.

### Bước 2 — Chọn Devnet và sao chép địa chỉ

Trong Phantom, bấm avatar → **Settings → Developer Settings → Testnet Mode** rồi chọn **Solana Devnet**. Kiểm tra banner chế độ thử nghiệm. Sau đó chọn **Receive → Solana** và sao chép địa chỉ công khai. Xem [cách bật testnet mode](https://help.phantom.com/articles/use-testnets-in-phantom-5997313271699) và [tìm địa chỉ ví](https://help.phantom.com/articles/find-your-wallet-address-in-phantom-28355153389075).

**Bạn vừa làm gì?** Chọn mạng học tập và lấy địa chỉ nhận SOL. Phantom hỗ trợ nhiều blockchain; bài này chỉ dùng địa chỉ **Solana**.

### Bước 3 — Nhận SOL thử nghiệm

Mở [Solana Faucet](https://faucet.solana.com/), chọn **Devnet**, dán địa chỉ vừa sao chép, chọn lượng SOL nhỏ được trang cho phép và bấm **Confirm Airdrop**. Chờ giao dịch được xử lý rồi xem số dư trong Phantom. Faucet chỉ cần public address; không nhập recovery phrase hoặc private key vào trang này.

**Bạn vừa làm gì?** Nhận SOL thử từ faucet, tức dịch vụ cấp tài sản thử nghiệm miễn phí. Nếu faucet giới hạn lượt, đợi rồi thử lại; chưa cần xử lý bằng CLI.

### Bước 4 — Tìm ví và giao dịch trên Explorer

Mở [Solana Explorer trên Devnet](https://explorer.solana.com/?cluster=devnet), kiểm tra mạng **Devnet** rồi dán địa chỉ ví vào ô tìm kiếm. Xem số dư và mở giao dịch nhận SOL vừa xuất hiện trong lịch sử. Nếu faucet có trả link giao dịch, bạn cũng có thể mở link đó và kiểm tra lại mạng.

Chỉ cần đọc các thông tin sau:

| Thông tin | Hiểu đơn giản |
| --- | --- |
| Address / địa chỉ | Bạn đang xem ví nào; đối chiếu với địa chỉ đã copy từ Phantom |
| Balance / số dư | Ví đang có bao nhiêu SOL trên Devnet |
| Signature / mã giao dịch | Mã để tra lại đúng giao dịch; khác với địa chỉ ví |
| Status / trạng thái | Giao dịch đã được xác nhận chưa và có thực thi thành công không |
| Chuyển SOL và Fee / phí | Ai gửi, ai nhận, bao nhiêu SOL và phí xử lý; xem trong chi tiết giao dịch |

Với giao dịch nhận từ faucet, bên gửi cấp SOL và trả phí; bạn là bên nhận. Đọc ví và giao dịch trên Explorer không cần kết nối ví hay ký. Chi tiết chữ ký và phí có trong [Transactions](https://solana.com/docs/core/transactions) và [Fees](https://solana.com/docs/core/fees).

**Nếu chưa thấy dữ liệu:** kiểm tra Phantom và Explorer đều chọn Solana Devnet, địa chỉ có đúng không, rồi chờ và tải lại. Ví chưa nhận SOL có thể chưa có dữ liệu trên Explorer.

**Thử thêm nếu học cùng bạn:** gửi **0.01 SOL Devnet** tới địa chỉ Solana Devnet của bạn học bằng **Send → SOL**. Trước khi xác nhận, kiểm tra mạng, người nhận, số lượng và phí. Sau đó tìm giao dịch trên Explorer để thấy lần này ví của bạn là bên gửi và trả phí. Xem [hướng dẫn gửi của Phantom](https://help.phantom.com/articles/how-to-send-crypto-from-phantom-5530158379539). Phần này không bắt buộc.

**Hoàn thành:** lưu hai link Explorer Devnet — một link ví, một link giao dịch nhận SOL — và giải thích được số dư, trạng thái, người gửi/nhận và phí. Không cần chụp toàn bộ màn hình ví.

Tên nút có thể thay đổi theo phiên bản Phantom; dùng các hướng dẫn chính thức ở trên nếu giao diện khác. Sang Module 1, bạn sẽ tạo ví CLI riêng để deploy; giữ ví Phantom này để dùng giao diện, không cần chuyển recovery phrase giữa hai ví.

## Tự kiểm tra trước Module 1

Trả lời bằng lời của bạn, không cần code hoặc công cụ:

1. Blockchain dùng cơ chế gì để nhiều bên cùng chấp nhận một lịch sử giao dịch?
2. Bạn gửi public address hay seed phrase để người khác tra cứu ví? Vì sao?
3. Trong ứng dụng bình chọn, program và data account có vai trò gì?
4. Xem số phiếu và gửi phiếu khác nhau thế nào về transaction, chữ ký và phí?
5. Transaction có hai instruction; instruction thứ hai lỗi thì thay đổi ứng dụng từ instruction thứ nhất có được giữ không? Phí thì sao?
6. RPC đã trả signature nhưng chưa có kết quả xác nhận; bạn có thể báo thành công chưa? Nếu Explorer không thấy transaction, cần kiểm tra mạng nào?
7. Web2 và Web3 khác nhau thế nào về nơi lưu dữ liệu và ai đặt quy tắc?
8. Vì sao transaction trên Solana phải khai báo trước các account sẽ dùng?

<details>
<summary>Gợi ý đối chiếu sau khi tự trả lời</summary>

1. Các node kiểm tra theo quy tắc chung; cơ chế đồng thuận giúp mạng thống nhất lịch sử và trạng thái hợp lệ.
2. Gửi public address. Seed phrase có thể khôi phục khóa ký nên phải giữ bí mật.
3. Program thực thi quy tắc; data account lưu trạng thái như số phiếu.
4. Đọc qua RPC không cần transaction thay đổi state hay phí transaction; gửi phiếu cần transaction, chữ ký cần thiết và fee payer.
5. Các thay đổi ứng dụng được hoàn tác; transaction đã xử lý vẫn có thể mất phí.
6. Chưa. Cần kiểm tra xác nhận, lỗi thực thi và đúng cluster của RPC/Explorer.
7. Web2: dữ liệu trong database của công ty, công ty đặt và đổi quy tắc. Web3: dữ liệu quan trọng nằm onchain, quy tắc nằm trong program công khai.
8. Để mạng biết transaction nào không đụng nhau và xử lý chúng song song.

</details>

Nếu còn lúng túng, đọc lại lesson 0.5–0.9 rồi tự giải thích lại ví dụ. Không cần học trước account constraints hoặc Anchor để trả lời các câu hỏi này.

## Hoàn thành Module 0

Hoàn thành [readiness checklist](./readiness-checklist.md), sau đó chuyển sang [Module 1 — Solana Setup & First Deployment](../module-01-orientation/README.md).
