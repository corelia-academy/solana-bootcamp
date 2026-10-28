#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_wallet="$project_dir/target/test-wallet.json"

mkdir -p "$project_dir/target"
if [[ ! -f "$test_wallet" ]]; then
  solana-keygen new --no-bip39-passphrase --silent --force --outfile "$test_wallet"
fi

cd "$project_dir"
# Anchor 1.x báo lỗi khi declare_id! lệch với program keypair trong target/deploy.
anchor keys sync
ANCHOR_WALLET="$test_wallet" anchor test --provider.wallet "$test_wallet"
