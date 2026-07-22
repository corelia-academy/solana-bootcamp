# Cài đặt môi trường phát triển

Môi trường được hỗ trợ là macOS, Linux và Windows qua WSL2. Native Windows shell không nằm trong support path chính của khóa học.

## Baseline được khóa

| Tool | Baseline | Mục đích |
| --- | --- | --- |
| Rust | 1.87.0 | Solana programs and Rust labs |
| Solana CLI | 3.0.10 | Local validator, wallet, deploy, Devnet operations |
| Anchor CLI | 0.31.1 | Anchor programs, builds, and tests |
| Node.js | 22 LTS | TypeScript clients, frontend và automation labs |
| pnpm | 9.x | Cài dependency riêng trong từng project |

Rust được khóa bằng `rust-toolchain.toml`; Node được khóa bằng `.nvmrc`. Mỗi project tự quản dependency, repository root không có `package.json` hay `node_modules`.

## macOS

1. Install Xcode Command Line Tools: `xcode-select --install`.
2. Install Homebrew if it is not present.
3. Install Rust 1.87.0 with rustup.
4. Install Solana CLI 3.0.10 using the official installer.
5. Install AVM, then install and select Anchor 0.31.1.
6. Install Node.js 22 LTS, rồi bật pnpm 9 bằng Corepack: `corepack enable && corepack prepare pnpm@9 --activate`.

## Linux or Windows WSL2

1. On Windows, install WSL2 with Ubuntu and run all remaining commands inside Ubuntu.
2. Install build dependencies: compiler toolchain, `pkg-config`, OpenSSL development headers, `curl`, and Git.
3. Install Rust 1.87.0 with rustup.
4. Install Solana CLI 3.0.10 using the official installer.
5. Install AVM, then install and select Anchor 0.31.1.
6. Install Node.js 22 LTS trong cùng môi trường, rồi chạy `corepack enable && corepack prepare pnpm@9 --activate`.

## Ma trận cài đặt

| Area | macOS | Linux | Windows |
| --- | --- | --- | --- |
| Shell | Terminal/iTerm | Bash/Zsh | WSL2 Ubuntu shell |
| Build tools | Xcode Command Line Tools | distro compiler packages | install inside WSL2 |
| Course files | normal user directory | normal user directory | WSL filesystem such as `~/code` |
| Solana/Anchor | install in macOS shell | install in Linux shell | install inside WSL only |

Do not mix Windows Node/Rust/Solana binaries with WSL binaries in one project.

## Wallet và Devnet

Tạo wallet riêng để học. Không tái sử dụng mainnet wallet và không commit seed phrase/keypair.

```bash
solana-keygen new --outfile ~/.config/solana/bootcamp-devnet.json
solana config set --keypair ~/.config/solana/bootcamp-devnet.json
solana config set --url devnet
solana address
solana balance
```

Request Devnet SOL through the official faucet if CLI airdrops are rate-limited. Verify transactions using Solana Explorer with the cluster set to Devnet.

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
cd /tmp
anchor init hello-solana
cd hello-solana
anchor build
anchor test
```

## Lựa chọn Container và Codespaces

A Dev Container or Codespace may be offered as a fallback for learners who cannot stabilize a local environment. It must pin the same course versions and persist the Solana wallet outside the image. The normal teaching path remains a local macOS/Linux/WSL setup so learners understand the tools they are using.

## Minh chứng hoàn thành setup

Before Module 2, submit:

- operating system and terminal;
- output của sáu lệnh kiểm tra version;
- Devnet wallet address (public key only);
- Devnet Explorer link;
- successful `anchor build` and `anchor test` output from the disposable project.
