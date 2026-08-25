# Cài đặt môi trường phát triển

Môi trường được hỗ trợ là macOS, Linux và Windows qua WSL2. Native Windows shell không nằm trong support path chính của khóa học.

Đọc [quy tắc video, docs và phiên bản](../curriculum/module-00-orientation/lessons.md#05-video-documentation--tool-versions) trước khi cài. Khi thao tác khác video, ưu tiên docs của khóa học và baseline dưới đây; chỉ cập nhật công cụ khi docs hướng dẫn.

## Baseline được khóa

| Tool | Baseline | Mục đích |
| --- | --- | --- |
| Rust | 1.87.0 | Solana program và Rust lab |
| Solana CLI | 3.0.10 | Local validator, wallet, deploy và thao tác Devnet |
| Anchor CLI | 0.31.1 | Build và test Anchor program |
| Node.js | 22 LTS | TypeScript client, frontend và automation lab |
| pnpm | 9.x | Cài dependency riêng trong từng project |

Module 12 là nhánh tự chọn và có thêm toolchain riêng: `nargo 1.0.0-beta.20` cùng
`bb 3.0.0-nightly.20251104`. Không cần cài hai công cụ này để học các module bắt buộc. Phiên bản
được pin vì circuit artifact, proving backend và verification key là một compatibility boundary;
không dùng `latest` khi tạo proof cho bài nộp.

Rust được khóa bằng `rust-toolchain.toml`; Node được khóa bằng `.nvmrc`. Mỗi project tự quản dependency, repository root không có `package.json` hay `node_modules`.

## macOS

1. Cài Xcode Command Line Tools: `xcode-select --install`.
2. Cài Homebrew nếu máy chưa có.
3. Cài Rust 1.87.0 bằng rustup.
4. Cài Solana CLI 3.0.10 bằng installer chính thức.
5. Cài AVM, sau đó cài và chọn Anchor 0.31.1.
6. Cài Node.js 22 LTS, rồi bật pnpm 9 bằng Corepack: `corepack enable && corepack prepare pnpm@9 --activate`.

## Linux hoặc Windows WSL2

1. Trên Windows, cài WSL2 với Ubuntu và chạy mọi lệnh còn lại trong Ubuntu.
2. Cài build dependencies: compiler toolchain, `pkg-config`, OpenSSL development headers, `curl` và Git.
3. Cài Rust 1.87.0 bằng rustup.
4. Cài Solana CLI 3.0.10 bằng installer chính thức.
5. Cài AVM, sau đó cài và chọn Anchor 0.31.1.
6. Cài Node.js 22 LTS trong cùng môi trường, rồi chạy `corepack enable && corepack prepare pnpm@9 --activate`.

## Ma trận cài đặt

| Area | macOS | Linux | Windows |
| --- | --- | --- | --- |
| Shell | Terminal/iTerm | Bash/Zsh | WSL2 Ubuntu shell |
| Build tool | Xcode Command Line Tools | Compiler package của distro | Cài trong WSL2 |
| File khóa học | Thư mục user thông thường | Thư mục user thông thường | Filesystem WSL như `~/code` |
| Solana/Anchor | Cài trong macOS shell | Cài trong Linux shell | Chỉ cài trong WSL |

Không dùng lẫn binary Node/Rust/Solana của Windows và WSL trong cùng một project.

## Wallet và Devnet

Tạo wallet riêng để học. Không tái sử dụng mainnet wallet và không commit seed phrase/keypair.

```bash
solana-keygen new --outfile ~/.config/solana/bootcamp-devnet.json
solana config set --keypair ~/.config/solana/bootcamp-devnet.json
solana config set --url devnet
solana address
solana balance
```

Nếu CLI airdrop bị giới hạn, hãy nhận Devnet SOL qua faucet chính thức. Khi kiểm tra transaction trên Solana Explorer, chọn cluster Devnet.

## Kiểm tra cài đặt

```bash
rustc --version
cargo --version
solana --version
anchor --version
node --version
pnpm --version
```

## Anchor smoke test

Tạo project mẫu bên ngoài repository khóa học để generated files và package tải về không trở thành course content:

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init hello-solana --package-manager pnpm --no-install
cd hello-solana
```

Từ root project `~/code/bootcamp-labs/hello-solana`, tiếp tục [lesson 1.3](../curriculum/module-01-orientation/lessons.md#13-your-first-anchor-project) để khóa toolchain trong project ngoài repo, cài dependency, chọn wallet và chạy build/test local. Sau smoke test, làm lesson 1.4–1.5 để deploy/upgrade, xuất bản IDL và test Devnet. Nếu project đã tồn tại, dùng lại project, không ghi đè hoặc khởi tạo lại.

## Lựa chọn Container và Codespaces

Dev Container hoặc Codespace là phương án dự phòng khi không thể ổn định môi trường local. Container phải khóa đúng version của khóa học và lưu Solana wallet bên ngoài image. Lộ trình mặc định vẫn dùng macOS/Linux/WSL local để học viên hiểu các công cụ đang sử dụng.

## Minh chứng hoàn thành setup

Trước Module 2, nộp:

- hệ điều hành và terminal;
- output của sáu lệnh kiểm tra version;
- địa chỉ Devnet wallet, chỉ gồm public key;
- link Devnet Explorer;
- output `anchor build` và test local thành công từ project dùng để kiểm tra;
- Program ID, output deploy/upgrade, kết quả IDL và link transaction test Devnet theo [Module 1 setup checklist](../curriculum/module-01-orientation/setup-checklist.md).

## Ghi chú cập nhật so với video

Bản thử nghiệm giữ nguyên baseline. Project mẫu chọn pnpm và khóa toolchain riêng vì nằm ngoài repo; các bước cấu hình, build/test và Devnet được ghi chi tiết ở Module 1. Yêu cầu hoàn thành nay bao gồm deploy/upgrade, IDL và test Devnet bên cạnh smoke test local.
