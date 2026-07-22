# Integration test matrix

`simple-amm.ts` hiện thực local-validator cases cho canonical initialization, initial liquidity, swap, slippage rollback, wrong vault và proportional withdrawal. `math.rs` cung cấp fast deterministic tests cho initial/subsequent LP, rounding, zero input và constant-product quote.
