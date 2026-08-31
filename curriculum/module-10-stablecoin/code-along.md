# Stablecoin Lite — Code-along từng bước

Bài này viết lại [Stablecoin Lite](../../projects/stablecoin-lite/README.md) từ một project trống, theo đúng thứ tự video Module 10. Mỗi bước gõ một đoạn ngắn rồi build hoặc test ngay. Bước cuối ra đúng `programs/stablecoin-lite/src/lib.rs`, `programs/stablecoin-lite/src/logic.rs` và `tests/stablecoin-lite.ts` của `final` (trừ địa chỉ trong `declare_id!`); `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần làm xong Module 7–9 trước, nhất là [Module 8](../module-08-escrow/code-along.md) (CPI sang Token Program, signer seeds). Các dòng `<!-- step: … -->` cho biết đoạn code được gõ vào file nào và ở vị trí nào; khi đọc trên GitHub chúng không hiện ra.

Đây là protocol giáo dục, không phải hạ tầng stablecoin production: không có collateral, oracle hay redemption.

<a id="stable-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học, cạnh `hello-solana` của Module 1. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init stablecoin-lite --template single --package-manager pnpm --test-template mocha --no-install
cd stablecoin-lite
```

Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/stablecoin-lite`, nơi có `Anchor.toml`. Tên project có gạch ngang, nên thư mục program là `programs/stablecoin-lite`, còn tên crate và module Rust là `stablecoin_lite`.

Khóa phiên bản như Module 6 và Module 8:

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
- Trong `programs/stablecoin-lite/Cargo.toml`, đặt `anchor-lang = "=1.2.1"`.
- Trong `package.json`, đặt `@anchor-lang/core` thành `"1.2.1"`.

Test cần thư viện token, web3 của Solana và `bn.js` cho số u64:

```bash
pnpm install
pnpm add @solana/spl-token@0.4.15 @solana/web3.js@1.98.4 bn.js@5.2.2
pnpm add -D @types/bn.js@5.2.0
anchor keys sync
anchor build
```

`anchor keys sync` ghi Program ID của máy bạn vào `declare_id!` và `Anchor.toml`. Build xong không lỗi là được; program mẫu sẽ được thay ở bước 1.

Test import `BN` thẳng từ `bn.js`, không dùng `import { BN } from "@anchor-lang/core"`: Node 24 tự chạy file `.ts` dưới dạng ES module, và named import từ package CommonJS `@anchor-lang/core` báo lỗi `Named export 'BN' not found`.

<a id="stable-1"></a>
## Bước 1 — Config và MinterAllowance

**Khái niệm:** [admin/config model](./lessons.md#101-adminconfig-model) · [config account](./lessons.md#102-config-account) · [minter allowance](./lessons.md#103-minter-allowance)

### 1a. Khung program

**Thay toàn bộ `programs/stablecoin-lite/src/lib.rs`** bằng đoạn dưới. Dòng `declare_id!` giữ nguyên địa chỉ trong file của bạn, không chép địa chỉ mẫu.

<!-- step: {"id": "1a", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace"} -->
```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod stablecoin_lite {
    use super::*;
}
```

Chạy `anchor build`: build được, có cảnh báo `unused import` cho `use super::*`.

### 1b. Config

**Thêm vào cuối file:**

<!-- step: {"id": "1b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "append"} -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub paused: bool,
    pub total_cap: u64,
    pub minted_by_protocol: u64,
    pub bump: u8,
}
```

Config là PDA `["config", mint]`: mỗi mint có đúng một Config. `admin` là ví được quản lý minter và pause; `minted_by_protocol` đếm lượng đã mint qua program để so với `total_cap`. Space: 8 discriminator + 32 + 32 + 1 + 8 + 8 + 1 = 90 byte.

### 1c. MinterAllowance

**Thêm vào cuối file:**

<!-- step: {"id": "1c", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "append"} -->
```rust

#[account]
#[derive(InitSpace)]
pub struct MinterAllowance {
    pub config: Pubkey,
    pub minter: Pubkey,
    pub remaining: u64,
    pub bump: u8,
}
```

MinterAllowance là PDA `["minter", config, minter]`: mỗi minter của một Config có một hạn mức riêng. Space: 8 + 32 + 32 + 8 + 1 = 81 byte. Chạy `anchor build`: build được, vẫn cảnh báo `unused import`.

<a id="stable-2"></a>
## Bước 2 — `initialize_config`: tạo mint trong program

