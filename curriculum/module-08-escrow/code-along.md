# Escrow — Code-along từng bước

Bài này viết lại [Escrow](../../projects/escrow/README.md) từ một project trống, theo đúng thứ tự video Module 8. Mỗi bước gõ một đoạn ngắn rồi build hoặc test ngay. Bước cuối ra đúng `programs/escrow/src/lib.rs` và `tests/escrow.ts` của `final` (trừ địa chỉ trong `declare_id!`); `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần làm xong Module 4 và [Module 7](../module-07-spl-token/README.md) (mint, token account, ATA) trước. Các dòng `<!-- step: … -->` cho biết đoạn code được gõ vào file nào và ở vị trí nào; khi đọc trên GitHub chúng không hiện ra.

<a id="escrow-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học, cạnh `hello-solana` của Module 1. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init escrow --template single --package-manager pnpm --test-template mocha --no-install
cd escrow
```

Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/escrow`, nơi có `Anchor.toml`.

Khóa phiên bản như Module 1 và Module 6:

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
- Trong `package.json`, đặt `@anchor-lang/core` thành `"1.2.1"`.

Escrow gọi Token Program, nên program cần thêm crate `anchor-spl`. Trong `programs/escrow/Cargo.toml`, sửa section `[features]` ở dòng `idl-build` và section `[dependencies]` cho giống:

```toml
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]
```

```toml
[dependencies]
anchor-lang = "=1.2.1"
anchor-spl = "=1.2.1"
```

Test cần thư viện token và web3 của Solana:

```bash
pnpm install
pnpm add @solana/spl-token@0.4.15 @solana/web3.js@1.98.4
anchor keys sync
anchor build
```

`anchor keys sync` ghi Program ID của máy bạn vào `declare_id!` và `Anchor.toml`. Build xong không lỗi là được; program mẫu sẽ được thay ở bước 1.

<a id="escrow-1"></a>
## Bước 1 — State của một offer

**Khái niệm:** [maker/taker flow](./lessons.md#81-makertaker-flow) · [escrow state](./lessons.md#82-escrow-state)

### 1a. Khung program

**Thay toàn bộ `programs/escrow/src/lib.rs`** bằng đoạn dưới. Dòng `declare_id!` giữ nguyên địa chỉ trong file của bạn, không chép địa chỉ mẫu.

<!-- step: {"id": "1a", "file": "programs/escrow/src/lib.rs", "mode": "replace"} -->
```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod escrow {
    use super::*;
}
```

Chạy `anchor build`: build được, có cảnh báo `unused import` cho `use super::*`.

### 1b. Account `Escrow`

**Thêm vào cuối file:**

<!-- step: {"id": "1b", "file": "programs/escrow/src/lib.rs", "mode": "append"} -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub seed: u64,
    pub maker: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub offered_amount: u64,
    pub wanted_amount: u64,
    pub bump: u8,
}
```

`seed` do maker chọn để một ví mở được nhiều offer. `mint_a` là token maker đưa ra, `mint_b` là token maker muốn nhận. Space: 8 discriminator + 8 + 32 × 3 + 8 + 8 + 1 = 129 byte.

### 1c. Lỗi của program

**Thêm vào cuối file:**

<!-- step: {"id": "1c", "file": "programs/escrow/src/lib.rs", "mode": "append"} -->
```rust

#[error_code]
pub enum EscrowError {
    #[msg("Số lượng offer và wanted phải lớn hơn 0")]
    InvalidAmount,
    #[msg("Mint A và mint B phải khác nhau")]
    SameMint,
}
```

Chạy `anchor build`: build được.

<a id="escrow-2"></a>
## Bước 2 — `make`: khóa token A vào vault

