# Simple AMM — Code-along từng bước

Bài này viết lại [Simple AMM](../../projects/simple-amm/README.md) từ một project trống, theo đúng thứ tự video Module 11. Mỗi bước gõ một đoạn ngắn rồi build hoặc test ngay. Bước cuối ra đúng code `final`; `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần làm xong Module 7 (SPL Token, ATA) và Module 6 (PDA, `anchor test`) trước. Toolchain theo [docs/setup.md](../../docs/setup.md): Rust 1.89.0, Anchor 1.2.1, Solana CLI 4.1.2, Surfpool, Node 24, pnpm.

Dòng `todo!("…")` trong các bước là chỗ giữ tạm: code vẫn build được, bước sau thay nó bằng code thật. Bước 1–2 chỉ cần `cargo check`/`cargo test` (nhanh); từ bước 3 mới cần `anchor build`/`anchor test`. `cargo check` chạy trên máy (không phải SBF) nên còn in vài cảnh báo `unexpected cfg condition value` từ macro của Anchor; các cảnh báo đó bỏ qua được, kết quả mỗi bước chỉ ghi cảnh báo từ code của bạn.

<a id="amm-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học, cạnh `voting` của Module 6. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init simple-amm --template single --package-manager pnpm --test-template mocha --no-install
cd simple-amm
```

Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/simple-amm`, nơi có `Anchor.toml`.

Khóa phiên bản như Module 6:

- `rust-toolchain.toml` do `anchor init` tạo phải có `channel = "1.89.0"`.
- Tạo `.nvmrc` chứa `24`.
- Trong `Anchor.toml`, bổ sung vào section `[toolchain]` đã có:

  ```toml
  [toolchain]
  anchor_version = "1.2.1"
  solana_version = "4.1.2"
  package_manager = "pnpm"
  ```

- Trong `[provider]` của `Anchor.toml`, giữ `cluster = "localnet"` và đặt `wallet = "~/.config/solana/bootcamp-devnet.json"`.

Program cần thêm `anchor-spl` để gọi SPL Token Program. **Trong `programs/simple-amm/Cargo.toml`**, sửa hai chỗ:

```toml
[features]
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-lang = "1.2.1"
anchor-spl = "1.2.1"
```

Giữ nguyên các dòng khác trong `[features]` (`default`, `cpi`, `no-entrypoint`…). Thiếu `anchor-spl/idl-build` thì `anchor build` không sinh được IDL cho các kiểu `Mint`, `TokenAccount`.

Test cần thư viện SPL Token và `bn.js`:

```bash
pnpm install
pnpm add @solana/spl-token@0.4.15 @solana/web3.js@1.98.4 bn.js@5.2.2
pnpm add -D @types/bn.js@^5.2.0
anchor keys sync
anchor build
```

Trong `package.json`, `@anchor-lang/core` phải là `"1.2.1"`. `anchor keys sync` ghi Program ID của máy bạn vào `declare_id!` và `Anchor.toml`. Build xong không lỗi là được; program mẫu sẽ được thay ở bước 1.


<a id="amm-1"></a>
## Bước 1 — Tạo project và math cho lần nạp đầu

**Khái niệm:** [11.2 Pool state](./lessons.md#112-pool-state) · [11.4 LP token](./lessons.md#114-lp-token) · [Math và rounding](./lessons.md#math-và-rounding)

### 1a. Khung program

**Thay toàn bộ `programs/simple-amm/src/lib.rs`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod simple_amm {
    use super::*;
}
```

Chạy `cargo check`: build được, cảnh báo `unused import: super::*`.

Dòng `declare_id!` giữ nguyên địa chỉ mà `anchor keys sync` đã ghi trong file của bạn, không chép địa chỉ mẫu.

### 1b. Danh sách lỗi

**Thêm vào cuối `programs/simple-amm/src/lib.rs`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: append -->
```rust

#[error_code]
pub enum AmmError {
    #[msg("Amount hoặc reserves không hợp lệ")]
    InvalidAmount,
    #[msg("Fee phải là một trong các fee tier cho phép (5, 30, 100 bps)")]
    InvalidFee,
    #[msg("Mint pair phải canonical")]
    NonCanonicalMints,
    #[msg("Minimum output/LP không đạt")]
    SlippageExceeded,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Thanh khoản ban đầu phải lớn hơn MINIMUM_LIQUIDITY shares")]
    InsufficientInitialLiquidity,
}
```

Chạy `cargo check`: build được, vẫn cảnh báo `unused import`.

### 1c. File `math.rs` và fee tier

Code 1 — **Thay toàn bộ `programs/simple-amm/src/math.rs`** (file `math.rs` chưa có thì tạo mới cạnh `lib.rs`):

<!-- file: programs/simple-amm/src/math.rs; mode: replace -->
```rust
use crate::AmmError;
use anchor_lang::prelude::*;

/// LP shares bị khóa vĩnh viễn ở lần nạp đầu tiên (giống `MINIMUM_LIQUIDITY` của Uniswap V2).
/// Không ai sở hữu phần này, nên kẻ tấn công không thể đẩy giá 1 share lên cực cao
/// (first-depositor / inflation attack) rồi làm người nạp sau bị làm tròn về 0 share.
pub const MINIMUM_LIQUIDITY: u64 = 1_000;

/// Các mức phí được phép. Fee nằm trong seeds của Pool, nên mỗi cặp mint có tối đa
/// một pool cho mỗi mức phí: không ai chiếm được cặp mint bằng cách tạo pool phí 99%.
pub const FEE_TIERS_BPS: [u16; 3] = [5, 30, 100];

pub fn is_allowed_fee(fee_bps: u16) -> bool {
    FEE_TIERS_BPS.contains(&fee_bps)
}
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dòng** `use anchor_lang::prelude::*;`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
pub mod math;
```

Chạy `cargo check`: build được, thêm cảnh báo `unused import: crate::AmmError`.

Fee nằm trong seeds của Pool và chỉ nhận 5/30/100 bps, nên không ai chiếm một cặp mint bằng pool phí 99%.

### 1d. Căn bậc hai số nguyên

**Thêm vào cuối `programs/simple-amm/src/math.rs`:**

<!-- file: programs/simple-amm/src/math.rs; mode: append -->
```rust

pub fn integer_sqrt(value: u128) -> u128 {
    if value < 2 {
        return value;
    }
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}
```

