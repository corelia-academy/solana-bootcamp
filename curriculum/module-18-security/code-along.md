# Secure Treasury — Code-along từng bước

Bài này viết [Secure Treasury](../../projects/secure-treasury/README.md) từ một project trống, theo đúng thứ tự video Module 18. Program là một quỹ SOL của nhóm: admin tạo quỹ với ba approver, mỗi lần rút cần chữ ký của hai approver khác nhau, admin có công tắc tạm dừng. Mỗi bước gõ một đoạn ngắn rồi build hoặc test ngay. Bước cuối ra đúng code `final`; `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Với mỗi lỗ hổng, bài đi theo nhịp **đỏ rồi xanh**: viết bản ngây thơ như nhiều người hay viết, viết test tấn công khẳng định "kẻ gian phải bị chặn", chạy để thấy test **đỏ**, vá program, chạy lại thấy **xanh**. Code ngây thơ chỉ tồn tại ở bước trung gian; đừng dùng nó ở nơi khác.

Cần làm xong [Module 6](../module-06-voting/code-along.md) (Anchor, PDA, test TypeScript) và có wallet học tập `~/.config/solana/bootcamp-devnet.json` như [Module 1 lesson 1.3](../module-01-orientation/lessons.md#13-your-first-anchor-project).

Các marker `<!-- file: …; mode: … -->` trước mỗi code block ghi file và cách chèn: `replace` thay toàn bộ file, `append` thêm vào cuối, `after`/`before` chèn sau/trước dòng neo (`anchor`, các dòng neo cách nhau bằng `|`, tìm lần lượt từ trên xuống), `replace-lines` thay đúng các dòng neo liền nhau, `end-of-describe` chèn ngay trên dòng `});` cuối file test.

<a id="treasury-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init treasury --template single --package-manager pnpm --test-template mocha --no-install
cd treasury
```

Khóa phiên bản như Module 6:

- `rust-toolchain.toml` do `anchor init` tạo phải có `channel = "1.89.0"`.
- Tạo `.nvmrc` chứa `24`.
- Trong `Anchor.toml`, section `[toolchain]` có đủ ba dòng `anchor_version = "1.2.1"`, `solana_version = "4.1.2"`, `package_manager = "pnpm"`.
- Trong `[provider]` của `Anchor.toml`, giữ `cluster = "localnet"` và đặt `wallet = "~/.config/solana/bootcamp-devnet.json"`.
- Trong `programs/treasury/Cargo.toml`, đặt `anchor-lang = "=1.2.1"`.
- Trong `package.json`, đặt `@anchor-lang/core` thành `"1.2.1"`.

```bash
pnpm install
pnpm add -D bn.js@5.2.5
anchor keys sync
anchor build
```

`bn.js` là kiểu số lớn mà Anchor dùng cho `u64`. Với Node 24, mocha chạy file `.ts` như ES module, nên `import { BN } from "@anchor-lang/core"` báo `Named export 'BN' not found`; test của bài này import thẳng `import BN from "bn.js"` (template đã có sẵn `@types/bn.js`).

<a id="treasury-1"></a>
## Bước 1 — State của quỹ

**Khái niệm:** [account validation](./lessons.md#182-account-validation) · [multisig](./lessons.md#187-multisig)

### 1a. Khung program

**Thay toàn bộ `programs/treasury/src/lib.rs`.** Dòng `declare_id!` giữ nguyên địa chỉ trong file của bạn.

<!-- file: programs/treasury/src/lib.rs; mode: replace -->
```rust
use anchor_lang::prelude::*;

declare_id!("6YTLFqVyQQTEqrxMaTLLRFT9CcJ8nbMkY4q2QdnuRyqS");

#[program]
pub mod treasury {
    use super::*;
}
```

`anchor build`: được, cảnh báo `unused import` cho `use super::*`.

### 1b. Treasury

**Thêm vào cuối file:**

<!-- file: programs/treasury/src/lib.rs; mode: append -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub admin: Pubkey,
    pub approvers: [Pubkey; 3],
    pub paused: bool,
    pub bump: u8,
    pub vault_bump: u8,
}
```

### 1c. `is_approver` và Vault

**Thêm vào cuối file:**

<!-- file: programs/treasury/src/lib.rs; mode: append -->
```rust

