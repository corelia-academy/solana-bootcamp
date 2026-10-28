# Integration test matrix

`simple-amm.ts` hiện thực local-validator cases cho fee tier sai, canonical initialization, initial liquidity có khóa `MINIMUM_LIQUIDITY`, subsequent liquidity chỉ lấy phần tỷ lệ, swap, slippage rollback, wrong vault và proportional withdrawal. `math.rs` cung cấp fast deterministic tests cho initial/subsequent LP, `deposit_amounts` làm tròn lên, fee tier, rounding, zero input và constant-product quote.