Chạy `cargo check`: build được.

### 1e. Unit test đầu tiên

**Thêm vào cuối `programs/simple-amm/src/math.rs`:**

<!-- file: programs/simple-amm/src/math.rs; mode: append -->
```rust

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sqrt_floor() {
        assert_eq!(integer_sqrt(10), 3);
        assert_eq!(integer_sqrt(16), 4)
    }
    #[test]
    fn fee_tiers() {
        assert!(is_allowed_fee(30));
        assert!(!is_allowed_fee(0));
        assert!(!is_allowed_fee(9_999));
    }
}
```

Chạy `cargo test`: `test result: ok. 2 passed`.

### 1f. LP shares lần nạp đầu

**Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[cfg(test)]`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
/// Tổng LP shares của lần nạp đầu tiên, gồm cả phần `MINIMUM_LIQUIDITY` sẽ bị khóa.
pub fn initial_lp(amount_a: u64, amount_b: u64) -> Result<u64> {
    require!(amount_a > 0 && amount_b > 0, AmmError::InvalidAmount);
    let shares = u64::try_from(integer_sqrt((amount_a as u128) * (amount_b as u128)))
        .map_err(|_| error!(AmmError::Overflow))?;
    require!(
        shares > MINIMUM_LIQUIDITY,
        AmmError::InsufficientInitialLiquidity
    );
    Ok(shares)
}
```

Chạy `cargo check`: build được, hết cảnh báo `AmmError` chưa dùng.

`sqrt(a * b)` cho số share ban đầu; `MINIMUM_LIQUIDITY` shares sẽ bị khóa vĩnh viễn để chặn first-depositor attack.

### 1g. Test lần nạp đầu

**Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[test]` **của** `fn fee_tiers`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
    #[test]
    fn initial_shares() {
        assert_eq!(initial_lp(1_000_000, 4_000_000).unwrap(), 2_000_000)
    }
    #[test]
    fn initial_shares_must_exceed_locked_minimum() {
        // sqrt(1_000 * 1_000) = 1_000, không lớn hơn MINIMUM_LIQUIDITY.
        assert!(initial_lp(1_000, 1_000).is_err());
        assert!(initial_lp(1, 1).is_err());
    }
```

Chạy `cargo test`: `test result: ok. 4 passed`.


<a id="amm-2"></a>
## Bước 2 — Math cho lần nạp sau và swap