impl Treasury {
    pub fn is_approver(&self, key: &Pubkey) -> bool {
        self.approvers.contains(key)
    }
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub treasury: Pubkey,
}
```

`anchor build`: được. `Treasury` chiếm `8 + 32 + 3 × 32 + 1 + 1 + 1 = 139` byte, `Vault` chiếm `8 + 32 = 40` byte. SOL của quỹ nằm trong account Vault, không nằm trong Treasury.

<a id="treasury-2"></a>
## Bước 2 — `initialize` và chặn khởi tạo lại

**Khái niệm:** [PDA seeds](./lessons.md#183-pda-validation) · [reinitialization](./lessons.md#184-reinitialization)

### 2a. Accounts của `initialize`

**Chèn ngay sau dấu `}` đóng `pub mod treasury`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub mod treasury { | use super::*; | } -->
```rust

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", admin.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### 2b. Handler `initialize`

**Chèn ngay sau dòng `use super::*;`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: use super::*; -->
```rust

    pub fn initialize(ctx: Context<Initialize>, approvers: [Pubkey; 3]) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.admin = ctx.accounts.admin.key();
        treasury.approvers = approvers;
        treasury.paused = false;
        treasury.bump = ctx.bumps.treasury;
        Ok(())
    }
```

`anchor build`: được, hết cảnh báo `unused import`.

### 2c. Vault PDA

**Trong `pub struct Initialize`, chèn ngay sau dòng `pub treasury: Account<'info, Treasury>,`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub struct Initialize<'info> { | pub treasury: Account<'info, Treasury>, -->
```rust
    #[account(
        init,
        payer = admin,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", treasury.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
```

**Trong `initialize`, chèn ngay sau dòng `treasury.bump = ctx.bumps.treasury;`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: treasury.bump = ctx.bumps.treasury; -->
```rust
        treasury.vault_bump = ctx.bumps.vault;
        ctx.accounts.vault.treasury = treasury.key();
```

`anchor build`: được.

### 2d. Khung test

**Thay toàn bộ `tests/treasury.ts`:**

<!-- file: tests/treasury.ts; mode: replace -->
```ts
import * as anchor from "@anchor-lang/core";
import BN from "bn.js";
import { expect } from "chai";

describe("treasury", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/treasury.ts).
  const program: any = anchor.workspace.treasury;
  const connection = provider.connection;
  const { Keypair, PublicKey, SystemProgram, Transaction } = anchor.web3;

  const admin = Keypair.generate();
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const carol = Keypair.generate();
  const recipient = Keypair.generate().publicKey;
});
```

`anchor test`: `0 passing`.

### 2e. Tính địa chỉ PDA trong test

**Chèn ngay sau dòng `const recipient = Keypair.generate().publicKey;`:**

<!-- file: tests/treasury.ts; mode: after; anchor: const recipient = Keypair.generate().publicKey; -->
```ts

  function findTreasury(adminKey: anchor.web3.PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), adminKey.toBuffer()],
      program.programId,
    )[0];
  }

  function findVault(treasuryKey: anchor.web3.PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), treasuryKey.toBuffer()],
      program.programId,
    )[0];
  }

  const treasury = findTreasury(admin.publicKey);
  const vault = findVault(treasury);
```

### 2f. Nạp SOL cho test

**Chèn ngay sau dòng `const vault = findVault(treasury);`:**

<!-- file: tests/treasury.ts; mode: after; anchor: const vault = findVault(treasury); -->
```ts

  async function fund(to: anchor.web3.PublicKey, lamports: number) {
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: provider.wallet.publicKey, toPubkey: to, lamports }),
    );
    await provider.sendAndConfirm(tx);
  }

  before(async () => {
    const payer = provider.wallet.publicKey;
    if ((await connection.getBalance(payer)) < 1_000_000_000) {
      const signature = await connection.requestAirdrop(payer, 2_000_000_000);
      await connection.confirmTransaction(signature, "confirmed");
    }
  });
```

