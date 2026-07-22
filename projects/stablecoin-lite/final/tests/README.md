# Integration test matrix

`stablecoin-lite.ts` hiện thực transaction cases trên local validator: initialize khi Config PDA là mint authority, wrong admin, pause rollback, allowance/cap exact boundary, wrong mint và holder burn. `logic.rs` giữ fast unit tests cho accounting trước CPI.