**Khái niệm:** [11.5 Constant product](./lessons.md#115-constant-product) · [11.7 Liquidity](./lessons.md#117-liquidity)

### 2a. `subsequent_lp`: chia theo token A

**Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[cfg(test)]`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
/// Số share tối đa nhận được với `max_a`/`max_b`, làm tròn xuống (có lợi cho pool).
pub fn subsequent_lp(
    max_a: u64,
    max_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    supply: u64,
) -> Result<u64> {
    require!(
        max_a > 0 && max_b > 0 && reserve_a > 0 && reserve_b > 0 && supply > 0,
        AmmError::InvalidAmount
    );
    todo!("chia theo token B")
}
```

Chạy `cargo check`: build được.

### 2b. `subsequent_lp`: lấy phía ít hơn

Code 1 — **Trong `programs/simple-amm/src/math.rs`, thay dòng** `todo!("chia theo token B")` **bằng:**

<!-- file: programs/simple-amm/src/math.rs; mode: replace -->
```rust
    let from_a = (max_a as u128)
        .checked_mul(supply as u128)
        .ok_or(AmmError::Overflow)?
        / (reserve_a as u128);
    let from_b = (max_b as u128)
        .checked_mul(supply as u128)
        .ok_or(AmmError::Overflow)?
        / (reserve_b as u128);
    u64::try_from(from_a.min(from_b)).map_err(|_| error!(AmmError::Overflow))
```

Code 2 — **Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[test]` **của** `fn fee_tiers`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
    #[test]
    fn proportional_shares() {
        assert_eq!(subsequent_lp(100, 200, 1_000, 2_000, 500).unwrap(), 50)
    }
```

Chạy `cargo test`: `test result: ok. 5 passed`.

Share tính theo token "thiếu" hơn và làm tròn xuống: user không nhận nhiều share hơn phần mình góp.

### 2c. `deposit_amounts`: closure làm tròn lên

**Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[cfg(test)]`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
/// Lượng token A/B thật sự phải nạp để nhận `shares`, làm tròn LÊN (có lợi cho pool).
/// Nhờ đó program chỉ lấy đúng phần tỷ lệ, phần dư của token còn lại ở lại ví user.
pub fn deposit_amounts(
    shares: u64,
    reserve_a: u64,
    reserve_b: u64,
    supply: u64,
) -> Result<(u64, u64)> {
    require!(supply > 0, AmmError::InvalidAmount);
    todo!("tính cho hai reserve")
}
```

Chạy `cargo check`: build được, cảnh báo biến chưa dùng.

### 2d. `deposit_amounts`: áp cho hai reserve

**Trong `programs/simple-amm/src/math.rs`, thay dòng** `todo!("tính cho hai reserve")` **bằng:**

<!-- file: programs/simple-amm/src/math.rs; mode: replace -->
```rust
    let ceil_div = |reserve: u64| -> Result<u64> {
        let numerator = (shares as u128)
            .checked_mul(reserve as u128)
            .ok_or(AmmError::Overflow)?;
        let amount = numerator.div_ceil(supply as u128);
        u64::try_from(amount).map_err(|_| error!(AmmError::Overflow))
    };
    Ok((ceil_div(reserve_a)?, ceil_div(reserve_b)?))
```

Chạy `cargo check`: build được.

### 2e. Test nạp đúng tỷ lệ

**Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[test]` **của** `fn fee_tiers`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
    #[test]
    fn deposit_only_takes_proportional_amounts() {
        // User đưa tối đa 100 A và 1_000 B nhưng tỷ lệ pool là 1:2.
        let shares = subsequent_lp(100, 1_000, 1_000, 2_000, 500).unwrap();
        assert_eq!(shares, 50);
        assert_eq!(
            deposit_amounts(shares, 1_000, 2_000, 500).unwrap(),
            (100, 200)
        );
    }
    #[test]
    fn deposit_rounds_up_in_favor_of_pool() {
        // 1 share * 3 / 2 = 1.5 -> phải nạp 2.
        assert_eq!(deposit_amounts(1, 3, 3, 2).unwrap(), (2, 2));
    }
```

Chạy `cargo test`: `test result: ok. 7 passed`.

### 2f. `swap_output`: trừ fee

**Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng** `#[cfg(test)]`:

<!-- file: programs/simple-amm/src/math.rs; mode: insert_before -->
```rust
pub fn swap_output(amount_in: u64, reserve_in: u64, reserve_out: u64, fee_bps: u16) -> Result<u64> {
    require!(
        amount_in > 0 && reserve_in > 0 && reserve_out > 0,
        AmmError::InvalidAmount
    );
    require!(fee_bps < 10_000, AmmError::InvalidFee);
    let effective = (amount_in as u128)
        .checked_mul((10_000 - fee_bps) as u128)
        .ok_or(AmmError::Overflow)?
        / 10_000;
    todo!("tính output")
}
```

Chạy `cargo check`: build được, cảnh báo `unused variable: effective`.

### 2g. `swap_output`: công thức `x * y = k`

Code 1 — **Trong `programs/simple-amm/src/math.rs`, thay dòng** `todo!("tính output")` **bằng:**

<!-- file: programs/simple-amm/src/math.rs; mode: replace -->
```rust
    let numerator = (reserve_out as u128)
        .checked_mul(effective)
        .ok_or(AmmError::Overflow)?;
    let denominator = (reserve_in as u128)
        .checked_add(effective)
        .ok_or(AmmError::Overflow)?;
    u64::try_from(numerator / denominator).map_err(|_| error!(AmmError::Overflow))
```

Code 2 — **Trong `programs/simple-amm/src/math.rs`, chèn ngay trên dòng `}` cuối file (đóng `mod tests`):**

<!-- file: programs/simple-amm/src/math.rs; mode: end-of-block -->
```rust
    #[test]
    fn constant_product_quote() {
        let out = swap_output(100, 1_000, 1_000, 30).unwrap();
        assert_eq!(out, 90);
        assert!((1_100u128) * (910u128) >= 1_000_000)
    }
    #[test]
    fn slippage_inputs_rejected() {
        assert!(swap_output(0, 1_000, 1_000, 30).is_err());
        assert!(swap_output(1, 1, 1, 10_000).is_err())
    }
```

Chạy `cargo test`: `test result: ok. 9 passed`.

`out = reserve_out * in_sau_fee / (reserve_in + in_sau_fee)`, làm tròn xuống nên `k` sau swap không nhỏ hơn trước.


<a id="amm-3"></a>
## Bước 3 — Pool và `initialize_pool`

**Khái niệm:** [11.2 Pool state](./lessons.md#112-pool-state) · [11.3 Vaults](./lessons.md#113-vaults) · [Pool contract](./lessons.md#pool-contract)

### 3a. Account `Pool`

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay trên dòng** `#[error_code]`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_before -->
```rust
#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}
```

Chạy `cargo check`: build được.

### 3b. `InitializePool`: payer, hai mint, Pool

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dòng** `use anchor_lang::prelude::*;`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, chèn ngay trên `#[account]` của `Pool`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_before -->
```rust
#[derive(Accounts)]
#[instruction(fee_bps: u16)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(init,payer=payer,space=8+Pool::INIT_SPACE,seeds=[b"pool",mint_a.key().as_ref(),mint_b.key().as_ref(),fee_bps.to_le_bytes().as_ref()],bump)]
    pub pool: Account<'info, Pool>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

Chạy `cargo check`: build được, cảnh báo `unused import: TokenAccount`.

### 3c. `InitializePool`: LP mint, hai vault, locked LP

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dòng** `pub pool: Account<'info, Pool>,`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    #[account(init,payer=payer,mint::decimals=6,mint::authority=pool,seeds=[b"lp",pool.key().as_ref()],bump)]
    pub lp_mint: Account<'info, Mint>,
    #[account(init,payer=payer,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(init,payer=payer,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    /// Giữ MINIMUM_LIQUIDITY shares bị khóa. Không instruction nào chuyển token ra khỏi account này.
    #[account(init,payer=payer,token::mint=lp_mint,token::authority=pool,seeds=[b"locked_lp",pool.key().as_ref()],bump)]
    pub locked_lp: Account<'info, TokenAccount>,
```

Chạy `cargo check`: build được.

### 3d. Handler `initialize_pool`

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dòng** `pub mod math;`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
use math::is_allowed_fee;
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dòng** `use super::*;`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    pub fn initialize_pool(ctx: Context<InitializePool>, fee_bps: u16) -> Result<()> {
        require!(
            ctx.accounts.mint_a.key().to_bytes() < ctx.accounts.mint_b.key().to_bytes(),
            AmmError::NonCanonicalMints
        );
        // Chỉ nhận các fee tier cố định; fee là một phần của Pool seeds.
        require!(is_allowed_fee(fee_bps), AmmError::InvalidFee);
        ctx.accounts.pool.set_inner(Pool {
            mint_a: ctx.accounts.mint_a.key(),
            mint_b: ctx.accounts.mint_b.key(),
            fee_bps,
            bump: ctx.bumps.pool,
        });
        Ok(())
    }
```

Chạy `anchor build`: build được, sinh IDL trong `target/idl/simple_amm.json`. ⚠️

Mint A phải nhỏ hơn mint B theo byte, nên cặp (A, B) và (B, A) không thành hai pool.

### 3e. Khung test

**Thay toàn bộ `tests/simple-amm.ts`:**

<!-- file: tests/simple-amm.ts; mode: replace -->
```ts
import * as anchor from "@anchor-lang/core";
import BN from "bn.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("simple-amm", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
});
```

Chạy `anchor test`: `0 passing`. ⚠️

### 3f. Biến dùng chung

**Trong `tests/simple-amm.ts`, chèn ngay dưới dòng** `anchor.setProvider(anchor.AnchorProvider.env());`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program: any = anchor.workspace.SimpleAmm;
  const payer = (provider.wallet as anchor.Wallet).payer;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let providerA: PublicKey;
  let providerB: PublicKey;
  let providerLp: PublicKey;
  let pool: PublicKey;
  let lpMint: PublicKey;
  let vaultA: PublicKey;
  let vaultB: PublicKey;
  let lockedLp: PublicKey;
  const FEE_BPS = 30;
  const MINIMUM_LIQUIDITY = 1_000n;
```

Chạy `anchor test`: `0 passing`. ⚠️

### 3g. `feeSeed` và `expectFailure`

**Trong `tests/simple-amm.ts`, chèn ngay dưới dòng** `const MINIMUM_LIQUIDITY = 1_000n;`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
  const feeSeed = (fee: number) => {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(fee);
    return buf;
  };

  const expectFailure = async (promise: Promise<unknown>, message: RegExp) => {
    try {
      await promise;
      expect.fail("Transaction đáng lẽ phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(message);
    }
  };
```

Chạy `anchor test`: `0 passing`. ⚠️

### 3h. `before`: hai mint và các PDA

**Trong `tests/simple-amm.ts`, chèn ngay dưới dấu `};` đóng `expectFailure`:**

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts

  before(async () => {
    const first = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    const second = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    [mintA, mintB] = Buffer.compare(first.toBuffer(), second.toBuffer()) < 0 ? [first, second] : [second, first];
    [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer(), feeSeed(FEE_BPS)],
      program.programId,
    );
    [lpMint] = PublicKey.findProgramAddressSync([Buffer.from("lp"), pool.toBuffer()], program.programId);
  });
```

Chạy `anchor test`: `0 passing` (chưa có test nên `before` chưa chạy). ⚠️

### 3i. `before`: vault và token của user

**Trong `tests/simple-amm.ts`, chèn ngay dưới dòng** `[lpMint] = PublicKey.findProgramAddressSync([Buffer.from("lp"), pool.toBuffer()], program.programId);`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    [lockedLp] = PublicKey.findProgramAddressSync([Buffer.from("locked_lp"), pool.toBuffer()], program.programId);
    vaultA = getAssociatedTokenAddressSync(mintA, pool, true);
    vaultB = getAssociatedTokenAddressSync(mintB, pool, true);
    providerA = await createAssociatedTokenAccount(provider.connection, payer, mintA, payer.publicKey);
    providerB = await createAssociatedTokenAccount(provider.connection, payer, mintB, payer.publicKey);
    providerLp = getAssociatedTokenAddressSync(lpMint, payer.publicKey);
    await mintTo(provider.connection, payer, mintA, providerA, payer, 10_000_000n);
    await mintTo(provider.connection, payer, mintB, providerB, payer, 20_000_000n);
```

Chạy `anchor test`: `0 passing`. ⚠️

### 3j. Test khởi tạo pool

**Trong `tests/simple-amm.ts`, chèn ngay dưới dấu `});` đóng `before`:**

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts

  it("khởi tạo canonical pool, vaults và LP mint", async () => {
    await program.methods
      .initializePool(FEE_BPS)
      .accounts({
        payer: payer.publicKey,
        mintA,
        mintB,
        pool,
        lpMint,
        vaultA,
        vaultB,
        lockedLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });
```

Chạy `anchor test`: `1 passing`. ⚠️

### 3k. Kiểm tra state Pool

**Trong `tests/simple-amm.ts`, trong test "khởi tạo canonical pool…", chèn ngay dưới dòng** `.rpc();`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    const state = await program.account.pool.fetch(pool);
    expect(state.mintA.equals(mintA)).to.equal(true);
    expect(state.feeBps).to.equal(FEE_BPS);
```

Chạy `anchor test`: `1 passing`. ⚠️

### 3l. Test fee sai: tính địa chỉ

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng** `it("khởi tạo canonical pool, vaults và LP mint", async () => {`:

<!-- file: tests/simple-amm.ts; mode: insert_before -->
```ts
  it("từ chối fee ngoài các fee tier cho phép", async () => {
    const badFee = 9_999;
    const [badPool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer(), feeSeed(badFee)],
      program.programId,
    );
    const [badLp] = PublicKey.findProgramAddressSync([Buffer.from("lp"), badPool.toBuffer()], program.programId);
    const [badLocked] = PublicKey.findProgramAddressSync(
      [Buffer.from("locked_lp"), badPool.toBuffer()],
      program.programId,
    );
  });
```

Chạy `anchor test`: `2 passing`. ⚠️

### 3m. Test fee sai: gửi transaction

**Trong `tests/simple-amm.ts`, trong test "từ chối fee…", chèn ngay dưới dòng** `);` **đóng `badLocked`:**

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    await expectFailure(
      program.methods
        .initializePool(badFee)
        .accounts({
          payer: payer.publicKey,
          mintA,
          mintB,
          pool: badPool,
          lpMint: badLp,
          vaultA: getAssociatedTokenAddressSync(mintA, badPool, true),
          vaultB: getAssociatedTokenAddressSync(mintB, badPool, true),
          lockedLp: badLocked,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
      /InvalidFee|fee tier/i,
    );
```

Chạy `anchor test`: `2 passing`. ⚠️


<a id="amm-4"></a>
## Bước 4 — `add_liquidity`

**Khái niệm:** [11.4 LP token](./lessons.md#114-lp-token) · [11.7 Liquidity](./lessons.md#117-liquidity)

### 4a. `transfer_from_user`: chữ ký hàm

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `token::{Mint, Token, TokenAccount},` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    token::{self, Mint, Token, TokenAccount, TransferChecked},
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, chèn ngay trên `#[derive(Accounts)]` của `InitializePool`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_before -->
```rust
fn transfer_from_user<'info>(
    token_program: &Program<'info, Token>,
    from: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
    to: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    amount: u64,
) -> Result<()> {
    todo!("chuyển token từ ví user")
}
```

Chạy `cargo check`: build được, cảnh báo hàm và biến chưa dùng.

### 4b. `transfer_from_user`: CPI `transfer_checked`

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("chuyển token từ ví user")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    token::transfer_checked(
        CpiContext::new(
            token_program.key(),
            TransferChecked {
                from: from.to_account_info(),
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        amount,
        mint.decimals,
    )
```

Chạy `cargo check`: build được, còn cảnh báo `transfer_from_user` chưa dùng.

### 4c. `mint_lp`: chữ ký hàm

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dấu `}` đóng hàm `transfer_from_user`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust

fn mint_lp<'info>(
    token_program: &Program<'info, Token>,
    pool: &Account<'info, Pool>,
    lp_mint: &Account<'info, Mint>,
    to: &Account<'info, TokenAccount>,
    amount: u64,
) -> Result<()> {
    todo!("mint LP")
}
```

Chạy `cargo check`: build được.

### 4d. `mint_lp`: seeds của Pool PDA

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("mint LP")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    let fee = pool.fee_bps.to_le_bytes();
    let seeds: &[&[&[u8]]] = &[&[
        b"pool",
        pool.mint_a.as_ref(),
        pool.mint_b.as_ref(),
        fee.as_ref(),
        &[pool.bump],
    ]];
    todo!("mint LP")
```

Chạy `cargo check`: build được.

### 4e. `mint_lp`: CPI `mint_to` có chữ ký PDA

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `token::{self, Mint, Token, TokenAccount, TransferChecked},` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    token::{self, Mint, MintTo, Token, TokenAccount, TransferChecked},
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("mint LP")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    token::mint_to(
        CpiContext::new_with_signer(
            token_program.key(),
            MintTo {
                mint: lp_mint.to_account_info(),
                to: to.to_account_info(),
                authority: pool.to_account_info(),
            },
            seeds,
        ),
        amount,
    )
```

Chạy `cargo check`: build được, còn cảnh báo `mint_lp` chưa dùng.

### 4f. `AddLiquidity`: pool, mint, vault

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay trên `#[account]` của `Pool`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_before -->
```rust
#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    pub provider: Signer<'info>,
    #[account(seeds=[b"pool",pool.mint_a.as_ref(),pool.mint_b.as_ref(),pool.fee_bps.to_le_bytes().as_ref()],bump=pool.bump,has_one=mint_a,has_one=mint_b)]
    pub pool: Account<'info, Pool>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(mut,seeds=[b"lp",pool.key().as_ref()],bump)]
    pub lp_mint: Account<'info, Mint>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
```

Chạy `cargo check`: build được.

### 4g. `AddLiquidity`: account của provider

**Trong `programs/simple-amm/src/lib.rs`, trong struct `AddLiquidity`, chèn ngay dưới dòng** `pub vault_b: Account<'info, TokenAccount>,`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    #[account(mut,token::mint=mint_a,token::authority=provider)]
    pub provider_a: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_b,token::authority=provider)]
    pub provider_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=lp_mint,token::authority=provider)]
    pub provider_lp: Account<'info, TokenAccount>,
    #[account(mut,seeds=[b"locked_lp",pool.key().as_ref()],bump)]
    pub locked_lp: Account<'info, TokenAccount>,
```

Chạy `cargo check`: build được.

### 4h. Handler `add_liquidity`: chữ ký

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dấu `}` đóng hàm `initialize_pool`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    /// `max_amount_a`/`max_amount_b` là trần user chấp nhận nạp. Program chỉ lấy đúng
    /// phần tỷ lệ với reserves; phần dư của token còn lại không bị chuyển vào pool.
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        max_amount_a: u64,
        max_amount_b: u64,
        minimum_lp: u64,
    ) -> Result<()> {
        let supply = ctx.accounts.lp_mint.supply;
        todo!("tính shares")
    }
```

Chạy `cargo check`: build được, cảnh báo biến chưa dùng.

### 4i. Lần nạp đầu

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `use math::is_allowed_fee;` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
use math::{initial_lp, is_allowed_fee, MINIMUM_LIQUIDITY};
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("tính shares")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        // (amount_a, amount_b) chuyển vào vault; user_shares mint cho user; locked mint vào locked_lp.
        let (amount_a, amount_b, user_shares, locked) = if supply == 0 {
            // Lần đầu: user đặt tỷ lệ giá, MINIMUM_LIQUIDITY shares bị khóa vĩnh viễn.
            let total = initial_lp(max_amount_a, max_amount_b)?;
            (
                max_amount_a,
                max_amount_b,
                total - MINIMUM_LIQUIDITY,
                MINIMUM_LIQUIDITY,
            )
        } else {
            todo!("lần nạp sau")
        };
        todo!("chuyển token và mint LP")
```

Chạy `cargo check`: build được.

### 4j. Lần nạp sau: số share

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `use math::{initial_lp, is_allowed_fee, MINIMUM_LIQUIDITY};` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
use math::{initial_lp, is_allowed_fee, subsequent_lp, MINIMUM_LIQUIDITY};
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("lần nạp sau")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
            let shares = subsequent_lp(
                max_amount_a,
                max_amount_b,
                ctx.accounts.vault_a.amount,
                ctx.accounts.vault_b.amount,
                supply,
            )?;
            todo!("lượng token cần nạp")
```

Chạy `cargo check`: build được.

### 4k. Lần nạp sau: lượng token cần nạp

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `use math::{initial_lp, is_allowed_fee, subsequent_lp, MINIMUM_LIQUIDITY};` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
use math::{deposit_amounts, initial_lp, is_allowed_fee, subsequent_lp, MINIMUM_LIQUIDITY};
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("lượng token cần nạp")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
            let (a, b) = deposit_amounts(
                shares,
                ctx.accounts.vault_a.amount,
                ctx.accounts.vault_b.amount,
                supply,
            )?;
            (a, b, shares, 0)
```

Chạy `cargo check`: build được.

### 4l. Slippage guard của LP

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("chuyển token và mint LP")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        require!(
            user_shares > 0 && user_shares >= minimum_lp,
            AmmError::SlippageExceeded
        );
        require!(
            amount_a <= max_amount_a && amount_b <= max_amount_b,
            AmmError::SlippageExceeded
        );
        todo!("chuyển token và mint LP")
```

Chạy `cargo check`: build được, cảnh báo `unused variable: locked`.

### 4m. Chuyển token vào vault

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("chuyển token và mint LP")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        transfer_from_user(
            &ctx.accounts.token_program,
            &ctx.accounts.provider_a,
            &ctx.accounts.mint_a,
            &ctx.accounts.vault_a,
            &ctx.accounts.provider,
            amount_a,
        )?;
        transfer_from_user(
            &ctx.accounts.token_program,
            &ctx.accounts.provider_b,
            &ctx.accounts.mint_b,
            &ctx.accounts.vault_b,
            &ctx.accounts.provider,
            amount_b,
        )?;
        todo!("mint LP")
```

Chạy `cargo check`: build được.

### 4n. Mint LP và khóa `MINIMUM_LIQUIDITY`

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("mint LP")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        if locked > 0 {
            mint_lp(
                &ctx.accounts.token_program,
                &ctx.accounts.pool,
                &ctx.accounts.lp_mint,
                &ctx.accounts.locked_lp,
                locked,
            )?;
        }
        mint_lp(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            &ctx.accounts.lp_mint,
            &ctx.accounts.provider_lp,
            user_shares,
        )
```

Chạy `cargo check`: build sạch, không cảnh báo của program.

### 4o. Test lần nạp đầu: LP token account

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng `});` cuối file (đóng `describe`):**

<!-- file: tests/simple-amm.ts; mode: end-of-block -->
```ts

  it("thêm thanh khoản ban đầu, khóa MINIMUM_LIQUIDITY shares", async () => {
    await createAssociatedTokenAccount(provider.connection, payer, lpMint, payer.publicKey);
  });
```

Chạy `anchor test`: `3 passing`. ⚠️

### 4p. Test lần nạp đầu: gọi `addLiquidity`

**Trong `tests/simple-amm.ts`, trong test "thêm thanh khoản ban đầu…", chèn ngay dưới dòng** `await createAssociatedTokenAccount(...)`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    await program.methods
      .addLiquidity(new BN(1_000_000), new BN(4_000_000), new BN(1_999_000))
      .accounts({
        provider: payer.publicKey,
        pool,
        mintA,
        mintB,
        lpMint,
        vaultA,
        vaultB,
        providerA,
        providerB,
        providerLp,
        lockedLp,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
```

Chạy `anchor test`: `3 passing`. ⚠️

### 4q. Test lần nạp đầu: kiểm tra số dư

**Trong `tests/simple-amm.ts`, trong test "thêm thanh khoản ban đầu…", chèn ngay dưới dòng** `.rpc();`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    expect((await getAccount(provider.connection, vaultA)).amount).to.equal(1_000_000n);
    expect((await getAccount(provider.connection, vaultB)).amount).to.equal(4_000_000n);
    // sqrt(1e6 * 4e6) = 2e6 shares, trong đó 1_000 bị khóa vĩnh viễn.
    expect((await getAccount(provider.connection, providerLp)).amount).to.equal(2_000_000n - MINIMUM_LIQUIDITY);
    expect((await getAccount(provider.connection, lockedLp)).amount).to.equal(MINIMUM_LIQUIDITY);
```

Chạy `anchor test`: `3 passing`. ⚠️

### 4r. Test lần nạp sau: số dư trước

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng `});` cuối file (đóng `describe`):**

<!-- file: tests/simple-amm.ts; mode: end-of-block -->
```ts

  it("lần nạp sau chỉ lấy phần đúng tỷ lệ, không lấy phần dư", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
    // Tỷ lệ pool là 1 A : 4 B. User đưa trần 100_000 A và 1_000_000 B (dư B).
  });
```

Chạy `anchor test`: `4 passing`. ⚠️

### 4s. Test lần nạp sau: gọi `addLiquidity`

**Trong `tests/simple-amm.ts`, trong test "lần nạp sau…", chèn ngay dưới dòng chú thích** `// Tỷ lệ pool là 1 A : 4 B…`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    await program.methods
      .addLiquidity(new BN(100_000), new BN(1_000_000), new BN(1))
      .accounts({
        provider: payer.publicKey,
        pool,
        mintA,
        mintB,
        lpMint,
        vaultA,
        vaultB,
        providerA,
        providerB,
        providerLp,
        lockedLp,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
```

Chạy `anchor test`: `4 passing`. ⚠️

### 4t. Test lần nạp sau: chỉ lấy đúng tỷ lệ

**Trong `tests/simple-amm.ts`, trong test "lần nạp sau…", chèn ngay dưới dòng** `.rpc();`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    expect(beforeA - (await getAccount(provider.connection, providerA)).amount).to.equal(100_000n);
    expect(beforeB - (await getAccount(provider.connection, providerB)).amount).to.equal(400_000n);
```

Chạy `anchor test`: `4 passing`. ⚠️


<a id="amm-5"></a>
## Bước 5 — `remove_liquidity`

**Khái niệm:** [11.7 Liquidity](./lessons.md#117-liquidity)

### 5a. `transfer_from_pool`: chữ ký hàm

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dấu `}` đóng hàm `transfer_from_user` (không để dòng trống):**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
fn transfer_from_pool<'info>(
    token_program: &Program<'info, Token>,
    pool: &Account<'info, Pool>,
    from: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
    to: &Account<'info, TokenAccount>,
    amount: u64,
) -> Result<()> {
    todo!("trả token từ vault")
}
```

Chạy `cargo check`: build được, cảnh báo hàm chưa dùng.

### 5b. `transfer_from_pool`: seeds

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("trả token từ vault")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    let fee = pool.fee_bps.to_le_bytes();
    let seeds: &[&[&[u8]]] = &[&[
        b"pool",
        pool.mint_a.as_ref(),
        pool.mint_b.as_ref(),
        fee.as_ref(),
        &[pool.bump],
    ]];
    todo!("trả token từ vault")
```

Chạy `cargo check`: build được.

### 5c. `transfer_from_pool`: CPI có chữ ký PDA

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("trả token từ vault")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    token::transfer_checked(
        CpiContext::new_with_signer(
            token_program.key(),
            TransferChecked {
                from: from.to_account_info(),
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: pool.to_account_info(),
            },
            seeds,
        ),
        amount,
        mint.decimals,
    )
```

Chạy `cargo check`: build được.

### 5d. `RemoveLiquidity`: pool, mint, vault

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay trên `#[account]` của `Pool`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_before -->
```rust
#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    pub provider: Signer<'info>,
    #[account(seeds=[b"pool",pool.mint_a.as_ref(),pool.mint_b.as_ref(),pool.fee_bps.to_le_bytes().as_ref()],bump=pool.bump,has_one=mint_a,has_one=mint_b)]
    pub pool: Account<'info, Pool>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(mut,seeds=[b"lp",pool.key().as_ref()],bump)]
    pub lp_mint: Account<'info, Mint>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
```

Chạy `cargo check`: build được.

### 5e. `RemoveLiquidity`: account của provider

**Trong `programs/simple-amm/src/lib.rs`, trong struct `RemoveLiquidity`, chèn ngay dưới dòng** `pub vault_b: Account<'info, TokenAccount>,`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    #[account(mut,token::mint=mint_a,token::authority=provider)]
    pub provider_a: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_b,token::authority=provider)]
    pub provider_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=lp_mint,token::authority=provider)]
    pub provider_lp: Account<'info, TokenAccount>,
```

Chạy `cargo check`: build được.

### 5f. Handler `remove_liquidity`: chữ ký

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dấu `}` đóng hàm `add_liquidity`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        minimum_a: u64,
        minimum_b: u64,
    ) -> Result<()> {
        require!(
            lp_amount > 0 && ctx.accounts.lp_mint.supply > 0,
            AmmError::InvalidAmount
        );
        todo!("tính lượng token trả về")
    }
```