**Khái niệm:** [config account](./lessons.md#102-config-account) · [protocol contract](./lessons.md#protocol-contract)

### 2a. Thêm `anchor-spl`

Program sắp gọi Token Program, nên cần crate `anchor-spl`. Trong `programs/stablecoin-lite/Cargo.toml`, **thay dòng `idl-build`** trong `[features]`:

<!-- step: {"id": "2a", "file": "programs/stablecoin-lite/Cargo.toml", "mode": "replace-line", "line": "idl-build = [\"anchor-lang/idl-build\"]"} -->
```toml
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]
```

**Trong `[dependencies]`, chèn ngay dưới dòng `anchor-lang`:**

<!-- step: {"id": "2a", "file": "programs/stablecoin-lite/Cargo.toml", "mode": "after", "line": "anchor-lang = \"=1.2.1\""} -->
```toml
anchor-spl = "=1.2.1"
```

Chạy `anchor build`: build được.

### 2b. Account của `initialize_config`

**Chèn ngay dưới dòng đầu file** `use anchor_lang::prelude::*;`:

<!-- step: {"id": "2b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "use anchor_lang::prelude::*;"} -->
```rust
use anchor_spl::token_interface::TokenInterface;
```

**Chèn ngay sau dấu `}` đóng `pub mod stablecoin_lite`**, trước `#[account]` của `Config`:

<!-- step: {"id": "2b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub mod stablecoin_lite {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// Keypair mới cho mint; được tạo và khởi tạo bên trong instruction.
    #[account(mut)]
    pub mint: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config", mint.key().as_ref()],
        bump
    )]
    pub config: Account<'info, Config>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
```

- `mint` là `Signer`: client tạo một keypair mới cho mint và cùng ký transaction. Program sẽ tự tạo account mint ở địa chỉ đó.
- `Interface<'info, TokenInterface>` nhận cả Token Program lẫn Token-2022; program không cố định một token program.

Chạy `anchor build`: build được.

### 2c. Lỗi đầu tiên

**Thêm vào cuối file:**

<!-- step: {"id": "2c", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "append"} -->
```rust

#[error_code]
pub enum StablecoinError {
    #[msg("Amount phải lớn hơn 0")]
    InvalidAmount,
}
```

### 2d. Khung `initialize_config`

**Trong `pub mod stablecoin_lite`, chèn ngay dưới dòng `use super::*;`:**

<!-- step: {"id": "2d", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "    use super::*;"} -->
```rust

    /// Tạo mint MỚI và Config trong cùng một instruction.
    ///
    /// Không nhận mint có sẵn: nếu admin chuyển mint authority sang Config PDA ở một
    /// transaction riêng, kẻ khác có thể gọi `initialize_config` trước và trở thành admin.
    /// Tạo mint ở đây với authority = Config PDA thì không còn khoảng hở đó.
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        decimals: u8,
        total_cap: u64,
    ) -> Result<()> {
        require!(total_cap > 0, StablecoinError::InvalidAmount);
        todo!("tạo mint rồi ghi Config")
    }
```

Chạy `anchor build`: build được, cảnh báo `unused variable` cho `ctx` và `decimals`.

### 2e. Cấp phát account mint

**Chèn ngay dưới dòng đầu file** `use anchor_lang::prelude::*;`:

<!-- step: {"id": "2e", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "use anchor_lang::prelude::*;"} -->
```rust
use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::spl_token;
```

**Trong `initialize_config`, chèn ngay trên dòng `todo!("tạo mint rồi ghi Config")`:**

<!-- step: {"id": "2e", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "before", "line": "        todo!(\"tạo mint rồi ghi Config\")"} -->
```rust

        // 1. Cấp phát account cho mint, owner là token program đã chọn.
        let space = spl_token::state::Mint::LEN;
        create_account(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                CreateAccount {
                    from: ctx.accounts.admin.to_account_info(),
                    to: ctx.accounts.mint.to_account_info(),
                },
            ),
            Rent::get()?.minimum_balance(space),
            space as u64,
            &ctx.accounts.token_program.key(),
        )?;
```

`Mint::LEN` là 82 byte của một mint SPL Token; `Pack` là trait cung cấp hằng số đó. Account mới có owner là token program, nên chỉ token program được ghi vào nó. Chạy `anchor build`: build được, còn cảnh báo `unused variable: decimals`.

### 2f. Khởi tạo mint với Config PDA làm authority

**Thay dòng import** `use anchor_spl::token_interface::TokenInterface;` bằng:

<!-- step: {"id": "2f", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace-line", "line": "use anchor_spl::token_interface::TokenInterface;"} -->
```rust
use anchor_spl::token_interface::{initialize_mint2, InitializeMint2, TokenInterface};
```

**Chèn ngay dưới dòng `require!(total_cap > 0, StablecoinError::InvalidAmount);`:**

<!-- step: {"id": "2f", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "        require!(total_cap > 0, StablecoinError::InvalidAmount);"} -->
```rust
        let config_key = ctx.accounts.config.key();
```

**Chèn ngay trên dòng `todo!("tạo mint rồi ghi Config")`:**

<!-- step: {"id": "2f", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "before", "line": "        todo!(\"tạo mint rồi ghi Config\")"} -->
```rust

        // 2. Khởi tạo mint: Config PDA là mint authority, không có freeze authority.
        initialize_mint2(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                InitializeMint2 {
                    mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            decimals,
            &config_key,
            None,
        )?;
```

Tham số thứ ba là mint authority (Config PDA), tham số cuối là freeze authority (`None`: không ai đóng băng được token account). Chạy `anchor build`: build được.

### 2g. Ghi Config

**Thay dòng `todo!("tạo mint rồi ghi Config")`** bằng:

<!-- step: {"id": "2g", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace-line", "line": "        todo!(\"tạo mint rồi ghi Config\")"} -->
```rust

        ctx.accounts.config.set_inner(Config {
            admin: ctx.accounts.admin.key(),
            mint: ctx.accounts.mint.key(),
            paused: false,
            total_cap,
            minted_by_protocol: 0,
            bump: ctx.bumps.config,
        });
        Ok(())
```

Chạy `anchor build`: build sạch. `initialize_config` giờ giống `checkpoint-1`.

### 2h. Khung test

**Thay toàn bộ `tests/stablecoin-lite.ts`:**

<!-- step: {"id": "2h", "file": "tests/stablecoin-lite.ts", "mode": "replace"} -->
```ts
import * as anchor from "@anchor-lang/core";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("stablecoin-lite", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  // IDL được sinh khi `anchor build`; dùng dynamic workspace để test vẫn type-check trước build.
  const program: any = anchor.workspace.StablecoinLite;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const admin = payer;
});
```

Import đủ cho cả bài để không phải quay lại sửa. Chạy `anchor test`: `0 passing`.

### 2i. Keypair và địa chỉ Config

**Chèn ngay dưới dòng `const admin = payer;`:**

<!-- step: {"id": "2i", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "  const admin = payer;"} -->
```ts
  const minter = Keypair.generate();
  const outsider = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), mintKeypair.publicKey.toBuffer()],
    program.programId,
  );
  let destination: PublicKey;
```

Seeds bên TypeScript phải khớp từng byte với `seeds` bên Rust: `"config"` rồi địa chỉ mint. `destination` là token account của minter, gán ở test đầu tiên. Chạy `anchor test`: `0 passing`.

### 2j. Test tạo mint và Config

**Thêm vào cuối `describe`, trước `});` cuối file:**

<!-- step: {"id": "2j", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("tạo mint và config trong cùng instruction, Config PDA là mint authority", async () => {
    await program.methods
      .initializeConfig(6, new BN(1_000))
      .accounts({
        admin: admin.publicKey,
        mint: mintKeypair.publicKey,
        config,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([mintKeypair])
      .rpc();
  });
```

`.signers([mintKeypair])` thêm chữ ký của keypair mint; ví admin là ví của provider nên tự ký. Chạy `anchor test`: `1 passing`.

### 2k. Kiểm tra mint vừa tạo

**Trong test vừa viết, chèn ngay sau dòng `.rpc();`:**

<!-- step: {"id": "2k", "file": "tests/stablecoin-lite.ts", "mode": "after", "in": "  it(\"tạo mint và config", "line": "      .rpc();"} -->
```ts

    const mintState = await getMint(provider.connection, mintKeypair.publicKey);
    expect(mintState.mintAuthority?.toBase58()).to.equal(config.toBase58());
    expect(mintState.freezeAuthority).to.equal(null);
    expect(mintState.decimals).to.equal(6);

    destination = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      mintKeypair.publicKey,
      minter.publicKey,
    );
```

Chạy `anchor test`: `1 passing`.

### 2l. Nạp SOL cho minter và outsider

Hai ví này phải tự ký và trả phí ở các test sau. **Chèn ngay dưới dòng `let destination: PublicKey;`:**

<!-- step: {"id": "2l", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "  let destination: PublicKey;"} -->
```ts

  before(async () => {
    for (const wallet of [minter, outsider]) {
      const signature = await provider.connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(signature, "confirmed");
    }
  });
```

Chạy `anchor test`: `1 passing`.

### 2m. Mint có sẵn: phần chuẩn bị

**Thêm vào cuối `describe`:**

<!-- step: {"id": "2m", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("không nhận mint đã tồn tại (chặn front-run lúc initialize)", async () => {
    // Mint tạo sẵn ngoài program: kể cả khi authority đã là Config PDA tương ứng,
    // initialize_config vẫn phải fail vì instruction tự tạo account mint.
    const existing = Keypair.generate();
    const [existingConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), existing.publicKey.toBuffer()],
      program.programId,
    );
    await createMint(provider.connection, payer, existingConfig, null, 6, existing);
  });
```

Chạy `anchor test`: `2 passing` (test mới chưa kiểm tra gì).

### 2n. Helper cho test lỗi

**Chèn ngay dưới dòng `let destination: PublicKey;`:**

<!-- step: {"id": "2n", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "  let destination: PublicKey;"} -->
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

Chạy `anchor test`: `2 passing`.

### 2o. Mint có sẵn bị từ chối

**Trong test `không nhận mint đã tồn tại`, chèn ngay sau dòng `await createMint(...)`:**

<!-- step: {"id": "2o", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "    await createMint(provider.connection, payer, existingConfig, null, 6, existing);"} -->
```ts

    await expectFailure(
      program.methods
        .initializeConfig(6, new BN(1_000))
        .accounts({
          admin: outsider.publicKey,
          mint: existing.publicKey,
          config: existingConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([outsider, existing])
        .rpc(),
      /already in use|custom program error: 0x0/i,
    );
```

`create_account` của System Program từ chối địa chỉ đã có account (`already in use`, mã `0x0`), nên kẻ gọi trước không chiếm được mint của người khác. Chạy `anchor test`: `2 passing`.

<a id="stable-3"></a>
## Bước 3 — `set_minter` và pause

**Khái niệm:** [minter allowance](./lessons.md#103-minter-allowance) · [pause/unpause](./lessons.md#104-pauseunpause)

### 3a. Bật `init-if-needed`

`set_minter` vừa cấp allowance lần đầu vừa sửa allowance đã có, nên dùng `init_if_needed`. Tính năng này phải bật trong `programs/stablecoin-lite/Cargo.toml`. **Thay dòng `anchor-lang`:**

<!-- step: {"id": "3a", "file": "programs/stablecoin-lite/Cargo.toml", "mode": "replace-line", "line": "anchor-lang = \"=1.2.1\""} -->
```toml
anchor-lang = { version = "=1.2.1", features = ["init-if-needed"] }
```

Chạy `anchor build`: build được.

### 3b. Account của `set_minter`, phần Config

**Chèn ngay sau dấu `}` đóng `pub struct InitializeConfig`:**

<!-- step: {"id": "3b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub struct InitializeConfig<'info> {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct SetMinter<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"config", config.mint.as_ref()],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, Config>,
    /// CHECK: Chỉ dùng public key làm PDA seed và field minter.
    pub minter: UncheckedAccount<'info>,
}
```

`has_one = admin` so `config.admin` với account `admin` truyền vào; ví khác ký thì bị từ chối. Chạy `anchor build`: build được.

### 3c. Account của `set_minter`, phần allowance

**Trong `SetMinter`, chèn ngay sau dòng `pub minter: UncheckedAccount<'info>,`:**

<!-- step: {"id": "3c", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub struct SetMinter<'info> {", "line": "    pub minter: UncheckedAccount<'info>,"} -->
```rust
    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + MinterAllowance::INIT_SPACE,
        seeds = [b"minter", config.key().as_ref(), minter.key().as_ref()],
        bump
    )]
    pub allowance: Account<'info, MinterAllowance>,
    pub system_program: Program<'info, System>,
```

Chạy `anchor build`: build được.

### 3d. Handler `set_minter`

**Chèn ngay sau dấu `}` đóng hàm `initialize_config`:**

<!-- step: {"id": "3d", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "    pub fn initialize_config(", "line": "    }"} -->
```rust

    pub fn set_minter(ctx: Context<SetMinter>, allowance: u64) -> Result<()> {
        let account = &mut ctx.accounts.allowance;
        account.config = ctx.accounts.config.key();
        account.minter = ctx.accounts.minter.key();
        account.remaining = allowance;
        account.bump = ctx.bumps.allowance;
        Ok(())
    }
```

Gọi lại với số mới là đổi hạn mức; gọi với `0` là thu hồi quyền mint. Chạy `anchor build`: build sạch.

### 3e. Pause

**Chèn ngay sau dấu `}` đóng `pub struct SetMinter`:**

<!-- step: {"id": "3e", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub struct SetMinter<'info> {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct AdminConfig<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config", config.mint.as_ref()],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, Config>,
}
```

**Chèn ngay sau dấu `}` đóng hàm `set_minter`:**

<!-- step: {"id": "3e", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "    pub fn set_minter(", "line": "    }"} -->
```rust

    pub fn set_paused(ctx: Context<AdminConfig>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        Ok(())
    }
```

Một instruction cho cả pause (`true`) và unpause (`false`), cùng một quyền admin. Chạy `anchor build`: build sạch. Program giờ giống `checkpoint-1` cộng `set_paused`.

### 3f. Test cấp allowance

**Trong test, chèn ngay dưới khối tính `config`** (sau dòng `);` kết thúc `findProgramAddressSync` của config):

<!-- step: {"id": "3f", "file": "tests/stablecoin-lite.ts", "mode": "before", "line": "  let destination: PublicKey;"} -->
```ts
  const [allowance] = PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), config.toBuffer(), minter.publicKey.toBuffer()],
    program.programId,
  );
```

**Thêm vào cuối `describe`:**

<!-- step: {"id": "3f", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("cấp allowance cho minter", async () => {
    await program.methods
      .setMinter(new BN(700))
      .accounts({ admin: admin.publicKey, config, minter: minter.publicKey, allowance })
      .rpc();

    const state = await program.account.config.fetch(config);
    expect(state.totalCap.toNumber()).to.equal(1_000);
    expect(state.paused).to.equal(false);
    const allowanceState = await program.account.minterAllowance.fetch(allowance);
    expect(allowanceState.remaining.toNumber()).to.equal(700);
  });
```

Chạy `anchor test`: `3 passing`.

### 3g. Test admin sai

**Thêm vào cuối `describe`:**

<!-- step: {"id": "3g", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối admin không hợp lệ", async () => {
    await expectFailure(
      program.methods
        .setPaused(true)
        .accounts({ admin: outsider.publicKey, config })
        .signers([outsider])
        .rpc(),
      /ConstraintHasOne|has one/i,
    );
  });
```

Chạy `anchor test`: `4 passing`.

<a id="stable-4"></a>
## Bước 4 — Policy mint trong `logic.rs`

**Khái niệm:** [authorized mint](./lessons.md#105-authorized-mint) · [tests](./lessons.md#109-tests)

Phần quyết định "có được mint không" là phép tính thuần, không cần account. Tách ra file riêng để test nhanh bằng `cargo test`, không cần validator.

### 4a. Các lỗi của policy

**Trong `StablecoinError`, chèn ngay sau dòng `InvalidAmount,`:**

<!-- step: {"id": "4a", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "    InvalidAmount,"} -->
```rust
    #[msg("Protocol đang pause")]
    Paused,
    #[msg("Minter allowance không đủ")]
    AllowanceExceeded,
    #[msg("Vượt total cap")]
    CapExceeded,
    #[msg("Arithmetic overflow")]
    Overflow,
```

Thứ tự biến thể quyết định mã lỗi: `InvalidAmount` 6000, `Paused` 6001, `AllowanceExceeded` 6002, `CapExceeded` 6003, `Overflow` 6004. Chạy `anchor build`: build được.

### 4b. Ba điều kiện đầu

**Tạo file mới `programs/stablecoin-lite/src/logic.rs`:**

<!-- step: {"id": "4b", "file": "programs/stablecoin-lite/src/logic.rs", "mode": "replace"} -->
```rust
use crate::StablecoinError;
use anchor_lang::prelude::*;

pub fn authorize_mint(
    paused: bool,
    remaining: u64,
    minted: u64,
    cap: u64,
    amount: u64,
) -> Result<(u64, u64)> {
    require!(amount > 0, StablecoinError::InvalidAmount);
    require!(!paused, StablecoinError::Paused);
    require!(remaining >= amount, StablecoinError::AllowanceExceeded);
    todo!("cộng tổng và kiểm tra cap")
}
```

**Trong `lib.rs`, chèn ngay dưới dòng `use anchor_spl::token_interface::{initialize_mint2, InitializeMint2, TokenInterface};`:**

<!-- step: {"id": "4b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "use anchor_spl::token_interface::{initialize_mint2, InitializeMint2, TokenInterface};"} -->
```rust

pub mod logic;
```

Chạy `anchor build`: build được, cảnh báo `unused variable` cho `minted` và `cap`.

### 4c. Cộng tổng có kiểm tra tràn và so với cap

**Trong `logic.rs`, thay dòng `todo!("cộng tổng và kiểm tra cap")`** bằng:

<!-- step: {"id": "4c", "file": "programs/stablecoin-lite/src/logic.rs", "mode": "replace-line", "line": "    todo!(\"cộng tổng và kiểm tra cap\")"} -->
```rust
    let new_total = minted
        .checked_add(amount)
        .ok_or(StablecoinError::Overflow)?;
    require!(new_total <= cap, StablecoinError::CapExceeded);
    Ok((remaining - amount, new_total))
```

`remaining - amount` không tràn vì dòng `require!` thứ ba đã bảo đảm `remaining >= amount`. Chạy `anchor build`: build sạch.

### 4d. Unit test: đường đúng và pause

**Thêm vào cuối `logic.rs`:**

<!-- step: {"id": "4d", "file": "programs/stablecoin-lite/src/logic.rs", "mode": "append"} -->
```rust

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn updates_allowance_and_total() {
        assert_eq!(authorize_mint(false, 50, 20, 100, 10).unwrap(), (40, 30))
    }
    #[test]
    fn rejects_pause() {
        assert!(authorize_mint(true, 50, 20, 100, 10).is_err())
    }
}
```

Chạy `cargo test`: `test result: ok. 2 passed`.

### 4e. Unit test: allowance, cap, zero và overflow

**Trong `mod tests`, chèn ngay trên dấu `}` cuối file:**

<!-- step: {"id": "4e", "file": "programs/stablecoin-lite/src/logic.rs", "mode": "before-last", "line": "}"} -->
```rust
    #[test]
    fn rejects_allowance() {
        assert!(authorize_mint(false, 9, 20, 100, 10).is_err())
    }
    #[test]
    fn rejects_cap() {
        assert!(authorize_mint(false, 50, 95, 100, 10).is_err())
    }
    #[test]
    fn rejects_zero_and_overflow() {
        assert!(authorize_mint(false, 50, 20, 100, 0).is_err());
        assert!(authorize_mint(false, u64::MAX, u64::MAX, u64::MAX, 1).is_err())
    }