`anchor test`: vẫn `0 passing`. Surfpool của `anchor test` chỉ tự nạp SOL cho `~/.config/solana/id.json`, còn ví trả phí của khóa học là `bootcamp-devnet.json`; hook `before` xin airdrop khi ví còn dưới 1 SOL. Trên Devnet ví đã có SOL nên hook bỏ qua.

### 2g. Test khởi tạo

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("khởi tạo treasury và vault", async () => {
    await fund(admin.publicKey, 50_000_000);
    const approvers = [alice.publicKey, bob.publicKey, carol.publicKey];
    await program.methods
      .initialize(approvers)
      .accounts({ treasury, vault, admin: admin.publicKey })
      .signers([admin])
      .rpc();

    const state = await program.account.treasury.fetch(treasury);
    expect(state.admin.equals(admin.publicKey)).to.equal(true);
    expect(state.approvers[1].equals(bob.publicKey)).to.equal(true);
    expect(state.paused).to.equal(false);
    const vaultState = await program.account.vault.fetch(vault);
    expect(vaultState.treasury.equals(treasury)).to.equal(true);
  });
```

`anchor test`: `1 passing`.

### 2h. Test khởi tạo lại

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("không cho khởi tạo lại treasury", async () => {
    const mallory = Keypair.generate();
    try {
      await program.methods
        .initialize([admin.publicKey, mallory.publicKey, mallory.publicKey])
        .accounts({ treasury, vault, admin: admin.publicKey })
        .signers([admin])
        .rpc();
      expect.fail("khởi tạo lần hai phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(/already in use|custom program error: 0x0/);
    }
    const state = await program.account.treasury.fetch(treasury);
    expect(state.approvers[0].equals(alice.publicKey)).to.equal(true);
  });
```

`anchor test`: `2 passing`. Test này xanh ngay vì ràng buộc `init` đã chặn khởi tạo lại: System Program từ chối tạo account đã tồn tại. Test được giữ lại để nếu ai đổi sang `init_if_needed` (không kiểm tra state cũ) thì nó đỏ.

<a id="treasury-3"></a>
## Bước 3 — `withdraw` bản ngây thơ

**Khái niệm:** [account validation](./lessons.md#182-account-validation) · [lớp kiểm tra](./lessons.md#các-lớp-kiểm-tra)

### 3a. Accounts của `withdraw`

**Chèn ngay sau dấu `}` đóng `pub struct Initialize`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub struct Initialize<'info> { | pub system_program: Program<'info, System>, | } -->
```rust

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub treasury: Account<'info, Treasury>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub approver_one: Signer<'info>,
    pub approver_two: Signer<'info>,
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
}
```

### 3b. Lỗi của program

**Thêm vào cuối file:**

<!-- file: programs/treasury/src/lib.rs; mode: append -->
```rust

#[error_code]
pub enum TreasuryError {
    #[msg("Ví ký không nằm trong danh sách approver")]
    NotApprover,
    #[msg("Vault không đủ SOL, phải giữ lại tiền rent")]
    InsufficientFunds,
    #[msg("Cộng lamports bị tràn số")]
    Overflow,
}
```

`anchor build`: được.

### 3c. Kiểm tra approver

**Chèn ngay sau dấu `}` đóng hàm `initialize`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub fn initialize | Ok(()) | } -->
```rust

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let treasury = &ctx.accounts.treasury;
        require!(treasury.is_approver(&ctx.accounts.approver_one.key()), TreasuryError::NotApprover);
        require!(treasury.is_approver(&ctx.accounts.approver_two.key()), TreasuryError::NotApprover);
        Ok(())
    }
```

`anchor build`: được, cảnh báo `unused variable: amount`.

### 3d. Giữ lại tiền rent