Chạy `cargo check`: build được, cảnh báo `minimum_a`, `minimum_b` chưa dùng.

### 5g. Tính phần token theo tỷ lệ

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("tính lượng token trả về")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        let amount_a = u64::try_from(
            (lp_amount as u128) * (ctx.accounts.vault_a.amount as u128)
                / (ctx.accounts.lp_mint.supply as u128),
        )
        .map_err(|_| error!(AmmError::Overflow))?;
        let amount_b = u64::try_from(
            (lp_amount as u128) * (ctx.accounts.vault_b.amount as u128)
                / (ctx.accounts.lp_mint.supply as u128),
        )
        .map_err(|_| error!(AmmError::Overflow))?;
        require!(
            amount_a >= minimum_a && amount_b >= minimum_b,
            AmmError::SlippageExceeded
        );
        todo!("burn LP rồi trả token")
```

Chạy `cargo check`: build được.

### 5h. Burn LP trước

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `token::{self, Mint, MintTo, Token, TokenAccount, TransferChecked},` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, TransferChecked},
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("burn LP rồi trả token")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Burn {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    from: ctx.accounts.provider_lp.to_account_info(),
                    authority: ctx.accounts.provider.to_account_info(),
                },
            ),
            lp_amount,
        )?;
        todo!("trả token cho provider")
```

