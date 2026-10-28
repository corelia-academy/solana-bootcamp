# Nội dung bài học — Module 1: Solana Setup & First Deployment

Hướng dẫn dùng baseline trong [setup guide](../../docs/setup.md). Các command Anchor dưới đây được đối chiếu với [mã nguồn CLI Anchor 1.2.1](https://github.com/otter-sec/anchor/blob/v1.2.1/cli/src/lib.rs). Nếu video quay bằng Anchor 0.31, ưu tiên command trong tài liệu này: từ Anchor 1.0, `anchor deploy`/`anchor upgrade` chuyển thành `anchor program deploy`/`anchor program upgrade`, `anchor test` chạy Surfpool, và IDL được tải lên onchain ngay khi deploy.

## 1.1 Setup Development Environment

**Đoạn video:** 00:00–02:46.

Cài công cụ theo [setup guide](../../docs/setup.md): macOS dùng Xcode Command Line Tools; Linux dùng build dependencies của distro; Windows dùng WSL2 Ubuntu. Trên Windows, chạy toàn bộ Rust, Solana, Anchor, Node và pnpm trong WSL, không trộn binary Windows/Linux.

Chạy các lệnh kiểm tra từ terminal dùng cho khóa học:

```bash
rustc --version
cargo --version
solana --version
anchor --version
node --version
pnpm --version
```

**Kết quả mong đợi:** từng command chạy được và version khớp bảng baseline trong setup guide. Nếu không khớp, kiểm tra `PATH`, toolchain/AVM và [troubleshooting](../../docs/troubleshooting.md) trước khi tiếp tục. Không cài `latest` để thử sửa lỗi.

**Thực hành:** lưu hệ điều hành, terminal và sáu version output. Toolchain của project mẫu được khóa thêm ở lesson 1.3 vì project nằm bên ngoài repo.

## 1.2 Wallet & Devnet

**Đoạn video:** 02:46–06:58.

Tạo wallet riêng để học theo [wallet và Devnet](../../docs/setup.md#wallet-và-devnet). Chỉ chạy lệnh tạo wallet nếu file chưa tồn tại; nếu đã tạo, dùng lại file đó, không ghi đè.

Các command chạy từ terminal bất kỳ:

```bash
solana-keygen new --outfile ~/.config/solana/bootcamp-devnet.json
solana config set --keypair ~/.config/solana/bootcamp-devnet.json
solana config set --url devnet
solana config get
solana address
solana balance --url devnet
solana airdrop 2 --url devnet
solana balance --url devnet
```

**Kết quả mong đợi:** RPC là Devnet, keypair path là wallet học tập và balance có Devnet SOL. Nếu airdrop bị giới hạn, dùng [faucet Solana chính thức](https://faucet.solana.com/) theo troubleshooting. Lượng SOL cần cho deploy/IDL phụ thuộc kích thước program và phí; nếu thiếu balance, bổ sung Devnet SOL rồi chạy lại bước bị lỗi.

Mở [Solana Explorer](https://explorer.solana.com/?cluster=devnet), chọn Devnet và tìm public wallet address. Public key dùng để tìm account; keypair file dùng để ký và không được chia sẻ. Không dùng ví hoặc SOL mainnet cho bài này.

**Thực hành:** lưu public address và link Explorer có `cluster=devnet`; không lưu seed phrase hoặc nội dung keypair trong báo cáo.

## 1.3 Your First Anchor Project

**Đoạn video:** 06:58–11:52.

### Tạo project ngoài repository

Từ terminal, tạo thư mục bài làm riêng bên ngoài repo khóa học. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init hello-solana --package-manager pnpm --test-template mocha --no-install
cd hello-solana
```

Nếu `hello-solana` đã tồn tại, mở project đó để tiếp tục; không dùng `--force` hoặc xóa project để làm lại. Mọi command còn lại của lesson 1.3–1.5 chạy trong `~/code/bootcamp-labs/hello-solana`, nơi có `Anchor.toml`.

Project này nằm ngoài repo nên không tự kế thừa `rust-toolchain.toml` và `.nvmrc` của khóa học. Tạo file `rust-toolchain.toml` tại root project với nội dung:

```toml
[toolchain]
channel = "1.89.0"
components = ["rustfmt", "clippy"]
profile = "minimal"
```

Tạo `.nvmrc` chứa `24`; chọn Node 24 theo setup guide rồi kiểm tra `node --version` trong terminal hiện tại. File `.nvmrc` chỉ ghi phiên bản, không tự chuyển Node.

Trong `Anchor.toml`, bổ sung vào section `[toolchain]` đã có, không tạo section trùng:

```toml
[toolchain]
anchor_version = "1.2.1"
solana_version = "4.1.2"
package_manager = "pnpm"
```

Trong `programs/hello-solana/Cargo.toml`, đặt dependency `anchor-lang` thành `"=1.2.1"`, giữ nguyên các section và feature do template sinh ra.

Trong `package.json`, đặt dependency `@anchor-lang/core` thành `"1.2.1"` để client khớp CLI/program. Giữ các dependency khác do template tạo. Chạy:

```bash
pnpm install
anchor keys sync
anchor keys list
```

Giữ lockfiles đã tạo để lần cài sau dùng cùng dependency. `anchor keys sync` đồng bộ Program ID với program keypair. Kiểm tra `declare_id!` trong `programs/hello-solana/src/lib.rs` và `hello_solana` trong `[programs.localnet]` của `Anchor.toml` cùng địa chỉ với `anchor keys list`.

### Đọc cấu trúc và test local

- `Anchor.toml`: workspace, địa chỉ program, cluster, wallet và test command.
- `programs/hello-solana/src/lib.rs`: source Rust, có instruction mẫu `initialize`.
- `tests/hello-solana.ts`: test TypeScript gọi instruction mẫu và in signature.
- `app/`: nơi dành cho frontend; chưa cần viết ở module này.
- `target/idl/` và `target/types/`: interface và type sinh ra sau build.
- `target/deploy/`: binary `.so` cùng program keypair; wallet học tập và program keypair là hai file khác nhau.

Trong section `[provider]` đã có, đặt:

```toml
[provider]
cluster = "localnet"
wallet = "~/.config/solana/bootcamp-devnet.json"
```

Giữ test script pnpm do template sinh ra. Sau đó chạy:

```bash
anchor build
anchor test --provider.cluster localnet
```

**Kết quả mong đợi:** build thành công, có `target/deploy/hello_solana.so` và `target/idl/hello_solana.json`; test mẫu báo passing và in transaction signature. Với Anchor 1.2.1, `anchor test` tự khởi động Surfpool làm local validator; không để một validator khác chiếm port 8899. Muốn dùng `solana-test-validator` như video cũ, thêm `--validator legacy`.

Solana CLI ở lesson 1.2 đang chọn Devnet, nhưng Anchor ở bước này chọn localnet bằng cấu hình/flag riêng. Signature của test local không thể tra trên Explorer Devnet.

**Thực hành:** chú thích cây thư mục, lưu build/test output và giải thích source khác generated artifact như thế nào. Không xóa program keypair sau build vì lesson tiếp theo cần giữ cùng Program ID.

## 1.4 Deploy & Upgrade Program on Devnet

**Đoạn video:** 11:52–17:15.

### Đồng bộ cấu hình trước deploy

Trong root project, lấy public Program ID:

```bash
anchor keys list
```

Trong `Anchor.toml`, giữ `[programs.localnet]` và thêm `[programs.devnet]` với cùng Program ID. Thay `YOUR_PROGRAM_ID` bằng địa chỉ `hello_solana` vừa đọc; không dùng địa chỉ mẫu trong video.

```toml
[programs.devnet]
hello_solana = "YOUR_PROGRAM_ID"
```

Đổi `cluster` trong `[provider]` đang có thành `"devnet"`; giữ wallet học tập. Đây là chỉnh sửa section hiện có, không thêm `[provider]` thứ hai.

```toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/bootcamp-devnet.json"
```

Chạy và kiểm tra lại Program ID, cluster và balance:

```bash
anchor keys sync
anchor build
solana config get
solana balance --url devnet
```

**Kết quả mong đợi:** `declare_id!`, các entry `hello_solana` trong Anchor.toml và `address` trong IDL local cùng Program ID; wallet có đủ Devnet SOL. Chỉ tiếp tục khi provider của Anchor và RPC Solana CLI đều trỏ Devnet, wallet đúng file học tập.

### Deploy lần đầu

```bash
anchor program deploy --provider.cluster devnet
```

**Kết quả mong đợi:** command báo deploy thành công trên Devnet và Program ID khớp `anchor keys list`. Ghi lại địa chỉ này. Trong các command bên dưới, đặt biến bằng public Program ID của bạn:

```bash
BOOTCAMP_PROGRAM_ID=YOUR_PROGRAM_ID
solana program show "$BOOTCAMP_PROGRAM_ID" --url devnet
```

Thay `YOUR_PROGRAM_ID` trước khi chạy. Biến chỉ có hiệu lực trong terminal hiện tại; nếu mở terminal mới, đặt lại biến. `solana program show` phải trả về program đã deploy và upgrade authority khớp public address của wallet học tập.

### Upgrade cùng program

Trong `programs/hello-solana/src/lib.rs`, thêm dòng sau vào hàm `initialize`, trước `Ok(())`; giữ nguyên chữ ký hàm và `declare_id!`:

```rust
msg!("Hello Solana: upgraded program");
```

Từ root project, build và upgrade:

```bash
anchor build
anchor program upgrade "$BOOTCAMP_PROGRAM_ID" --program-filepath target/deploy/hello_solana.so --provider.cluster devnet
solana program show "$BOOTCAMP_PROGRAM_ID" --url devnet
```

**Kết quả mong đợi:** upgrade thành công, Program ID không đổi; deployment slot được cập nhật. Wallet cần là upgrade authority. Lesson 1.5 sẽ gọi `initialize` và kiểm tra log mới để xác nhận phiên bản sau upgrade.

**Thực hành:** lưu output deploy/upgrade và public Program ID. Giữ program keypair để tiếp tục cùng địa chỉ; không đổi authority hoặc tạo program mới trong bài này.

## 1.5 Explorer, IDL & Devnet Testing

**Đoạn video:** 17:15–22:04.

### Kiểm tra Explorer và IDL local

Trên [Explorer Devnet](https://explorer.solana.com/?cluster=devnet), tìm Program ID của bạn và xác nhận đây là executable program. Link program và wallet phải chọn Devnet.

Mở `target/idl/hello_solana.json`: `address` phải khớp Program ID; phần `instructions` có `initialize`. IDL mô tả interface để client gọi program, không phải binary `.so`. Ở module này chỉ cần đọc địa chỉ và instruction; cách viết account/constraint sẽ học sau.

### Đọc IDL trên Devnet

Từ Anchor 1.0, `anchor program deploy` tự tải IDL lên onchain qua Program Metadata Program; không cần bước `idl init` riêng như Anchor 0.31. Trong root project, dùng cùng biến `BOOTCAMP_PROGRAM_ID` ở lesson 1.4:

```bash
anchor idl fetch "$BOOTCAMP_PROGRAM_ID" --out /tmp/bootcamp-hello-solana-devnet-idl.json --provider.cluster devnet
```

**Kết quả mong đợi:** file fetch có `address` và danh sách instruction khớp `target/idl/hello_solana.json`.

`anchor program upgrade` chỉ thay binary, không cập nhật IDL. Khi interface thay đổi (thêm instruction, account hoặc field), cập nhật IDL onchain rồi fetch lại:

```bash
anchor idl upgrade --filepath target/idl/hello_solana.json "$BOOTCAMP_PROGRAM_ID" --provider.cluster devnet
anchor idl fetch "$BOOTCAMP_PROGRAM_ID" --out /tmp/bootcamp-hello-solana-devnet-idl.json --provider.cluster devnet
```

Thực hành lệnh upgrade IDL để hiểu thao tác này. Lần thay đổi log ở lesson 1.4 không đổi interface nên danh sách instruction vẫn như cũ. Nếu đã deploy với `--no-idl`, dùng `anchor idl init --filepath target/idl/hello_solana.json "$BOOTCAMP_PROGRAM_ID" --provider.cluster devnet` một lần trước. Wallet dùng cập nhật IDL cần có IDL authority.

### Test chương trình đã deploy

Giữ test `tests/hello-solana.ts` do template sinh ra: test dùng `AnchorProvider.env()`, gọi `initialize` và in transaction signature. Trong root project chạy:

```bash
anchor test --provider.cluster devnet --skip-deploy
```

**Kết quả mong đợi:** test passing và in signature của transaction Devnet. `--skip-deploy` sử dụng chương trình đã deploy/upgrade ở lesson 1.4, nhưng test vẫn ký và gửi transaction gọi instruction. Cluster Devnet không khởi động local validator. Client test dùng IDL local đã build, vì vậy cần kiểm tra IDL onchain bằng bước fetch riêng phía trên.

Mở signature trên Explorer Devnet, kiểm tra transaction thành công, Program ID được gọi và log `Hello Solana: upgraded program`. Lưu link transaction làm minh chứng upgrade. Để test local về sau, chỉ định lại `--provider.cluster localnet`; không chạy `anchor test` mặc định rồi mặc nhiên cho rằng đó là localnet khi provider đang chọn Devnet.

**Thực hành:** lưu link program, signature/link test Devnet, kết quả đối chiếu IDL và test output.

## Lab cuối module

Hoàn thành tuần tự lesson 1.1–1.5 trên cùng project mẫu và [setup checklist](./setup-checklist.md). Mỗi bước cần có kết quả mong đợi trước khi chuyển bước; khi lỗi, dùng [troubleshooting](../../docs/troubleshooting.md) và [quy trình xử lý sai khác](../module-00-orientation/lessons.md#05-video-documentation--tool-versions).

Nộp một báo cáo ngắn gồm:

- OS, terminal và sáu version output.
- Public wallet address và Explorer Devnet link.
- Cây thư mục có chú thích config/source/test/generated artifact.
- Build output và test local passing.
- Output deploy/upgrade, public Program ID và program Explorer link.
- Kết quả IDL init/upgrade/fetch; xác nhận address/instructions khớp local.
- Test Devnet passing và transaction link có log sau upgrade.

Không nộp seed phrase, keypair file hoặc nội dung `target/deploy/*-keypair.json`. Kiểm tra screenshot/output trước khi chia sẻ.

## Ghi chú cập nhật so với video

Bản thử nghiệm chuyển bootcamp map sang Module 0, chọn pnpm khi init project, khóa toolchain trong project ngoài repo và tách test local/Devnet bằng cluster rõ ràng. Lab nay yêu cầu deploy, upgrade, IDL và test Devnet; checklist cũ chỉ yêu cầu build/test. Các khác biệt tiếp theo cần được ghi tại lesson bị ảnh hưởng theo [quy tắc video và docs](../module-00-orientation/lessons.md#05-video-documentation--tool-versions).

## Điều hướng

[Module 1](./README.md) · [Setup checklist](./setup-checklist.md) · [Module 2 — Rust Survival Kit](../module-02-rust/README.md)
