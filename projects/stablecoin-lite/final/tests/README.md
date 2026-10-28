# Integration test matrix

`stablecoin-lite.ts` hiện thực transaction cases trên local validator: initialize tạo mint mới với Config PDA làm authority, từ chối mint có sẵn (front-run), wrong admin, pause rollback, allowance/cap exact boundary, wrong mint và holder burn. `logic.rs` giữ fast unit tests cho accounting trước CPI.