Chạy `cargo check`: build được.

### 5i. Trả token từ vault

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("trả token cho provider")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        transfer_from_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            &ctx.accounts.vault_a,
            &ctx.accounts.mint_a,
            &ctx.accounts.provider_a,
            amount_a,
        )?;
        transfer_from_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            &ctx.accounts.vault_b,
            &ctx.accounts.mint_b,
            &ctx.accounts.provider_b,
            amount_b,
        )
```

Chạy `cargo check`: build sạch.

### 5j. Test rút: số dư trước

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng `});` cuối file (đóng `describe`):**

<!-- file: tests/simple-amm.ts; mode: end-of-block -->
```ts

  it("burn LP và rút thanh khoản theo tỷ lệ", async () => {
    const lpBefore = (await getAccount(provider.connection, providerLp)).amount;
    const aBefore = (await getAccount(provider.connection, providerA)).amount;
    const bBefore = (await getAccount(provider.connection, providerB)).amount;
  });
```

Chạy `anchor test`: `5 passing`. ⚠️

### 5k. Test rút: gọi `removeLiquidity`

**Trong `tests/simple-amm.ts`, trong test "burn LP…", chèn ngay dưới dòng** `const bBefore = ...`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    await program.methods
      .removeLiquidity(new BN(1_000_000), new BN(1), new BN(1))
      .accounts({
        provider: payer.publicKey,
        pool,
        mintA,
        mintB,
        lpMint,
        vaultA,
        vaultB,
        providerA,
        providerB,
        providerLp,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
```

