# Solana boundary starter

Tạo Anchor workspace gồm hai program:

1. `mock-verifier`: tạo verifier-owned context bind root/nullifier/output/domain và expose
   `assert_context` cho CPI.
2. `privacy-app`: khóa verifier program ID, CPI sang `assert_context`, tạo nullifier PDA và chỉ
   cập nhật output state sau khi CPI thành công.

Không thêm boolean `verified` do client kiểm soát. Mock verifier không kiểm tra cryptographic
proof và không được deploy production. Đối chiếu solution sau khi tự viết account constraints,
custom errors và valid/invalid/replay tests.