**Trong `withdraw`, chèn ngay sau dòng `require!` thứ hai (dòng có `approver_two`):**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: require!(treasury.is_approver(&ctx.accounts.approver_two.key()), TreasuryError::NotApprover); -->
```rust

        let vault = ctx.accounts.vault.to_account_info();
        let recipient = ctx.accounts.recipient.to_account_info();
        let reserve = Rent::get()?.minimum_balance(vault.data_len());
        let remaining = vault
            .lamports()
            .checked_sub(amount)
            .ok_or(TreasuryError::InsufficientFunds)?;
        require!(remaining >= reserve, TreasuryError::InsufficientFunds);
```

`anchor build`: được, cảnh báo `unused variable: recipient`.

### 3e. Chuyển lamports

**Chèn ngay sau dòng `require!(remaining >= reserve, TreasuryError::InsufficientFunds);`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: require!(remaining >= reserve, TreasuryError::InsufficientFunds); -->
```rust
        let received = recipient
            .lamports()
            .checked_add(amount)
            .ok_or(TreasuryError::Overflow)?;

        **vault.try_borrow_mut_lamports()? = remaining;
        **recipient.try_borrow_mut_lamports()? = received;
```

`anchor build`: được, không còn cảnh báo.

### 3f. Helper `withdraw` trong test

**Chèn ngay sau dấu `}` đóng hàm `fund`:**

<!-- file: tests/treasury.ts; mode: after; anchor: async function fund | await provider.sendAndConfirm(tx); | } -->
```ts

  function withdraw(
    amount: number,
    one: anchor.web3.Keypair,
    two: anchor.web3.Keypair,
    overrides: Record<string, anchor.web3.PublicKey> = {},
  ) {
    return program.methods
      .withdraw(new BN(amount))
      .accounts({ treasury, vault, approverOne: one.publicKey, approverTwo: two.publicKey, recipient, ...overrides })
      .signers([one, two]);
  }
```

### 3g. Test rút đúng

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("hai approver rút được SOL", async () => {
    await fund(vault, 300_000_000);
    await withdraw(100_000_000, alice, bob).rpc();
    expect(await connection.getBalance(recipient)).to.equal(100_000_000);
  });
```

`anchor test`: `3 passing`. Đường đúng chạy, nhưng `withdraw` còn hai lỗ hổng: chưa kiểm tra vault thuộc treasury, và chưa bắt hai approver phải khác nhau.

<a id="treasury-4"></a>
## Bước 4 — Tấn công vault bằng treasury giả

**Khái niệm:** [PDA validation](./lessons.md#183-pda-validation)

### 4a. Kẻ gian tự tạo treasury

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("chặn treasury giả mượn vault thật", async () => {
    const mallory = Keypair.generate();
    const mallory2 = Keypair.generate();
    const fakeTreasury = findTreasury(mallory.publicKey);
    await fund(mallory.publicKey, 50_000_000);
    await program.methods
      .initialize([mallory.publicKey, mallory2.publicKey, mallory2.publicKey])
      .accounts({ treasury: fakeTreasury, vault: findVault(fakeTreasury), admin: mallory.publicKey })
      .signers([mallory])
      .rpc();

    const before = await connection.getBalance(vault);
  });
```

`anchor test`: `4 passing` (mới là phần chuẩn bị).

### 4b. Rút vault thật bằng treasury giả

**Chèn ngay sau dòng `const before = await connection.getBalance(vault);`:**

<!-- file: tests/treasury.ts; mode: after; anchor: const before = await connection.getBalance(vault); -->
```ts
    try {
      await withdraw(50_000_000, mallory, mallory2, {
        treasury: fakeTreasury,
        recipient: mallory.publicKey,
      }).rpc();
      expect.fail("vault của treasury khác phải bị từ chối");
    } catch (error) {
      expect(String(error)).to.contain("ConstraintSeeds");
    }
    expect(await connection.getBalance(vault)).to.equal(before);
```