Chạy `anchor test`: `5 passing`. ⚠️

### 5l. Test rút: kiểm tra số dư

**Trong `tests/simple-amm.ts`, trong test "burn LP…", chèn ngay dưới dòng** `.rpc();`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    expect((await getAccount(provider.connection, providerLp)).amount).to.equal(lpBefore - 1_000_000n);
    expect((await getAccount(provider.connection, providerA)).amount > aBefore).to.equal(true);
    expect((await getAccount(provider.connection, providerB)).amount > bBefore).to.equal(true);
```

Chạy `anchor test`: `5 passing`. ⚠️


<a id="amm-6"></a>
## Bước 6 — `swap`

**Khái niệm:** [11.5 Constant product](./lessons.md#115-constant-product) · [11.6 Slippage](./lessons.md#116-slippage) · [11.10 Tests](./lessons.md#1110-tests)

### 6a. `Swap`: pool, mint, vault

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay trên `#[account]` của `Pool`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_before -->
```rust
#[derive(Accounts)]
pub struct Swap<'info> {
    pub trader: Signer<'info>,
    #[account(seeds=[b"pool",pool.mint_a.as_ref(),pool.mint_b.as_ref(),pool.fee_bps.to_le_bytes().as_ref()],bump=pool.bump,has_one=mint_a,has_one=mint_b)]
    pub pool: Account<'info, Pool>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
```

