# Integration test matrix

`stablecoin-lite.ts` hiện thực transaction cases trên local validator: initialize tạo mint mới với Config PDA làm authority, từ chối mint có sẵn (front-run), wrong admin, pause rollback, allowance/cap exact boundary, wrong mint, thu hồi minter bằng allowance 0, ví chưa được cấp allowance và holder burn (supply giảm, `minted_by_protocol` giữ nguyên). `logic.rs` giữ fast unit tests cho accounting trước CPI.

Code của từng test được gõ lại từng bước trong [code-along Module 10](../../../../curriculum/module-10-stablecoin/code-along.md).