`anchor test`: **đỏ** — `3 passing`, `1 failing`, test `chặn treasury giả mượn vault thật` báo `AssertionError: expected 'AssertionError: vault của treasury kh…' to include 'ConstraintSeeds'`: giao dịch không lỗi nên `expect.fail` chạy. Bản ngây thơ đã cho mallory rút 0,05 SOL từ vault của quỹ thật.

### 4c. Vá: vault phải là PDA của đúng treasury

**Trong `pub struct Withdraw`, thay hai dòng `#[account(mut)]` và `pub vault: Account<'info, Vault>,` bằng:**

<!-- file: programs/treasury/src/lib.rs; mode: replace-lines; anchor: #[account(mut)] | pub vault: Account<'info, Vault>, -->
```rust
    #[account(
        mut,
        seeds = [b"vault", treasury.key().as_ref()],
        bump = treasury.vault_bump
    )]
    pub vault: Account<'info, Vault>,
```

`anchor test`: **xanh** — `4 passing`.

<a id="treasury-5"></a>
## Bước 5 — Một approver ký hai vai

**Khái niệm:** [duplicate accounts](./lessons.md#185-duplicate-accounts)

### 5a. Test tấn công

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("chặn một approver ký hai vai", async () => {
    const before = await connection.getBalance(vault);
    try {
      await withdraw(50_000_000, alice, alice, { recipient: alice.publicKey }).rpc();
      expect.fail("một ví không được ký thay hai approver");
    } catch (error) {
      expect(String(error)).to.contain("DuplicateApprover");
    }
    expect(await connection.getBalance(vault)).to.equal(before);
  });
```

`anchor test`: **đỏ** — `4 passing`, `1 failing` với `AssertionError: expected 'AssertionError: một ví không được ký …' to include 'DuplicateApprover'`. Một mình alice đã rút được tiền dù quỹ cần hai chữ ký.

### 5b. Vá: hai approver phải khác nhau

**Trong `pub enum TreasuryError`, chèn ngay sau dòng `NotApprover,`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: NotApprover, -->
```rust
    #[msg("Hai approver phải là hai ví khác nhau")]
    DuplicateApprover,
```

**Trong `pub struct Withdraw`, chèn ngay trên dòng `pub approver_two: Signer<'info>,`:**

<!-- file: programs/treasury/src/lib.rs; mode: before; anchor: pub approver_two: Signer<'info>, -->
```rust
    #[account(
        constraint = approver_two.key() != approver_one.key() @ TreasuryError::DuplicateApprover
    )]
```

`anchor test`: **xanh** — `5 passing`.

### 5c. Test rút quá số dư

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("chặn rút quá số dư, giữ lại tiền rent", async () => {
    const balance = await connection.getBalance(vault);
    try {
      await withdraw(balance, bob, carol).rpc();
      expect.fail("rút hết lamports phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("InsufficientFunds");
    }
    expect(await connection.getBalance(vault)).to.equal(balance);
  });
```

`anchor test`: `6 passing`. Test này xanh ngay vì phép kiểm tra rent đã viết ở bước 3d; nó giữ cho ai đó không xóa phép kiểm tra đó.

<a id="treasury-6"></a>
## Bước 6 — Công tắc tạm dừng

**Khái niệm:** [authority management](./lessons.md#186-authority-management) · [monitoring](./lessons.md#1812-monitoring)

### 6a. Thêm lỗi

**Chèn ngay sau dòng `DuplicateApprover,`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: DuplicateApprover, -->
```rust
    #[msg("Quỹ đang tạm dừng")]
    Paused,
    #[msg("Chỉ admin được đổi trạng thái tạm dừng")]
    NotAdmin,
```

### 6b. `set_paused` bản ngây thơ

**Chèn ngay sau dấu `}` đóng `pub struct Withdraw`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub struct Withdraw<'info> { | pub recipient: SystemAccount<'info>, | } -->
```rust

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut, has_one = admin @ TreasuryError::NotAdmin)]
    pub treasury: Account<'info, Treasury>,
    /// CHECK: bản ngây thơ, chỉ so địa chỉ với treasury.admin
    pub admin: UncheckedAccount<'info>,
}
```

**Chèn ngay sau dấu `}` đóng hàm `withdraw`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub fn withdraw | Ok(()) | } -->
```rust

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.treasury.paused = paused;
        Ok(())
    }