**Khái niệm:** [vault PDA](./lessons.md#83-vault-pda) · [CPI Token Program](./lessons.md#84-cpi-token-program) · [make](./lessons.md#85-make)

### 2a. Account của `make`, phần mint

**Thay dòng đầu file** `use anchor_lang::prelude::*;` bằng bốn dòng import:

<!-- step: {"id": "2a", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "line": "use anchor_lang::prelude::*;"} -->
```rust
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
```

**Chèn ngay sau dấu `}` đóng `pub mod escrow`:**

<!-- step: {"id": "2a", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "pub mod escrow {", "line": "}"} -->
```rust

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}
```

Chạy `anchor build`: build được, cảnh báo `unused imports` cho `use super::*`, `TokenAccount` và `AssociatedToken`.

### 2b. Token account của maker, Escrow PDA và vault

**Trong `Make`, chèn ngay sau dòng `pub mint_b: InterfaceAccount<'info, Mint>,`:**

<!-- step: {"id": "2b", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "pub struct Make<'info> {", "line": "    pub mint_b: InterfaceAccount<'info, Mint>,"} -->
```rust
    #[account(mut, token::mint = mint_a, token::authority = maker, token::token_program = token_program)]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    #[account(init, payer = maker, space = 8 + Escrow::INIT_SPACE, seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(init, payer = maker, associated_token::mint = mint_a, associated_token::authority = escrow, associated_token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
```

**Cũng trong `Make`, chèn ngay sau dòng `pub token_program: Interface<'info, TokenInterface>,`:**

<!-- step: {"id": "2b", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "pub struct Make<'info> {", "line": "    pub token_program: Interface<'info, TokenInterface>,"} -->
```rust
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
```

Chạy `anchor build`: build được.

### 2c. Kiểm tra input của `make`

**Trong `pub mod escrow`, chèn ngay dưới dòng `use super::*;`:**

<!-- step: {"id": "2c", "file": "programs/escrow/src/lib.rs", "mode": "after", "line": "    use super::*;"} -->
```rust

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        offered_amount: u64,
        wanted_amount: u64,
    ) -> Result<()> {
        require!(
            offered_amount > 0 && wanted_amount > 0,
            EscrowError::InvalidAmount
        );
        require_keys_neq!(
            ctx.accounts.mint_a.key(),
            ctx.accounts.mint_b.key(),
            EscrowError::SameMint
        );
        todo!("lưu Escrow và chuyển token A vào vault")
    }
```

Chạy `anchor build`: build được, cảnh báo `unused variable: seed`.

### 2d. Ghi state

**Thay dòng `todo!("lưu Escrow và chuyển token A vào vault")`** bằng:

<!-- step: {"id": "2d", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "line": "        todo!(\"lưu Escrow và chuyển token A vào vault\")"} -->
```rust

        let escrow = &mut ctx.accounts.escrow;
        escrow.set_inner(Escrow {
            seed,
            maker: ctx.accounts.maker.key(),
            mint_a: ctx.accounts.mint_a.key(),
            mint_b: ctx.accounts.mint_b.key(),
            offered_amount,
            wanted_amount,
            bump: ctx.bumps.escrow,
        });

        Ok(())
```

Chạy `anchor build`: build được.

### 2e. Chuyển token A vào vault bằng CPI

**Trong import, thay dòng `token_interface::{Mint, TokenAccount, TokenInterface},`** bằng:

<!-- step: {"id": "2e", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "line": "    token_interface::{Mint, TokenAccount, TokenInterface},"} -->
```rust
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
```

**Trong `make`, thay dòng `Ok(())`** bằng:

<!-- step: {"id": "2e", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "in": "    pub fn make(", "line": "        Ok(())"} -->
```rust
        transfer_checked(
            CpiContext::new(ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.maker_ata_a.to_account_info(),
                    mint: ctx.accounts.mint_a.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.maker.to_account_info(),
                },
            ),
            offered_amount,
            ctx.accounts.mint_a.decimals,
        )
```

Chạy `anchor build`: build sạch. `make` giờ giống `checkpoint-1`.

### 2f. Import của test

**Thay toàn bộ `tests/escrow.ts`:**

<!-- step: {"id": "2f", "file": "tests/escrow.ts", "mode": "replace"} -->
```ts
import * as anchor from "@anchor-lang/core";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  transfer,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("escrow", () => {
});
```

Chạy `anchor test`: `0 passing`.

### 2g. Provider, ví maker và taker

**Chèn ngay dưới dòng `describe("escrow", () => {`:**

<!-- step: {"id": "2g", "file": "tests/escrow.ts", "mode": "after", "line": "describe(\"escrow\", () => {"} -->
```ts
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  // IDL được sinh khi `anchor build`; dùng dynamic workspace để test vẫn type-check trước build.
  const program: any = anchor.workspace.Escrow;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const maker = Keypair.generate();
  const taker = Keypair.generate();

  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;
  let makerAtaB: PublicKey;
  let takerAtaA: PublicKey;
  let takerAtaB: PublicKey;
```

Chạy `anchor test`: `0 passing`.

### 2h. Tính địa chỉ Escrow và vault

**Chèn ngay dưới dòng `let takerAtaB: PublicKey;`:**

<!-- step: {"id": "2h", "file": "tests/escrow.ts", "mode": "after", "line": "  let takerAtaB: PublicKey;"} -->
```ts

  const deriveOffer = (seed: anchor.BN) => {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), maker.publicKey.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
      program.programId,
    );
    const vault = getAssociatedTokenAddressSync(mintA, escrow, true);
    return { escrow, vault };
  };
```

### 2i. Chuẩn bị mint và token account

**Chèn ngay dưới dấu `};` đóng `deriveOffer`:**

<!-- step: {"id": "2i", "file": "tests/escrow.ts", "mode": "after", "in": "  const deriveOffer", "line": "  };"} -->
```ts

  before(async () => {
    for (const wallet of [maker, taker]) {
      const signature = await provider.connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(signature, "confirmed");
    }
    mintA = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    mintB = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    makerAtaA = await createAssociatedTokenAccount(provider.connection, payer, mintA, maker.publicKey);
    makerAtaB = await createAssociatedTokenAccount(provider.connection, payer, mintB, maker.publicKey);
    takerAtaA = await createAssociatedTokenAccount(provider.connection, payer, mintA, taker.publicKey);
    takerAtaB = await createAssociatedTokenAccount(provider.connection, payer, mintB, taker.publicKey);
    await mintTo(provider.connection, payer, mintA, makerAtaA, payer, 1_000_000_000n);
    await mintTo(provider.connection, payer, mintB, takerAtaB, payer, 1_000_000_000n);
  });
```

Chưa có test nào nên mocha chưa chạy `before`; bước sau mới chạy.

### 2j. Test `make`

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "2j", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("make khóa đúng token A trong vault", async () => {
    const seed = new anchor.BN(1);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods
      .make(seed, new anchor.BN(100_000_000), new anchor.BN(250_000_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker])
      .rpc();

    expect((await getAccount(provider.connection, vault)).amount).to.equal(100_000_000n);
    const state = await program.account.escrow.fetch(escrow);
    expect(state.maker.equals(maker.publicKey)).to.equal(true);
  });
```

Chạy `anchor test`: `1 passing`.

<a id="escrow-3"></a>
## Bước 3 — `take`: đổi token nguyên tử

**Khái niệm:** [take](./lessons.md#86-take) · [PDA signer](./lessons.md#88-pda-signer) · [atomic settlement](./lessons.md#atomic-settlement)

### 3a. Account của `take`, phần offer

**Chèn ngay sau dấu `}` đóng `pub struct Make`:**

<!-- step: {"id": "3a", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "pub struct Make<'info> {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    /// CHECK: Khóa bằng `has_one = maker`; chỉ nhận rent khi đóng account.
    #[account(mut)]
    pub maker: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"escrow", escrow.maker.as_ref(), escrow.seed.to_le_bytes().as_ref()], bump = escrow.bump, has_one = maker, has_one = mint_a, has_one = mint_b, close = maker)]
    pub escrow: Account<'info, Escrow>,
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}
```