```

Chạy `cargo test`: `test result: ok. 5 passed`. `logic.rs` giờ giống `final`.

<a id="stable-5"></a>
## Bước 5 — `authorized_mint`

**Khái niệm:** [authorized mint](./lessons.md#105-authorized-mint) · [security và tests](./lessons.md#security-và-tests)

### 5a. Account của `authorized_mint`, phần token

**Thay dòng import** `use anchor_spl::token_interface::{initialize_mint2, InitializeMint2, TokenInterface};` bằng:

<!-- step: {"id": "5a", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace-line", "line": "use anchor_spl::token_interface::{initialize_mint2, InitializeMint2, TokenInterface};"} -->
```rust
use anchor_spl::token_interface::{
    initialize_mint2, InitializeMint2, Mint, TokenAccount, TokenInterface,
};
```

**Chèn ngay sau dấu `}` đóng `pub struct AdminConfig`:**

<!-- step: {"id": "5a", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub struct AdminConfig<'info> {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct AuthorizedMint<'info> {
    pub minter: Signer<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::token_program = token_program)]
    pub destination: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}
```

Chạy `anchor build`: build được.

### 5b. Config và allowance của minter

**Trong `AuthorizedMint`, chèn ngay sau dòng `pub minter: Signer<'info>,`:**

