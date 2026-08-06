# Cài đặt môi trường phát triển

Môi trường được hỗ trợ là macOS, Linux và Windows qua WSL2. Native Windows shell không nằm trong support path chính của khóa học.

Đọc [quy tắc video, docs và phiên bản](../curriculum/module-00-orientation/lessons.md#05-video-documentation--tool-versions) trước khi cài. Khi thao tác khác video, ưu tiên docs của khóa học và baseline dưới đây; chỉ cập nhật công cụ khi docs hướng dẫn.

## Baseline được khóa

| Tool | Baseline | Mục đích |
| --- | --- | --- |
| Rust | 1.89.0 | Solana program và Rust lab (tối thiểu của `anchor-lang` 1.x) |
| Solana CLI (Agave) | 4.1.2 | Wallet, deploy, `cargo build-sbf` và thao tác Devnet |
| Anchor CLI | 1.2.1 | Build và test Anchor program (cài qua AVM) |
| Surfpool | 1.1.2 trở lên | Local validator mặc định của `anchor test` từ Anchor 1.0 |
| Node.js | 24 LTS | TypeScript client, frontend và automation lab |
| pnpm | 9.x | Cài dependency riêng trong từng project |

Module 12 là nhánh tự chọn và có thêm toolchain riêng: `nargo 1.0.0-beta.20` cùng
`bb 3.0.0-nightly.20251104`. Không cần cài hai công cụ này để học các module bắt buộc. Phiên bản
được pin vì circuit artifact, proving backend và verification key là một compatibility boundary;
không dùng `latest` khi tạo proof cho bài nộp.

Rust được khóa bằng `rust-toolchain.toml`; Node được khóa bằng `.nvmrc`. Mỗi project tự quản dependency, repository root không có `package.json` hay `node_modules`.

## macOS

1. Cài Xcode Command Line Tools: `xcode-select --install`.
2. Cài Homebrew nếu máy chưa có.
3. Cài Rust bằng rustup; repo tự chọn 1.89.0 qua `rust-toolchain.toml`.
4. Cài Solana CLI 4.1.2: `sh -c "$(curl -sSfL https://release.anza.xyz/v4.1.2/install)"` (máy đã có Agave thì `agave-install init 4.1.2`).
5. Cài AVM rồi Anchor 1.2.1:
   ```bash
   rustup toolchain install stable
   RUSTUP_TOOLCHAIN=stable cargo install --git https://github.com/otter-sec/anchor avm --tag v1.2.1 --locked --force
   RUSTUP_TOOLCHAIN=stable avm install 1.2.1 && avm use 1.2.1
   ```
   AVM 1.2.1 cần rustc 1.91 trở lên để build (`cargo-platform` trong lockfile), nên hai lệnh cài chạy bằng Rust stable. Chỉ công cụ CLI dùng stable; program vẫn build bằng Rust 1.89.0 theo `rust-toolchain.toml` của project.
6. Cài Surfpool (local validator mặc định của `anchor test`) theo hướng dẫn tại surfpool.run.
7. Cài Node.js 24 LTS, rồi bật pnpm 9 bằng Corepack: `corepack enable && corepack prepare pnpm@9 --activate`.

## Linux hoặc Windows WSL2

1. Trên Windows, cài WSL2 với Ubuntu và chạy mọi lệnh còn lại trong Ubuntu.
2. Cài build dependencies: compiler toolchain, `pkg-config`, OpenSSL development headers, `curl` và Git.
3. Cài Rust bằng rustup; repo tự chọn 1.89.0 qua `rust-toolchain.toml`.
4. Cài Solana CLI 4.1.2: `sh -c "$(curl -sSfL https://release.anza.xyz/v4.1.2/install)"`.
5. Cài AVM rồi Anchor 1.2.1 (cùng lệnh như macOS).
6. Cài Surfpool theo hướng dẫn tại surfpool.run.
7. Cài Node.js 24 LTS trong cùng môi trường, rồi chạy `corepack enable && corepack prepare pnpm@9 --activate`.

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
surfpool --version
node --version
pnpm --version
```

## Nâng cấp từ bản cài theo video cũ

Video cũ cài bằng script một lệnh, ra Rust 1.87.0, Solana CLI 4.1.1, Anchor 0.31.1, Surfpool 1.5.0, Node 24 và Yarn. Bản Anchor, Solana và Rust này không build được project của khóa học. Chạy các lệnh kiểm tra ở trên, rồi chỉ chạy dòng ứng với công cụ bị lệch:

```bash
rustup toolchain install 1.89.0
agave-install init 4.1.2
rustup toolchain install stable
RUSTUP_TOOLCHAIN=stable cargo install --git https://github.com/otter-sec/anchor avm --tag v1.2.1 --locked --force
RUSTUP_TOOLCHAIN=stable avm install 1.2.1 && avm use 1.2.1
corepack enable && corepack prepare pnpm@9 --activate
```

Mở terminal mới rồi kiểm tra lại. Surfpool 1.5.0 và Node 24 của video cũ đã đạt baseline, không cần cài lại. `rustc --version` ở ngoài project có thể vẫn in bản mặc định; trong project, `rust-toolchain.toml` tự chọn 1.89.0.

Nếu `pnpm --version` vẫn in bản khác 9 sau lệnh `corepack`, máy còn một pnpm cài riêng đứng trước trong `PATH`. Chạy `which -a pnpm` để xem; dòng đầu tiên phải là pnpm của corepack, nằm cùng thư mục với `node`.

## Công cụ AI hỗ trợ code (tùy chọn)

Không bắt buộc để học. Nếu dùng agent viết code (Claude Code, Codex, Cursor, VS Code Copilot, Windsurf), cài hai công cụ chính thức của Solana Foundation để agent đọc tài liệu Solana và Anchor hiện hành thay vì nhớ bản cũ:

- **Skill `solana-dev`**: hướng dẫn cho agent về Anchor, testing với Surfpool, client và security checklist. Video cũ đã cài skill này; chạy lại lệnh để lấy bản mới, vì bản cũ nhắm Anchor 1.1. `-g` cài cho mọi project, `-y` chọn sẵn mọi agent tìm thấy trên máy.

  ```bash
  npx skills add https://github.com/solana-foundation/solana-dev-skill -g -y
  ```

- **Solana Developer MCP** ([mcp.solana.com](https://mcp.solana.com)): MCP server từ xa, không cần API key, endpoint `https://mcp.solana.com/mcp`. Có tool tra tài liệu Solana/Anchor và `program_autofixer` soát lỗi bảo mật trong program Rust. Không đọc hay ký gì trên chain. Với Claude Code:

  ```bash
  claude mcp add --scope user --transport http solana-mcp https://mcp.solana.com/mcp
  claude mcp list
  ```

  `--scope user` để server dùng được ở mọi project; thiếu cờ này thì chỉ có ở thư mục đang đứng. `claude mcp list` phải in `solana-mcp: https://mcp.solana.com/mcp (HTTP) - ✔ Connected`; trong Claude Code, `/mcp` liệt kê các tool như `list_sections`, `program_autofixer`. Cursor, VS Code, Windsurf và Codex: làm theo tab tương ứng trên [mcp.solana.com](https://mcp.solana.com).

Khi code agent gợi ý khác code của khóa học (ví dụ dùng `@solana/kit` thay cho `@anchor-lang/core`, hoặc phiên bản khác baseline), làm theo code-along và baseline ở trên. Không đưa seed phrase hay file keypair cho agent.

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
- output của bảy lệnh kiểm tra version;
- địa chỉ Devnet wallet, chỉ gồm public key;
- link Devnet Explorer;
- output `anchor build` và test local thành công từ project dùng để kiểm tra;
- Program ID, output deploy/upgrade, kết quả IDL và link transaction test Devnet theo [Module 1 setup checklist](../curriculum/module-01-orientation/setup-checklist.md).

## Ghi chú cập nhật so với video

Baseline đã nâng lên Anchor 1.2.1, Solana CLI 4.1.2, Rust 1.89.0 và Node 24 LTS; máy cài theo video cũ nâng cấp theo [mục ở trên](#nâng-cấp-từ-bản-cài-theo-video-cũ). Khác biệt chính so với video quay bằng Anchor 0.31: package TypeScript là `@anchor-lang/core` (thay cho `@coral-xyz/anchor`), `anchor test` chạy Surfpool thay cho `solana-test-validator`, và `anchor build` báo lỗi khi Program ID lệch nên cần chạy `anchor keys sync` trước lần build đầu tiên. Project mẫu chọn pnpm và khóa toolchain riêng vì nằm ngoài repo; các bước cấu hình, build/test và Devnet được ghi chi tiết ở Module 1. Yêu cầu hoàn thành nay bao gồm deploy/upgrade, IDL và test Devnet bên cạnh smoke test local.