Chạy `cargo check`: build được.

### 6b. `Swap`: token account của trader

**Trong `programs/simple-amm/src/lib.rs`, trong struct `Swap`, chèn ngay dưới dòng** `pub vault_b: Account<'info, TokenAccount>,`:

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    #[account(mut,token::mint=mint_a,token::authority=trader)]
    pub user_a: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_b,token::authority=trader)]
    pub user_b: Account<'info, TokenAccount>,
```

Chạy `cargo check`: build được.

### 6c. Handler `swap`: chữ ký

**Trong `programs/simple-amm/src/lib.rs`, chèn ngay dưới dấu `}` đóng hàm `remove_liquidity`:**

<!-- file: programs/simple-amm/src/lib.rs; mode: insert_after -->
```rust
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_output: u64,
        a_to_b: bool,
    ) -> Result<()> {
        todo!("chọn chiều swap")
    }
```

Chạy `cargo check`: build được, cảnh báo biến chưa dùng.

### 6d. Chọn chiều A → B

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("chọn chiều swap")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        let (input_vault, output_vault, input_mint, output_mint, user_input, user_output) =
            if a_to_b {
                (
                    &ctx.accounts.vault_a,
                    &ctx.accounts.vault_b,
                    &ctx.accounts.mint_a,
                    &ctx.accounts.mint_b,
                    &ctx.accounts.user_a,
                    &ctx.accounts.user_b,
                )
            } else {
                todo!("chiều B sang A")
            };
        todo!("tính output")
```