<!-- step: {"id": "5b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub struct AuthorizedMint<'info> {", "line": "    pub minter: Signer<'info>,"} -->
```rust
    #[account(
        mut,
        seeds = [b"config", mint.key().as_ref()],
        bump = config.bump,
        has_one = mint
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"minter", config.key().as_ref(), minter.key().as_ref()],
        bump = allowance.bump,
        has_one = config,
        has_one = minter
    )]
    pub allowance: Account<'info, MinterAllowance>,
```

Chạy `anchor build`: build được.

### 5c. Hỏi policy trước

**Chèn ngay dưới dòng `pub mod logic;`:**

<!-- step: {"id": "5c", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "line": "pub mod logic;"} -->
```rust
use logic::authorize_mint;
```

**Chèn ngay sau dấu `}` đóng hàm `set_paused`:**

<!-- step: {"id": "5c", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "    pub fn set_paused(", "line": "    }"} -->
```rust

    pub fn authorized_mint(ctx: Context<AuthorizedMint>, amount: u64) -> Result<()> {
        let (new_remaining, new_total) = authorize_mint(
            ctx.accounts.config.paused,
            ctx.accounts.allowance.remaining,
            ctx.accounts.config.minted_by_protocol,
            ctx.accounts.config.total_cap,
            amount,
        )?;
        todo!("mint token rồi ghi state")
    }
```

