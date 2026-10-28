# Starter — Stablecoin Lite

Account schema, PDA seeds và contexts đã có sẵn. Hoàn thiện năm TODO theo thứ tự; TODO 1 phải tạo mint mới với Config PDA làm mint authority ngay trong `initialize_config`, không nhận mint có sẵn.

## Mục tiêu state
Hiểu Config/Allowance schema và mint-authority handoff.
## Phần đã có
Accounts, contexts, PDA seeds và logic-test contract.
## Học viên cần làm
Hoàn thiện initialize rồi role management.
## Chạy và kiểm tra
`cargo fmt --all --check && cargo check && cargo test`
