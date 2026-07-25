# Xử lý lỗi cài đặt

Khi cần hỗ trợ, hãy cung cấp hệ điều hành, terminal, lệnh bị lỗi, toàn bộ error và version công cụ trong hướng dẫn cài đặt.

## Các lỗi thường gặp

| Hiện tượng | Nguyên nhân có thể | Kiểm tra đầu tiên |
| --- | --- | --- |
| `command not found` | `PATH` chưa được reload | Khởi động lại shell, kiểm tra `which <command>` |
| Anchor dùng sai Rust | Có nhiều toolchain/override | Chạy `rustup show` trong thư mục project |
| Program ID không khớp | Source, keypair và `Anchor.toml` khác nhau | So sánh `declare_id!` với `anchor keys list` |
| `AccountNotInitialized` | Sai PDA/cluster hoặc thiếu bước setup | In địa chỉ đã derive và provider cluster |
| Không tìm thấy blockhash | Transaction được tạo quá sớm | Tạo lại với blockhash mới và retry policy |
| Airdrop thất bại | Faucet/rate limit | Dùng web faucet hoặc nhờ instructor chuyển |
| Test bị treo ở validator | Process hoặc port cũ | Tìm validator process và kiểm tra log |
| WSL build rất chậm | Repository nằm trong `/mnt/c` | Chuyển vào `~/code` trong WSL |

## `anchor` or `solana` is not found

Khởi động lại terminal sau khi cài và xác nhận thư mục binary do installer thêm đã nằm trong `PATH`. Không cài package npm trùng tên để thay thế.

## Anchor uses the wrong Solana or Rust version

Chạy `rustup show`, `solana --version`, `anchor --version` và `which anchor`. Bỏ shell alias cũ và bảo đảm Anchor version do AVM chọn xuất hiện trước trong `PATH`.

## File trên WSL bị chậm

Đặt repository trong Linux filesystem, ví dụ `~/code/solana-bootcamp`, không đặt dưới `/mnt/c`.

## Port của local validator đang được sử dụng

Dừng validator process cũ trước khi chạy process mới. Không xóa ledger khi chưa chắc chắn nó không chứa dữ liệu cần giữ.

## Devnet airdrop bị rate limit

Dùng web faucet chính thức, chờ trước khi retry hoặc nhờ instructor cấp Devnet SOL. Không mua hoặc chuyển mainnet SOL để làm bài tập bootcamp.

## Build output có vẻ bị cũ

Trước tiên hãy chạy lại lệnh build thông thường. Nếu cần cleanup, chỉ xóa thư mục generated `target`, `.anchor` hoặc `test-ledger` của đúng project sau khi đã xác nhận đường dẫn.

## Program ID mismatch

Tạo hoặc chọn program keypair, chạy `anchor keys list`, rồi đồng bộ `declare_id!` với cluster entry tương ứng trong `Anchor.toml`. Không commit wallet keypair.

## Bộ thông tin chẩn đoán

```bash
uname -a
rustup show
rustc --version
cargo --version
solana --version
solana config get
anchor --version
```