```

`anchor build`: được.

### 6c. Test người lạ bấm công tắc

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("chặn người lạ tạm dừng quỹ", async () => {
    try {
      await program.methods
        .setPaused(true)
        .accounts({ treasury, admin: admin.publicKey })
        .rpc();
      expect.fail("tạm dừng mà không có chữ ký admin phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(/Missing signature|Signature verification failed/);
    }
    const state = await program.account.treasury.fetch(treasury);
    expect(state.paused).to.equal(false);
  });
```

`anchor test`: **đỏ** — `6 passing`, `1 failing` với `AssertionError: expected 'AssertionError: tạm dừng mà không có …' to match /Missing signature|Signature verification failed/`. Ví trả phí của test (không phải admin) đã tạm dừng được quỹ.

### 6d. Vá: admin phải ký

**Trong `pub struct SetPaused`, thay hai dòng `/// CHECK: …` và `pub admin: UncheckedAccount<'info>,` bằng:**

<!-- file: programs/treasury/src/lib.rs; mode: replace-lines; anchor: /// CHECK: bản ngây thơ, chỉ so địa chỉ với treasury.admin | pub admin: UncheckedAccount<'info>, -->
```rust
    pub admin: Signer<'info>,
```

`anchor test`: **xanh** — `7 passing`.

### 6e. Test tạm dừng chặn withdraw

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("admin tạm dừng thì không rút được", async () => {
    const setPaused = (paused: boolean) =>
      program.methods.setPaused(paused).accounts({ treasury, admin: admin.publicKey }).signers([admin]).rpc();
    await setPaused(true);
    try {
      await withdraw(50_000_000, alice, bob).rpc();
      expect.fail("quỹ đang tạm dừng phải chặn withdraw");
    } catch (error) {
      expect(String(error)).to.contain("Paused");
    }
  });
```

`anchor test`: **đỏ** — `7 passing`, `1 failing` với `AssertionError: expected 'AssertionError: quỹ đang tạm dừng phả…' to include 'Paused'`. Công tắc đã bật nhưng `withdraw` chưa đọc nó.

### 6f. Vá: `withdraw` tôn trọng công tắc

**Trong `withdraw`, chèn ngay sau dòng `let treasury = &ctx.accounts.treasury;`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: pub fn withdraw | let treasury = &ctx.accounts.treasury; -->
```rust
        require!(!treasury.paused, TreasuryError::Paused);
```

`anchor test`: **xanh** — `8 passing`.

### 6g. Mở lại quỹ

**Trong test `admin tạm dừng thì không rút được`, chèn ngay sau dòng `expect(String(error)).to.contain("Paused");` và dấu `}` đóng `catch`:**

<!-- file: tests/treasury.ts; mode: after; anchor: expect(String(error)).to.contain("Paused"); | } -->
```ts

    await setPaused(false);
    const state = await program.account.treasury.fetch(treasury);
    expect(state.paused).to.equal(false);
```

`anchor test`: `8 passing`.

<a id="treasury-7"></a>
## Bước 7 — Gửi giao dịch như production

**Khái niệm:** [compute và priority fee](./lessons.md#189-computepriority-fees) · [blockhash và retry](./lessons.md#1810-blockhashretry) · [user errors](./lessons.md#1811-user-errors) · [monitoring](./lessons.md#1812-monitoring)

### 7a. Log để theo dõi

**Trong `withdraw`, chèn ngay sau dòng `**recipient.try_borrow_mut_lamports()? = received;`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: **recipient.try_borrow_mut_lamports()? = received; -->
```rust
        msg!("withdraw {} lamports to {}", amount, recipient.key());
```

**Trong `set_paused`, chèn ngay sau dòng `ctx.accounts.treasury.paused = paused;`:**

<!-- file: programs/treasury/src/lib.rs; mode: after; anchor: ctx.accounts.treasury.paused = paused; -->
```rust
        msg!("paused = {}", paused);