Chạy `anchor build`: build được, cảnh báo `unused variable` cho `new_remaining` và `new_total`.

### 5d. Mint bằng chữ ký của Config PDA

**Thay khối import `use anchor_spl::token_interface::{ … };`** bằng:

<!-- step: {"id": "5d", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace-line", "line": "use anchor_spl::token_interface::{\n    initialize_mint2, InitializeMint2, Mint, TokenAccount, TokenInterface,\n};"} -->
```rust
use anchor_spl::token_interface::{
    initialize_mint2, mint_to_checked, InitializeMint2, Mint, MintToChecked, TokenAccount,
    TokenInterface,
};
```

**Trong `authorized_mint`, chèn ngay trên dòng `todo!("mint token rồi ghi state")`:**

<!-- step: {"id": "5d", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "before", "line": "        todo!(\"mint token rồi ghi state\")"} -->
```rust

        let mint_key = ctx.accounts.config.mint;
        let signer_seeds: &[&[&[u8]]] =
            &[&[b"config", mint_key.as_ref(), &[ctx.accounts.config.bump]]];
        mint_to_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                MintToChecked {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;
```

Chạy `anchor build`: build được, còn cảnh báo `unused variable` cho `new_remaining` và `new_total`.

### 5e. Ghi state sau CPI

**Thay dòng `todo!("mint token rồi ghi state")`** bằng:

<!-- step: {"id": "5e", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace-line", "line": "        todo!(\"mint token rồi ghi state\")"} -->
```rust

        ctx.accounts.allowance.remaining = new_remaining;
        ctx.accounts.config.minted_by_protocol = new_total;
        Ok(())
```

Chạy `anchor build`: build sạch. `authorized_mint` giờ giống `checkpoint-2`.

### 5f. Helper account và test mint đúng

**Chèn ngay dưới dòng `let destination: PublicKey;`:**

<!-- step: {"id": "5f", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "  let destination: PublicKey;"} -->
```ts

  const mintAccounts = (mint = mintKeypair.publicKey, to = destination) => ({
    minter: minter.publicKey,
    config,
    allowance,
    mint,
    destination: to,
    tokenProgram: TOKEN_PROGRAM_ID,
  });
```

**Thêm vào cuối `describe`:**

<!-- step: {"id": "5f", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("mint trong allowance rồi chặn khi pause mà không đổi state", async () => {
    await program.methods
      .authorizedMint(new BN(400))
      .accounts(mintAccounts())
      .signers([minter])
      .rpc();
    expect((await getAccount(provider.connection, destination)).amount).to.equal(400n);
  });
```

Mọi lần gọi `authorizedMint` dùng cùng một bộ account, chỉ đổi mint hoặc destination ở test sai mint. Chạy `anchor test`: `5 passing`.

### 5g. Pause chặn mint và không đổi state

**Trong test vừa viết, chèn ngay sau dòng `expect(...).to.equal(400n);`:**

<!-- step: {"id": "5g", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "    expect((await getAccount(provider.connection, destination)).amount).to.equal(400n);"} -->
```ts
    await program.methods.setPaused(true).accounts({ admin: admin.publicKey, config }).rpc();

    const balanceBefore = (await getAccount(provider.connection, destination)).amount;
    const allowanceBefore = (await program.account.minterAllowance.fetch(allowance)).remaining;
    await expectFailure(
      program.methods.authorizedMint(new BN(1)).accounts(mintAccounts()).signers([minter]).rpc(),
      /Paused|pause|6001/i,
    );
    expect((await getAccount(provider.connection, destination)).amount).to.equal(balanceBefore);
    const allowanceAfter = (await program.account.minterAllowance.fetch(allowance)).remaining;
    expect(allowanceAfter.toNumber()).to.equal(allowanceBefore.toNumber());
    await program.methods.setPaused(false).accounts({ admin: admin.publicKey, config }).rpc();
```

Chạy `anchor test`: `5 passing`.

### 5h. Cap boundary

**Thêm vào cuối `describe`:**

<!-- step: {"id": "5h", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("đạt cap chính xác rồi từ chối vượt cap", async () => {
    await program.methods
      .setMinter(new BN(700))
      .accounts({ admin: admin.publicKey, config, minter: minter.publicKey, allowance })
      .rpc();
    await program.methods
      .authorizedMint(new BN(600))
      .accounts(mintAccounts())
      .signers([minter])
      .rpc();

    await expectFailure(
      program.methods.authorizedMint(new BN(1)).accounts(mintAccounts()).signers([minter]).rpc(),
      /CapExceeded|total cap|6003/i,
    );
    expect((await getMint(provider.connection, mintKeypair.publicKey)).supply).to.equal(1_000n);
  });
```

400 + 600 = 1000 đúng bằng cap thì được; thêm 1 là vượt. Chạy `anchor test`: `6 passing`.

### 5i. Sai mint

**Thêm vào cuối `describe`:**

<!-- step: {"id": "5i", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối mint account không khớp config", async () => {
    const wrongMint = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    const wrongDestination = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      wrongMint,
      minter.publicKey,
    );
    await expectFailure(
      program.methods
        .authorizedMint(new BN(1))
        .accounts(mintAccounts(wrongMint, wrongDestination))
        .signers([minter])
        .rpc(),
      /ConstraintSeeds|ConstraintHasOne|seeds constraint/i,
    );
  });
```

Chạy `anchor test`: `7 passing`.

### 5j. Thu hồi minter

**Thêm vào cuối `describe`:**

<!-- step: {"id": "5j", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("thu hồi minter bằng allowance 0", async () => {
    await program.methods
      .setMinter(new BN(0))
      .accounts({ admin: admin.publicKey, config, minter: minter.publicKey, allowance })
      .rpc();

    await expectFailure(
      program.methods.authorizedMint(new BN(1)).accounts(mintAccounts()).signers([minter]).rpc(),
      /AllowanceExceeded|allowance|6002/i,
    );
  });
```

Policy kiểm tra allowance trước cap, nên lỗi phải là `AllowanceExceeded` dù cap cũng đã đầy. Chạy `anchor test`: `8 passing`.

### 5k. Ví chưa được cấp allowance

**Thêm vào cuối `describe`:**

<!-- step: {"id": "5k", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("từ chối ví chưa được cấp allowance", async () => {
    const [outsiderAllowance] = PublicKey.findProgramAddressSync(
      [Buffer.from("minter"), config.toBuffer(), outsider.publicKey.toBuffer()],
      program.programId,
    );
    await expectFailure(
      program.methods
        .authorizedMint(new BN(1))
        .accounts({ ...mintAccounts(), minter: outsider.publicKey, allowance: outsiderAllowance })
        .signers([outsider])
        .rpc(),
      /AccountNotInitialized|3012/i,
    );
  });
```

Allowance PDA của outsider chưa từng được tạo, nên Anchor dừng ở bước đọc account (`AccountNotInitialized`, mã 3012) trước khi chạy handler. Chạy `anchor test`: `9 passing`.

<a id="stable-6"></a>
## Bước 6 — Holder burn

**Khái niệm:** [burn](./lessons.md#106-burn)

### 6a. Account của `burn`

**Chèn ngay sau dấu `}` đóng `pub struct AuthorizedMint`:**

<!-- step: {"id": "6a", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "pub struct AuthorizedMint<'info> {", "line": "}"} -->
```rust

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    pub holder: Signer<'info>,
    #[account(seeds = [b"config", mint.key().as_ref()], bump = config.bump, has_one = mint)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = holder,
        token::token_program = token_program
    )]
    pub holder_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}