Chạy `anchor build`: build được.

### 3b. Vault và ba token account của `take`

**Trong `Take`, chèn ngay sau dòng `pub mint_b: InterfaceAccount<'info, Mint>,`:**

<!-- step: {"id": "3b", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "pub struct Take<'info> {", "line": "    pub mint_b: InterfaceAccount<'info, Mint>,"} -->
```rust
    #[account(mut, associated_token::mint = mint_a, associated_token::authority = escrow, associated_token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_a, token::authority = taker, token::token_program = token_program)]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_b, token::authority = taker, token::token_program = token_program)]
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_b, token::authority = maker, token::token_program = token_program)]
    pub maker_ata_b: InterfaceAccount<'info, TokenAccount>,
```

Chạy `anchor build`: build được.

### 3c. Taker trả token B cho maker

**Trong `pub mod escrow`, chèn ngay sau dấu `}` đóng hàm `make`:**

<!-- step: {"id": "3c", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "    pub fn make(", "line": "    }"} -->
```rust

    pub fn take(ctx: Context<Take>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        transfer_checked(
            CpiContext::new(ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.taker_ata_b.to_account_info(),
                    mint: ctx.accounts.mint_b.to_account_info(),
                    to: ctx.accounts.maker_ata_b.to_account_info(),
                    authority: ctx.accounts.taker.to_account_info(),
                },
            ),
            escrow.wanted_amount,
            ctx.accounts.mint_b.decimals,
        )?;

        Ok(())
    }
```

