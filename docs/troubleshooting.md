# Setup troubleshooting

When asking for help, include your OS, terminal, the command that failed, the complete error, and tool versions from the setup guide.

## Known errors

| Symptom | Likely cause | First check |
| --- | --- | --- |
| `command not found` | PATH not reloaded | restart shell, inspect `which <command>` |
| Anchor uses unexpected Rust | multiple toolchains/overrides | `rustup show` in project directory |
| Program ID mismatch | source, keypair, and `Anchor.toml` disagree | compare `declare_id!`, `anchor keys list` |
| `AccountNotInitialized` | wrong PDA/cluster or missing setup | print derived address and provider cluster |
| Blockhash not found | transaction built too early | rebuild with fresh blockhash and retry policy |
| Airdrop fails | faucet/rate limit | web faucet or instructor transfer |
| Tests hang on validator | stale process or port | locate validator process and inspect logs |
| WSL build is very slow | repository under `/mnt/c` | move to `~/code` inside WSL |

## `anchor` or `solana` is not found

Restart the terminal after installation and confirm the installer-added binary directory is in `PATH`. Do not install similarly named npm packages as a substitute.

## Anchor uses the wrong Solana or Rust version

Chạy `rustup show`, `solana --version`, `anchor --version` và `which anchor`. Bỏ shell alias cũ và bảo đảm Anchor version do AVM chọn xuất hiện trước trong `PATH`.

## WSL files are slow

Keep the repository in the Linux filesystem (for example `~/code/solana-bootcamp`), not under `/mnt/c`.

## Local validator ports are already used

Stop stale validators before starting another. Avoid deleting a ledger until you have confirmed it contains no work you need.

## Devnet airdrop is rate-limited

Use the official web faucet, wait before retrying, or ask an instructor for Devnet SOL. Never buy or transfer mainnet SOL for a bootcamp exercise.

## Build output có vẻ bị cũ

First rerun the normal build. If cleanup is necessary, remove only the target project's generated `target`, `.anchor`, or `test-ledger` directory after confirming the path.

## Program ID mismatch

Generate or select the program keypair first, run `anchor keys list`, then make `declare_id!` and the relevant cluster entry in `Anchor.toml` match. Never commit a wallet keypair.

## Useful diagnostic bundle

```bash
uname -a
rustup show
rustc --version
cargo --version
solana --version
solana config get
anchor --version
```