```

Không có admin hay minter: holder tự ký để burn token của chính mình. Chạy `anchor build`: build được.

### 6b. Handler `burn`

**Thay khối import `use anchor_spl::token_interface::{ … };`** bằng:

<!-- step: {"id": "6b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "replace-line", "line": "use anchor_spl::token_interface::{\n    initialize_mint2, mint_to_checked, InitializeMint2, Mint, MintToChecked, TokenAccount,\n    TokenInterface,\n};"} -->
```rust
use anchor_spl::token_interface::{
    burn_checked, initialize_mint2, mint_to_checked, BurnChecked, InitializeMint2, Mint,
    MintToChecked, TokenAccount, TokenInterface,
};
```

**Chèn ngay sau dấu `}` đóng hàm `authorized_mint`:**

<!-- step: {"id": "6b", "file": "programs/stablecoin-lite/src/lib.rs", "mode": "after", "in": "    pub fn authorized_mint(", "line": "    }"} -->
```rust

    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, StablecoinError::InvalidAmount);
        burn_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                BurnChecked {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.holder_account.to_account_info(),
                    authority: ctx.accounts.holder.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )
    }
```

`burn` không đụng `minted_by_protocol`: `total_cap` là giới hạn tổng lượng mint trọn đời qua protocol, không phải giới hạn supply đang lưu hành. Chạy `anchor build`: build sạch. `lib.rs` giờ giống `final`.

### 6c. Test holder burn

**Thêm vào cuối `describe`:**

<!-- step: {"id": "6c", "file": "tests/stablecoin-lite.ts", "mode": "before-last", "line": "});"} -->
```ts

  it("holder burn làm giảm balance và mint supply", async () => {
    await program.methods
      .burn(new BN(100))
      .accounts({
        holder: minter.publicKey,
        config,
        mint: mintKeypair.publicKey,
        holderAccount: destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([minter])
      .rpc();

    expect((await getAccount(provider.connection, destination)).amount).to.equal(900n);
    expect((await getMint(provider.connection, mintKeypair.publicKey)).supply).to.equal(900n);
  });
```

Chạy `anchor test`: `10 passing`.

### 6d. Burn không trả lại cap

**Trong test vừa viết, chèn ngay sau dòng kiểm tra `supply` bằng `900n`:**

<!-- step: {"id": "6d", "file": "tests/stablecoin-lite.ts", "mode": "after", "line": "    expect((await getMint(provider.connection, mintKeypair.publicKey)).supply).to.equal(900n);"} -->
```ts
    const state = await program.account.config.fetch(config);
    expect(state.mintedByProtocol.toNumber()).to.equal(1_000);
```

Supply giảm còn 900 nhưng `minted_by_protocol` vẫn 1000, nên minter vẫn không mint thêm được. Chạy `anchor test`: `10 passing`. `tests/stablecoin-lite.ts` giờ giống `final`.

<a id="stable-7"></a>
## Bước 7 — Đọc IDL cho admin client

**Khái niệm:** [freeze/force-transfer](./lessons.md#107-freezeforce-transfer) · [Token-2022](./lessons.md#108-token-2022) · [thiết kế admin client](./lessons.md#1010-thiết-kế-admin-client)

Admin client chỉ được gọi interface program đã công bố. Liệt kê instruction, account và mã lỗi từ IDL mà `anchor build` sinh ra:

```bash
node -e 'const idl = require("./target/idl/stablecoin_lite.json"); for (const ix of idl.instructions) console.log(ix.name, ix.accounts.map((a) => a.name).join(", "))'
node -e 'const idl = require("./target/idl/stablecoin_lite.json"); for (const e of idl.errors) console.log(e.code, e.name, e.msg)'
```

Lệnh đầu in năm dòng, mỗi dòng một instruction và account của nó: `initialize_config`, `set_minter`, `set_paused`, `authorized_mint`, `burn`. Lệnh sau in năm lỗi từ `6000 InvalidAmount` đến `6004 Overflow`. Bản thiết kế admin client (màn hình, transaction confirmation, error catalogue) làm theo [lesson 10.10](./lessons.md#1010-thiết-kế-admin-client).

## Đối chiếu

Ráp đủ các bước trên ra đúng `projects/stablecoin-lite/final/programs/stablecoin-lite/src/lib.rs` (trừ địa chỉ `declare_id!`), `projects/stablecoin-lite/final/programs/stablecoin-lite/src/logic.rs` và `projects/stablecoin-lite/final/tests/stablecoin-lite.ts`. Project `final` của repo chạy test bằng `pnpm test` với wallet tạm trong `target/`; project tự tạo dùng `anchor test` với ví học tập.