Chạy `anchor build`: build được.

### 3d. Signer seeds của Escrow PDA

**Trong `take`, chèn ngay trên dòng `Ok(())`:**

<!-- step: {"id": "3d", "file": "programs/escrow/src/lib.rs", "mode": "before", "in": "    pub fn take(", "line": "        Ok(())"} -->
```rust
        let seed_bytes = escrow.seed.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"escrow",
            escrow.maker.as_ref(),
            seed_bytes.as_ref(),
            &[escrow.bump],
        ]];
```

Chạy `anchor build`: build được, cảnh báo `unused variable: signer_seeds`.

### 3e. Vault trả token A cho taker

**Trong `take`, chèn ngay trên dòng `Ok(())`:**

<!-- step: {"id": "3e", "file": "programs/escrow/src/lib.rs", "mode": "before", "in": "    pub fn take(", "line": "        Ok(())"} -->
```rust
        transfer_checked(
            CpiContext::new_with_signer(ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint_a.to_account_info(),
                    to: ctx.accounts.taker_ata_a.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.vault.amount,
            ctx.accounts.mint_a.decimals,
        )?;
```

Chạy `anchor build`: build sạch.

### 3f. Đóng vault

**Trong import, thay dòng `token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},`** bằng:

<!-- step: {"id": "3f", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "line": "    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},"} -->
```rust
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
```

**Trong `take`, thay dòng `Ok(())`** bằng:

<!-- step: {"id": "3f", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "in": "    pub fn take(", "line": "        Ok(())"} -->
```rust
        close_account(CpiContext::new_with_signer(ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.maker.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ))
```

Chạy `anchor build`: build sạch. `take` giờ giống `checkpoint-2`.