```

`anchor test`: `8 passing`.

### 7b. Priority fee có trần

**Chèn ngay sau dấu `}` đóng hàm `fund`:**

<!-- file: tests/treasury.ts; mode: after; anchor: async function fund | await provider.sendAndConfirm(tx); | } -->
```ts

  const MAX_PRIORITY_FEE = 10_000; // micro-lamports mỗi compute unit

  async function priorityFee() {
    const fees = await connection.getRecentPrioritizationFees();
    const highest = Math.max(0, ...fees.map((fee) => fee.prioritizationFee));
    return Math.min(highest, MAX_PRIORITY_FEE);
  }
```

### 7c. Gửi và chờ theo blockhash

**Chèn ngay sau dấu `}` đóng hàm `priorityFee`:**

<!-- file: tests/treasury.ts; mode: after; anchor: async function priorityFee | return Math.min(highest, MAX_PRIORITY_FEE); | } -->
```ts

  async function sendWithRetry(tx: anchor.web3.Transaction, signers: anchor.web3.Keypair[]) {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = provider.wallet.publicKey;
    tx.partialSign(...signers);
    const raw = (await provider.wallet.signTransaction(tx)).serialize();
    const signature = await connection.sendRawTransaction(raw, { maxRetries: 0 });
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    return signature;
  }
```

### 7d. Test gửi có compute budget

<!-- file: tests/treasury.ts; mode: end-of-describe -->
```ts

  it("gửi withdraw có compute budget và theo dõi blockhash", async () => {
    const withdrawIx = await withdraw(10_000_000, alice, carol).instruction();
    const tx = new Transaction().add(
      anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 30_000 }),
      anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: await priorityFee() }),
      withdrawIx,
    );
    const signature = await sendWithRetry(tx, [alice, carol]);

    const result = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    expect(result?.meta?.err).to.equal(null);
  });
```

`anchor test`: `9 passing`.

### 7e. Kiểm tra log và compute

**Chèn ngay sau dòng `expect(result?.meta?.err).to.equal(null);`:**

<!-- file: tests/treasury.ts; mode: after; anchor: expect(result?.meta?.err).to.equal(null); -->
```ts
    expect(result?.meta?.logMessages?.join("\n")).to.contain("withdraw 10000000 lamports");
    expect(result?.meta?.computeUnitsConsumed).to.be.lessThan(30_000);
```

`anchor test`: `9 passing`.

### 7f. Gửi lại cùng một giao dịch

**Trong `sendWithRetry`, thay hai dòng `await connection.confirmTransaction(…);` và `return signature;` bằng:**

<!-- file: tests/treasury.ts; mode: replace-lines; anchor: await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed"); | return signature; -->
```ts
    while ((await connection.getBlockHeight("confirmed")) <= lastValidBlockHeight) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const status = (await connection.getSignatureStatuses([signature])).value[0];
      if (status?.err) throw new Error(`Giao dịch lỗi: ${JSON.stringify(status.err)}`);
      if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
        return signature;
      }
      await connection.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 0 });
    }
    throw new Error("Blockhash đã hết hạn: tạo và ký lại giao dịch mới");
```

`anchor test`: `9 passing`.

### 7g. Lỗi dễ hiểu cho người dùng

**Chèn ngay sau dấu `}` đóng hàm `sendWithRetry`:**

<!-- file: tests/treasury.ts; mode: after; anchor: async function sendWithRetry | throw new Error("Blockhash đã hết hạn: tạo và ký lại giao dịch mới"); | } -->
```ts

  const FRIENDLY_ERRORS: Record<string, string> = {
    NotApprover: "Ví này không có quyền duyệt rút tiền.",
    DuplicateApprover: "Cần chữ ký của hai approver khác nhau.",
    Paused: "Quỹ đang tạm dừng, hãy liên hệ admin.",
    InsufficientFunds: "Quỹ không đủ SOL cho khoản rút này.",
  };

  function friendlyError(error: unknown) {
    if (error instanceof anchor.AnchorError) {
      const code = error.error.errorCode.code;
      return FRIENDLY_ERRORS[code] ?? `Giao dịch bị từ chối (mã ${code}).`;
    }
    return "Không gửi được giao dịch, hãy thử lại sau.";
  }
