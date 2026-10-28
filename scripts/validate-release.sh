#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mode="${1:---content}"
cd "$repo_dir"

require_version() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" != "$expected"* ]]; then
    echo "$label không đúng: cần '$expected', nhận '$actual'" >&2
    exit 1
  fi
}

require_version "Rust" "$(rustc --version)" "rustc 1.89.0"
require_version "Solana CLI" "$(solana --version)" "solana-cli 4.1.2"
require_version "Anchor CLI" "$(anchor --version)" "anchor-cli 1.2.1"
require_version "Node.js" "$(node --version)" "v24."
require_version "pnpm" "$(pnpm --version)" "9."

ruby -rjson -e 'Dir.glob("**/package.json").reject { |p| p.include?("node_modules") }.each { |p| JSON.parse(File.read(p)) }'
ruby -e '
require "pathname"
errors = []
Dir.glob("**/*.md").reject { |p| p.include?("node_modules") }.each do |file|
  File.read(file).scan(/\[[^\]]*\]\(([^)]+)\)/).flatten.each do |raw|
    link = raw.sub(/^</, "").sub(/>$/, "").split("#", 2)[0]
    next if link.empty? || link.match?(%r{^(https?://|mailto:)})
    errors << "#{file}: #{raw}" unless Pathname.new(File.dirname(file)).join(link).cleanpath.exist?
  end
end
abort(errors.join("\n")) unless errors.empty?
'

ruby -e '
expected = %w[
  module-00-orientation module-01-orientation module-02-rust
  module-03-solana-mental-model module-04-anchor module-05-testing
  module-06-voting module-07-spl-token module-08-escrow module-09-frontend
  module-10-stablecoin module-11-amm module-12-privacy-zk
  module-13-indexing module-14-forecasting module-15-x402 module-16-mcp
  module-17-ai-agents module-18-security
].sort
actual = Dir.children("curriculum").select { |name| File.directory?(File.join("curriculum", name)) }.sort
missing = expected - actual
extra = actual - expected
unless missing.empty? && extra.empty?
  abort("Tập module không đúng (cần Module 00–18). Thiếu: #{missing.join(", ")}; thừa: #{extra.join(", ")}")
end
'
[[ -z "$(find . -type d -name tests -empty -not -path '*/node_modules/*')" ]]
[[ -z "$(rg -n '[[:blank:]]+$' --glob '!**/node_modules/**' --glob '!**/target/**' --glob '!**/dist/**' . || true)" ]]

for readme in projects/*/{starter,checkpoint-1,checkpoint-2,final}/README.md; do
  [[ -f "$readme" ]] || continue
  for heading in "Mục tiêu state" "Phần đã có" "Học viên cần làm" "Chạy và kiểm tra"; do
    rg -qF "## $heading" "$readme" || { echo "$readme thiếu '$heading'" >&2; exit 1; }
  done
done

git diff --check
echo "Content audit đạt."

if [[ "$mode" != "--full" ]]; then
  echo "Chạy '$0 --full' để dry-run các module rủi ro cao."
  exit 0
fi

run_pnpm() {
  local dir="$1"
  shift
  pnpm --dir "$dir" install --no-frozen-lockfile
  pnpm --dir "$dir" "$@"
}

run_pnpm projects/pda-counter/final test
run_pnpm projects/voting-app/final test
run_pnpm projects/token-basics/final test
run_pnpm projects/escrow/final test
run_pnpm projects/voting-frontend/final test
pnpm --dir projects/voting-frontend/final run build
run_pnpm projects/stablecoin-lite/final test
run_pnpm projects/simple-amm/final test
run_pnpm projects/x402-paywall/final test
run_pnpm projects/mcp-solana-server/final test
run_pnpm projects/ai-agent-solana/final test

echo "Instructor dry-run đạt cho Module 5–11 và 15–17."