### 3g. Test `take`

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "3g", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("take settlement nguyên tử và đóng vault/state", async () => {
    const seed = new anchor.BN(2);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods.make(seed, new anchor.BN(100_000_000), new anchor.BN(250_000_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();

    await program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB, vault,
      takerAtaA, takerAtaB, makerAtaB, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc();

    expect(await provider.connection.getAccountInfo(escrow)).to.equal(null);
    expect(await provider.connection.getAccountInfo(vault)).to.equal(null);
  });
```

Chạy `anchor test`: `2 passing`.

### 3h. Token gửi thêm vào vault

**Trong test `take settlement nguyên tử…`, chèn ngay trên dòng `await program.methods.take().accounts({`:**

<!-- step: {"id": "3h", "file": "tests/escrow.ts", "mode": "before", "in": "  it(\"take settlement", "line": "    await program.methods.take().accounts({"} -->
```ts
    // Mô phỏng token ngoài ý muốn gửi thẳng vào vault; không được làm kẹt lệnh close.
    await transfer(provider.connection, maker, makerAtaA, vault, maker, 1n);
```

**Cũng trong test đó, chèn ngay trên dòng `expect(await provider.connection.getAccountInfo(escrow)).to.equal(null);`:**

<!-- step: {"id": "3h", "file": "tests/escrow.ts", "mode": "before", "in": "  it(\"take settlement", "line": "    expect(await provider.connection.getAccountInfo(escrow)).to.equal(null);"} -->
```ts
    expect((await getAccount(provider.connection, takerAtaA)).amount).to.equal(100_000_001n);
```

Chạy `anchor test`: `2 passing`. Taker nhận 100_000_001 vì program chuyển toàn bộ `vault.amount`, gồm cả 1 đơn vị gửi thêm.

<a id="escrow-4"></a>
## Bước 4 — `refund`: maker lấy lại token A

**Khái niệm:** [refund](./lessons.md#87-refund) · [PDA signer](./lessons.md#88-pda-signer)

### 4a. Account của `refund`

**Chèn ngay sau dấu `}` đóng `pub struct Take`:**

<!-- step: {"id": "4a", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "pub struct Take<'info> {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(mut, seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()], bump = escrow.bump, has_one = maker, has_one = mint_a, close = maker)]
    pub escrow: Account<'info, Escrow>,
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mut, associated_token::mint = mint_a, associated_token::authority = escrow, associated_token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_a, token::authority = maker, token::token_program = token_program)]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}
```

Chạy `anchor build`: build được.

### 4b. Signer seeds của `refund`

**Trong `pub mod escrow`, chèn ngay sau dấu `}` đóng hàm `take`:**

<!-- step: {"id": "4b", "file": "programs/escrow/src/lib.rs", "mode": "after", "in": "    pub fn take(", "line": "    }"} -->
```rust

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let seed_bytes = escrow.seed.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"escrow",
            escrow.maker.as_ref(),
            seed_bytes.as_ref(),
            &[escrow.bump],
        ]];
        Ok(())
    }
```

Chạy `anchor build`: build được, cảnh báo `unused variable: signer_seeds`.

### 4c. Vault trả token A cho maker

**Trong `refund`, chèn ngay trên dòng `Ok(())`:**

<!-- step: {"id": "4c", "file": "programs/escrow/src/lib.rs", "mode": "before", "in": "    pub fn refund(", "line": "        Ok(())"} -->
```rust
        transfer_checked(
            CpiContext::new_with_signer(ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint_a.to_account_info(),
                    to: ctx.accounts.maker_ata_a.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.vault.amount,
            ctx.accounts.mint_a.decimals,
        )?;
```

Chạy `anchor build`: build sạch.

### 4d. Đóng vault

**Trong `refund`, thay dòng `Ok(())`** bằng:

<!-- step: {"id": "4d", "file": "programs/escrow/src/lib.rs", "mode": "replace-line", "in": "    pub fn refund(", "line": "        Ok(())"} -->
```rust
        close_account(CpiContext::new_with_signer(ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.maker.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ))
```

Chạy `anchor build`: build sạch. `lib.rs` giờ giống `final` (trừ `declare_id!`).

### 4e. Test `refund`

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "4e", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("maker có thể refund và đóng offer", async () => {
    const seed = new anchor.BN(3);
    const { escrow, vault } = deriveOffer(seed);
    const before = (await getAccount(provider.connection, makerAtaA)).amount;
    await program.methods.make(seed, new anchor.BN(10_000_000), new anchor.BN(20_000_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    await program.methods.refund().accounts({ maker: maker.publicKey, escrow, mintA, vault, makerAtaA, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    expect((await getAccount(provider.connection, makerAtaA)).amount).to.equal(before);
    expect(await provider.connection.getAccountInfo(escrow)).to.equal(null);
  });
```

Chạy `anchor test`: `3 passing`.

<a id="escrow-5"></a>
## Bước 5 — Test bảo mật

**Khái niệm:** [security review](./lessons.md#89-security-review) · [tests](./lessons.md#810-tests) · [threat model](./lessons.md#threat-model-và-tests)

### 5a. Helper cho test lỗi

**Chèn ngay dưới dấu `};` đóng `deriveOffer`:**

<!-- step: {"id": "5a", "file": "tests/escrow.ts", "mode": "after", "in": "  const deriveOffer", "line": "  };"} -->
```ts

  const expectFailure = async (promise: Promise<unknown>, message: RegExp) => {
    try {
      await promise;
      expect.fail("Transaction đáng lẽ phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(message);
    }
  };
```

Chạy `anchor test`: vẫn `3 passing`.

### 5b. Amount bằng 0 và hai mint giống nhau

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "5b", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối amount bằng 0 và hai mint giống nhau", async () => {
    const zero = deriveOffer(new anchor.BN(10));
    await expectFailure(program.methods.make(new anchor.BN(10), new anchor.BN(0), new anchor.BN(1))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, ...zero, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc(), /Số lượng|InvalidAmount|6000/);

    const sameMint = deriveOffer(new anchor.BN(11));
    await expectFailure(program.methods.make(new anchor.BN(11), new anchor.BN(1), new anchor.BN(1))
      .accounts({ maker: maker.publicKey, mintA, mintB: mintA, makerAtaA, ...sameMint, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc(), /Mint A|SameMint|6001/);
  });
```

Chạy `anchor test`: `4 passing`.

### 5c. Người khác refund

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "5c", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối người khác refund offer của maker", async () => {
    const seed = new anchor.BN(12);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods.make(seed, new anchor.BN(1), new anchor.BN(1))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    await expectFailure(program.methods.refund().accounts({
      maker: taker.publicKey, escrow, mintA, vault, makerAtaA, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /ConstraintSeeds|seeds constraint/i);
  });
```

Chạy `anchor test`: `5 passing`.

### 5d. Take lần hai

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "5d", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("take lần hai thất bại vì offer đã đóng", async () => {
    const { escrow, vault } = deriveOffer(new anchor.BN(2));
    await expectFailure(program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB, vault,
      takerAtaA, takerAtaB, makerAtaB, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /AccountNotInitialized|not initialized|3012/i);
  });
```

Chạy `anchor test`: `6 passing`. Seed 2 là offer đã được take ở test `take settlement…`.

### 5e. Mint B giả: chuẩn bị mint C

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "5e", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối take với mint B khác mint đã ghi trong offer", async () => {
    const seed = new anchor.BN(13);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods.make(seed, new anchor.BN(1_000), new anchor.BN(1_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    const mintC = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    const takerAtaC = await createAssociatedTokenAccount(provider.connection, payer, mintC, taker.publicKey);
    const makerAtaC = await createAssociatedTokenAccount(provider.connection, payer, mintC, maker.publicKey);
    await mintTo(provider.connection, payer, mintC, takerAtaC, payer, 1_000_000n);
  });
```

Chạy `anchor test`: `7 passing`.

### 5f. Mint B giả: take bằng mint C

**Trong test `từ chối take với mint B khác…`, chèn ngay trên dòng `});` đóng test:**

<!-- step: {"id": "5f", "file": "tests/escrow.ts", "mode": "after", "in": "    await mintTo(provider.connection, payer, mintC", "line": "    await mintTo(provider.connection, payer, mintC, takerAtaC, payer, 1_000_000n);"} -->
```ts
    await expectFailure(program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB: mintC, vault,
      takerAtaA, takerAtaB: takerAtaC, makerAtaB: makerAtaC, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /ConstraintHasOne|has one|2001/i);
    // Offer vẫn còn nguyên sau khi tấn công thất bại.
    expect((await getAccount(provider.connection, vault)).amount).to.equal(1_000n);
```

Chạy `anchor test`: `7 passing`.

### 5g. Thay receive account của maker

**Chèn ngay trên dòng `});` cuối file:**

<!-- step: {"id": "5g", "file": "tests/escrow.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối maker_ata_b không thuộc maker (substituted receive account)", async () => {
    const { escrow, vault } = deriveOffer(new anchor.BN(13));
    // Token account mint B của ví khác; dùng takerAtaB sẽ bị chặn sớm vì trùng account mutable.
    const otherAtaB = await createAssociatedTokenAccount(provider.connection, payer, mintB, Keypair.generate().publicKey);
    await expectFailure(program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB, vault,
      takerAtaA, takerAtaB, makerAtaB: otherAtaB, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /ConstraintTokenOwner|token owner|2015/i);
    expect((await getAccount(provider.connection, vault)).amount).to.equal(1_000n);
  });
```

Chạy `anchor test`: `8 passing`. `tests/escrow.ts` giờ giống `final`; seed 13 là offer còn nguyên sau test mint C.

## Đối chiếu

Ráp đủ các bước trên ra đúng `projects/escrow/final/programs/escrow/src/lib.rs` (trừ địa chỉ `declare_id!`) và `projects/escrow/final/tests/escrow.ts`. Phần security checklist và preview frontend đọc tiếp ở [lessons 8.9–8.11](./lessons.md#89-security-review).