```

**Trong test `chặn một approver ký hai vai`, chèn ngay sau dòng `expect(String(error)).to.contain("DuplicateApprover");`:**

<!-- file: tests/treasury.ts; mode: after; anchor: expect(String(error)).to.contain("DuplicateApprover"); -->
```ts
      expect(friendlyError(error)).to.equal("Cần chữ ký của hai approver khác nhau.");
```

`anchor test`: `9 passing`. `lib.rs` và `tests/treasury.ts` giờ giống `projects/secure-treasury/final`.

<a id="treasury-8"></a>
## Bước 8 — Launch Devnet và gói bằng chứng

**Khái niệm:** [authority management](./lessons.md#186-authority-management) · [audit preparation](./lessons.md#1813-audit-preparation) · [production package](./lessons.md#production-package)

### 8a. Deploy

Lấy Program ID bằng `anchor keys list`. Trong `Anchor.toml`, giữ `[programs.localnet]` và thêm ngay sau nó (thay `YOUR_PROGRAM_ID`):

<!-- file: Anchor.toml; mode: after; anchor: [programs.localnet] | treasury = -->
```toml

[programs.devnet]
treasury = "YOUR_PROGRAM_ID"
```

```bash
anchor build
solana balance --url devnet
anchor program deploy --provider.cluster devnet
TREASURY_PROGRAM_ID=YOUR_PROGRAM_ID
solana program show "$TREASURY_PROGRAM_ID" --url devnet
```

`solana program show` in `Authority` là địa chỉ ví học tập: một khóa duy nhất đang có quyền upgrade.

### 8b. Bằng chứng trên Devnet

```bash
anchor test --provider.cluster devnet --skip-deploy
```

`9 passing`, tốn khoảng 0,45 Devnet SOL mỗi lần (rent và SOL nạp cho vault). Mở Explorer ở cluster Devnet, dán Program ID, mở transaction `withdraw` có compute budget để xem log `withdraw 10000000 lamports`.

### 8c. `SECURITY.md`

**Tạo file `SECURITY.md` ở gốc project** (thay các chỗ viết hoa):

<!-- file: SECURITY.md; mode: replace -->
```markdown
# Security review — treasury

Commit: COMMIT_HASH · Rust 1.89.0 · Anchor 1.2.1 · Solana CLI 4.1.2
Devnet program ID: YOUR_PROGRAM_ID · Upgrade authority: ví học tập (một khóa)

| Invariant | Bảo vệ ở | Test |
| --- | --- | --- |
| Không khởi tạo lại quỹ | `init` trên `treasury`, `vault` | không cho khởi tạo lại treasury |
| Vault thuộc đúng treasury | `seeds` + `bump = treasury.vault_bump` | chặn treasury giả mượn vault thật |
| Hai chữ ký khác nhau | `constraint approver_two != approver_one` | chặn một approver ký hai vai |
| Vault giữ tiền rent | `checked_sub` + `minimum_balance` | chặn rút quá số dư, giữ lại tiền rent |
| Chỉ admin bấm tạm dừng | `Signer` + `has_one = admin` | chặn người lạ tạm dừng quỹ |
| Tạm dừng chặn rút | `require!(!treasury.paused)` | admin tạm dừng thì không rút được |

Retry: gửi lại cùng bytes đã ký tới `lastValidBlockHeight`, hết hạn thì ký lại.
Monitoring: log `withdraw … lamports to …`, `paused = …`; cảnh báo khi số dư vault giảm bất thường.
Known limitations: upgrade authority và admin là một khóa; chưa có đổi approver; priority fee trần 10 000 micro-lamports.
```

Đây là bản nộp của module: mỗi dòng của [security checklist](../../docs/security-checklist.md) trỏ tới constraint và test chứng minh nó.