Chạy `cargo check`: build được.

### 6e. Chiều B → A

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("chiều B sang A")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
                (
                    &ctx.accounts.vault_b,
                    &ctx.accounts.vault_a,
                    &ctx.accounts.mint_b,
                    &ctx.accounts.mint_a,
                    &ctx.accounts.user_b,
                    &ctx.accounts.user_a,
                )
```

Chạy `cargo check`: build được.

### 6f. Tính output và slippage guard

Code 1 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `use math::{deposit_amounts, initial_lp, is_allowed_fee, subsequent_lp, MINIMUM_LIQUIDITY};` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
use math::{
    deposit_amounts, initial_lp, is_allowed_fee, subsequent_lp, swap_output, MINIMUM_LIQUIDITY,
};
```

Code 2 — **Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("tính output")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        let output = swap_output(
            amount_in,
            input_vault.amount,
            output_vault.amount,
            ctx.accounts.pool.fee_bps,
        )?;
        require!(
            output > 0 && output >= minimum_output,
            AmmError::SlippageExceeded
        );
        todo!("chuyển token hai chiều")
```

Chạy `cargo check`: build được.

### 6g. Chuyển token hai chiều

**Trong `programs/simple-amm/src/lib.rs`, thay dòng** `todo!("chuyển token hai chiều")` **bằng:**

<!-- file: programs/simple-amm/src/lib.rs; mode: replace -->
```rust
        transfer_from_user(
            &ctx.accounts.token_program,
            user_input,
            input_mint,
            input_vault,
            &ctx.accounts.trader,
            amount_in,
        )?;
        transfer_from_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            output_vault,
            output_mint,
            user_output,
            output,
        )
```

Chạy `cargo check`: build sạch. `lib.rs` giờ giống hệt `final` (trừ `declare_id!`).

### 6h. Test swap: số dư trước

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng** `it("burn LP và rút thanh khoản theo tỷ lệ", async () => {`:

<!-- file: tests/simple-amm.ts; mode: insert_before -->
```ts
  it("swap giữ constant-product direction và trả output", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
  });
```

Chạy `anchor test`: `6 passing`. ⚠️

### 6i. Test swap: gọi `swap`

**Trong `tests/simple-amm.ts`, trong test "swap giữ…", chèn ngay dưới dòng** `const beforeB = ...`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    await program.methods
      .swap(new BN(100_000), new BN(300_000), true)
      .accounts({
        trader: payer.publicKey,
        pool,
        mintA,
        mintB,
        vaultA,
        vaultB,
        userA: providerA,
        userB: providerB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
```

Chạy `anchor test`: `6 passing`. ⚠️

### 6j. Test swap: kiểm tra số dư

**Trong `tests/simple-amm.ts`, trong test "swap giữ…", chèn ngay dưới dòng** `.rpc();`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    expect((await getAccount(provider.connection, providerA)).amount).to.equal(beforeA - 100_000n);
    expect((await getAccount(provider.connection, providerB)).amount > beforeB + 300_000n).to.equal(true);
```

Chạy `anchor test`: `6 passing`. ⚠️

### 6k. Test slippage: số dư trước

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng** `it("burn LP và rút thanh khoản theo tỷ lệ", async () => {`:

<!-- file: tests/simple-amm.ts; mode: insert_before -->
```ts
  it("slippage failure rollback toàn bộ balance", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
  });
```

Chạy `anchor test`: `7 passing`. ⚠️

### 6l. Test slippage: swap đòi output quá cao

**Trong `tests/simple-amm.ts`, trong test "slippage failure…", chèn ngay dưới dòng** `const beforeB = ...`:

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    await expectFailure(
      program.methods
        .swap(new BN(100_000), new BN(4_000_000), true)
        .accounts({
          trader: payer.publicKey,
          pool,
          mintA,
          mintB,
          vaultA,
          vaultB,
          userA: providerA,
          userB: providerB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
      /SlippageExceeded|Minimum output|6003/i,
    );
```

Chạy `anchor test`: `7 passing`. ⚠️

### 6m. Test slippage: số dư không đổi

**Trong `tests/simple-amm.ts`, trong test "slippage failure…", chèn ngay dưới dòng** `);` **đóng `expectFailure`:**

<!-- file: tests/simple-amm.ts; mode: insert_after -->
```ts
    expect((await getAccount(provider.connection, providerA)).amount).to.equal(beforeA);
    expect((await getAccount(provider.connection, providerB)).amount).to.equal(beforeB);
```

Chạy `anchor test`: `7 passing`. ⚠️

### 6n. Test vault giả

**Trong `tests/simple-amm.ts`, chèn ngay trên dòng** `it("burn LP và rút thanh khoản theo tỷ lệ", async () => {`:

<!-- file: tests/simple-amm.ts; mode: insert_before -->
```ts
  it("từ chối vault không thuộc pool", async () => {
    await expectFailure(
      program.methods
        .swap(new BN(1), new BN(1), true)
        .accounts({
          trader: payer.publicKey,
          pool,
          mintA,
          mintB,
          vaultA: providerA,
          vaultB,
          userA: providerA,
          userB: providerB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
      /vault_a|ConstraintAssociated|ConstraintTokenOwner|associated/i,
    );
  });
```

Chạy `anchor test`: `8 passing`. `tests/simple-amm.ts` giờ giống hệt `final`. ⚠️


## Đối chiếu với `final`

Sau bước 6n, ba file `programs/simple-amm/src/lib.rs`, `programs/simple-amm/src/math.rs` và `tests/simple-amm.ts` giống hệt `projects/simple-amm/final` (trừ địa chỉ trong `declare_id!` và `Anchor.toml`). Kiểm tra lần cuối:

```bash
cargo fmt --all --check
cargo test
anchor test
```

Kết quả: `cargo test` ra `9 passed`, `anchor test` ra `8 passing`.

Bước 3–6 đặt nhiều `todo!` tạm; nếu `anchor test` báo `not yet implemented`, nghĩa là còn một `todo!` chưa được thay ở bước sau.

## Mở rộng không có trong code

Stable swap ([11.8](./lessons.md#118-stable-swap)) và oracle ([11.9](./lessons.md#119-oracle)) chỉ là phần khái niệm của module này, không có bước code.
