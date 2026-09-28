# Forecasting App — Code-along từng bước

> Chỉ dùng **điểm giả lập — không phải tiền thật**. Không có token, deposit, withdrawal, odds hay cơ chế cá cược.

Bài này viết [Forecasting App](../../projects/forecasting-app/README.md) từ một project trống, theo đúng thứ tự video Module 14. Mỗi bước gõ một đoạn ngắn rồi build hoặc test ngay. Bước cuối ra đúng code `final`; `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần làm xong Module 5–6 (đặc biệt [code-along Voting App](../module-06-voting/code-along.md)) và Module 9 trước.

Mỗi khối code có một dòng chú thích `<!-- step: … -->` ẩn: nó ghi file và vị trí chèn để script kiểm tra ráp lại các bước. Bạn chỉ cần làm theo câu hướng dẫn phía trên khối code.

<a id="fc-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học, cạnh `voting` của Module 6. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init forecasting --template single --package-manager pnpm --test-template mocha --no-install
cd forecasting
```

Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/forecasting`, nơi có `Anchor.toml`.

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
- Trong `programs/forecasting/Cargo.toml`, đặt `anchor-lang = "=1.2.1"`.
- Trong `package.json`, đặt `@anchor-lang/core` thành `"1.2.1"`.

```bash
pnpm install
anchor keys sync
anchor build
```

Build xong không lỗi là được; program mẫu (counter) sẽ được thay ở bước 1.

<a id="fc-1"></a>
## Bước 1 — Ba account lưu dữ liệu

**Khái niệm:** [question account](./lessons.md#142-question-account) · [user position](./lessons.md#143-user-position) · [fake points](./lessons.md#144-fake-points)

### 1a. Khung program

**Thay toàn bộ `programs/forecasting/src/lib.rs`** bằng đoạn dưới. Dòng `declare_id!` giữ nguyên địa chỉ trong file của bạn, không chép địa chỉ mẫu.

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "replace"} -->
```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod forecasting {
    use super::*;
}
```

Chạy `anchor build`: build được, cảnh báo `unused import: super::*` vì chưa có instruction.

### 1b. Question

**Thêm vào cuối `lib.rs`, cách dấu `}` đóng module một dòng trống:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "append", "blank_before": true} -->
```rust
#[account]
#[derive(InitSpace)]
pub struct Question {
    pub authority: Pubkey,
    pub question_id: u64,
    #[max_len(120)]
    pub text: String,
    #[max_len(4, 24)]
    pub outcomes: Vec<String>,
    pub close_time: i64,
    pub resolved_outcome: Option<u8>,
    pub participant_count: u32,
    pub bump: u8,
}
```

`#[max_len(4, 24)]` trên `Vec<String>`: tối đa 4 phần tử, mỗi chuỗi tối đa 24 byte. `resolved_outcome` là `None` khi chưa có kết quả, `Some(i)` khi authority đã chọn lựa chọn thứ `i`. Trạng thái `Open → Closed → Resolved` không lưu riêng: `Closed` suy ra từ `close_time` và Clock, `Resolved` là `resolved_outcome` có giá trị.

### 1c. Giới hạn của Question

**Thêm vào cuối `lib.rs`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "append"} -->
```rust

impl Question {
    pub const MAX_TEXT_LEN: usize = 120;
    pub const MAX_OUTCOMES: usize = 4;
    pub const MAX_OUTCOME_LEN: usize = 24;
}
```

Ba hằng số này bằng đúng các số trong `max_len`, dùng để kiểm tra input ở bước 2. Space của Question: 8 + 32 + 8 + (4 + 120) + (4 + 4 × (4 + 24)) + 8 + (1 + 1) + 4 + 1 = 303 byte.

### 1d. Player — sổ điểm giả lập

**Thêm vào cuối `lib.rs`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "append"} -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Player {
    pub user: Pubkey,
    pub points: u64,
    pub score: u64,
    pub bump: u8,
}

impl Player {
    pub const STARTING_POINTS: u64 = 1_000;
}
```

`points` là ngân sách điểm đang rảnh để đặt vào dự đoán; `score` là điểm thành tích dùng cho leaderboard. Không instruction nào đổi điểm thành token hay SOL.

### 1e. Position

**Thêm vào cuối `lib.rs`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "append"} -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub question: Pubkey,
    pub user: Pubkey,
    pub choice: u8,
    pub points: u64,
    pub claimed: bool,
    pub bump: u8,
}
```

Mỗi người có tối đa một Position trên một câu hỏi; `claimed` chặn claim hai lần. Chạy `anchor build`: build được, vẫn cảnh báo `unused import: super::*`.

<a id="fc-2"></a>
## Bước 2 — Tạo câu hỏi

**Khái niệm:** [question account](./lessons.md#142-question-account) · [state machine](./lessons.md#state-machine)

### 2a. Danh sách account của `create_question`

**Chèn ngay trên `#[account]` của `Question`** (dưới dấu `}` đóng `pub mod forecasting`, cách một dòng trống):

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "before-question-state"} -->
```rust
#[derive(Accounts)]
#[instruction(question_id: u64)]
pub struct CreateQuestion<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Question::INIT_SPACE,
        seeds = [b"question", authority.key().as_ref(), question_id.to_le_bytes().as_ref()],
        bump
    )]
    pub question: Account<'info, Question>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

```

Seeds có `authority` để mỗi ví có dãy `question_id` riêng, như Poll ở Module 6. Chạy `anchor build`: build được, vẫn cảnh báo `unused import`.

### 2b. Lỗi của câu hỏi

**Thêm vào cuối `lib.rs`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "append"} -->
```rust

#[error_code]
pub enum ForecastError {
    #[msg("Câu hỏi không được để trống")]
    EmptyText,
    #[msg("Câu hỏi dài hơn 120 bytes")]
    TextTooLong,
    #[msg("Câu hỏi cần từ 2 đến 4 lựa chọn")]
    InvalidOutcomeCount,
    #[msg("Mỗi lựa chọn phải có chữ và không dài hơn 24 bytes")]
    InvalidOutcomeLabel,
    #[msg("Giờ đóng phải ở tương lai")]
    InvalidCloseTime,
}
```

### 2c. Kiểm tra nội dung câu hỏi

**Trong `pub mod forecasting`, chèn ngay dưới dòng `use super::*;`, cách một dòng trống:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "after", "anchor": "    use super::*;", "blank_before": true} -->
```rust
    pub fn create_question(
        ctx: Context<CreateQuestion>,
        question_id: u64,
        text: String,
        outcomes: Vec<String>,
        close_time: i64,
    ) -> Result<()> {
        require!(!text.trim().is_empty(), ForecastError::EmptyText);
        require!(
            text.len() <= Question::MAX_TEXT_LEN,
            ForecastError::TextTooLong
        );
        todo!("kiểm tra lựa chọn và giờ đóng")
    }
```

Chạy `anchor build`: build được, cảnh báo biến chưa dùng (`ctx`, `question_id`, `outcomes`, `close_time`).

### 2d. Kiểm tra lựa chọn và giờ đóng

**Xóa dòng `todo!("kiểm tra lựa chọn và giờ đóng")`, gõ vào đúng chỗ đó:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "replace-todo"} -->
```rust
        require!(
            outcomes.len() >= 2 && outcomes.len() <= Question::MAX_OUTCOMES,
            ForecastError::InvalidOutcomeCount
        );
        for outcome in outcomes.iter() {
            require!(
                !outcome.trim().is_empty() && outcome.len() <= Question::MAX_OUTCOME_LEN,
                ForecastError::InvalidOutcomeLabel
            );
        }
        let now = Clock::get()?.unix_timestamp;
        require!(close_time > now, ForecastError::InvalidCloseTime);
        todo!("ghi state vào Question")
```

`Clock::get()?` đọc giờ của cluster ngay trong handler, không cần thêm account `clock`. Chạy `anchor build`: build được, còn cảnh báo `ctx`, `question_id` chưa dùng.

### 2e. Ghi state

**Xóa dòng `todo!("ghi state vào Question")`, để một dòng trống sau `require!` cuối rồi gõ:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "replace-todo", "blank_before": true} -->
```rust
        let question = &mut ctx.accounts.question;
        question.authority = ctx.accounts.authority.key();
        question.question_id = question_id;
        question.text = text;
        question.outcomes = outcomes;
        question.close_time = close_time;
        question.resolved_outcome = None;
        question.participant_count = 0;
        question.bump = ctx.bumps.question;
        Ok(())
```

Chạy `anchor build`: build sạch, không cảnh báo nào từ code của bạn.

### 2f. Khung test

**Thay toàn bộ `tests/forecasting.ts`** bằng:

<!-- step: {"file": "tests/forecasting.ts", "mode": "replace"} -->
```ts
import * as anchor from "@anchor-lang/core";
import { BN } from "@anchor-lang/core";
import { expect } from "chai";

describe("forecasting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/forecasting.ts).
  const program: any = anchor.workspace.forecasting;
  const authority = provider.wallet.publicKey;
  const questionId = new BN(Date.now());
  const closeTime = Math.floor(Date.now() / 1000) + 20;
  const outcomes = ["Có", "Không"];
});
```

Câu hỏi đóng sau 20 giây: đủ để chạy các test trước giờ đóng, rồi bước 4 chờ qua giờ đóng để resolve. Chạy `anchor test`: `0 passing`.

### 2g. Tính địa chỉ Question

**Trong `describe`, chèn ngay dưới dòng `const outcomes = ...`, cách một dòng trống:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "after", "anchor": "  const outcomes = [\"Có\", \"Không\"];", "blank_before": true} -->
```ts
  function findQuestion(id: BN) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("question"), authority.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];
  }

  const question = findQuestion(questionId);
```

Seeds bên TypeScript khớp từng byte với `seeds` bên Rust: `"question"`, ví authority, `question_id` 8 byte little-endian. Chạy `anchor test`: vẫn `0 passing`, không lỗi.

### 2h. Test tạo câu hỏi

**Thêm vào cuối `describe`, trước `});` cuối file:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("tạo câu hỏi đúng PDA", async () => {
    await program.methods
      .createQuestion(questionId, "Mainnet có ra tính năng X trước 2027?", outcomes, new BN(closeTime))
      .accounts({ question, authority })
      .rpc();

    const state = await program.account.question.fetch(question);
    expect(state.outcomes).to.deep.equal(outcomes);
    expect(state.resolvedOutcome).to.equal(null);
    expect(state.participantCount).to.equal(0);
  });
```

Bên TypeScript, `Option<u8>` đọc ra `null` khi là `None`. Chạy `anchor test`: `1 passing`.

### 2i. Test giờ đóng đã qua

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối giờ đóng đã qua", async () => {
    const badId = questionId.addn(1);
    const badQuestion = findQuestion(badId);
    try {
      await program.methods
        .createQuestion(badId, "Câu hỏi đã đóng", outcomes, new BN(closeTime - 60))
        .accounts({ question: badQuestion, authority })
        .rpc();
      expect.fail("close_time trong quá khứ phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Giờ đóng phải ở tương lai");
    }
    expect(await program.account.question.fetchNullable(badQuestion)).to.equal(null);
  });
```

Chạy `anchor test`: `2 passing`.

### 2j. Test số lựa chọn sai

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối câu hỏi chỉ có một lựa chọn", async () => {
    const badId = questionId.addn(2);
    const badQuestion = findQuestion(badId);
    try {
      await program.methods
        .createQuestion(badId, "Một lựa chọn", ["Có"], new BN(closeTime))
        .accounts({ question: badQuestion, authority })
        .rpc();
      expect.fail("một lựa chọn phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Câu hỏi cần từ 2 đến 4 lựa chọn");
    }
  });
```

Chạy `anchor test`: `3 passing`. Program và test giờ giống `checkpoint-1`.

<a id="fc-3"></a>
## Bước 3 — Điểm giả lập và dự đoán

**Khái niệm:** [user position](./lessons.md#143-user-position) · [fake points](./lessons.md#144-fake-points)

### 3a. Danh sách account của `register_player`

**Chèn ngay trên `#[account]` của `Question`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "before-question-state"} -->
```rust
#[derive(Accounts)]
pub struct RegisterPlayer<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Player::INIT_SPACE,
        seeds = [b"player", user.key().as_ref()],
        bump
    )]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

```

Player PDA chỉ có seeds `"player"` + ví người chơi: mỗi ví đúng một sổ điểm, và `init` làm lần đăng ký thứ hai thất bại, nên không ai tự cấp lại 1000 điểm.

### 3b. `register_player`

**Trong `pub mod forecasting`, chèn ngay trên dấu `}` đóng module (dưới `}` của `create_question`), cách một dòng trống:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-program"} -->
```rust
    pub fn register_player(ctx: Context<RegisterPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.user = ctx.accounts.user.key();
        player.points = Player::STARTING_POINTS;
        player.score = 0;
        player.bump = ctx.bumps.player;
        Ok(())
    }
```

Chạy `anchor build`: build được.

### 3c. Danh sách account của `predict`

**Chèn ngay trên `#[account]` của `Question`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "before-question-state"} -->
```rust
#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub question: Account<'info, Question>,
    #[account(
        mut,
        seeds = [b"player", user.key().as_ref()],
        bump = player.bump
    )]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

```

`bump = player.bump` dùng bump đã lưu lúc đăng ký thay vì tìm lại. Chạy `anchor build`: build được.

### 3d. Position trong `Predict`

**Trong `pub struct Predict`, chèn ngay dưới dòng `pub player: Account<'info, Player>,`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "after", "scope": "pub struct Predict<'info> {", "anchor": "    pub player: Account<'info, Player>,"} -->
```rust
    #[account(
        init,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", question.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
```

Position PDA theo câu hỏi + người chơi; `init` nghĩa là mỗi người chỉ dự đoán một lần trên mỗi câu hỏi và không sửa được sau đó. Chạy `anchor build`: build được.

### 3e. Lỗi khi dự đoán

**Trong `pub enum ForecastError`, chèn ngay trên dấu `}` cuối file:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-file-block"} -->
```rust
    #[msg("Câu hỏi đã đóng, không nhận dự đoán")]
    QuestionClosed,
    #[msg("Lựa chọn không tồn tại")]
    InvalidChoice,
    #[msg("Số điểm phải lớn hơn 0")]
    ZeroPoints,
    #[msg("Không đủ điểm giả lập")]
    NotEnoughPoints,
    #[msg("Phép tính điểm bị tràn")]
    MathOverflow,
```

### 3f. Kiểm tra input của `predict`

**Trong `pub mod forecasting`, chèn ngay trên dấu `}` đóng module (dưới `register_player`), cách một dòng trống:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-program"} -->
```rust
    pub fn predict(ctx: Context<Predict>, choice: u8, points: u64) -> Result<()> {
        let question = &mut ctx.accounts.question;
        let now = Clock::get()?.unix_timestamp;
        require!(now < question.close_time, ForecastError::QuestionClosed);
        require!(
            (choice as usize) < question.outcomes.len(),
            ForecastError::InvalidChoice
        );
        require!(points > 0, ForecastError::ZeroPoints);
        todo!("khóa điểm của người chơi")
    }
```

Chạy `anchor build`: build được.

### 3g. Khóa điểm

**Xóa dòng `todo!("khóa điểm của người chơi")`, để một dòng trống sau `require!` cuối rồi gõ:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "replace-todo", "blank_before": true} -->
```rust
        let player = &mut ctx.accounts.player;
        player.points = player
            .points
            .checked_sub(points)
            .ok_or(ForecastError::NotEnoughPoints)?;
        question.participant_count = question
            .participant_count
            .checked_add(1)
            .ok_or(ForecastError::MathOverflow)?;
        todo!("ghi Position")
```

`checked_sub` trả `None` khi kết quả âm, nên đặt quá số điểm đang có thành lỗi `NotEnoughPoints` thay vì tràn số. Chạy `anchor build`: build được.

### 3h. Ghi Position

**Xóa dòng `todo!("ghi Position")`, để một dòng trống rồi gõ:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "replace-todo", "blank_before": true} -->
```rust
        let position = &mut ctx.accounts.position;
        position.question = question.key();
        position.user = ctx.accounts.user.key();
        position.choice = choice;
        position.points = points;
        position.claimed = false;
        position.bump = ctx.bumps.position;
        Ok(())
```

Chạy `anchor build`: build sạch.

### 3i. Hai người chơi trong test

**Code 1 — trong `tests/forecasting.ts`, chèn ngay trên dòng `const question = findQuestion(questionId);`** (dưới hàm `findQuestion`):

<!-- step: {"file": "tests/forecasting.ts", "mode": "before", "anchor": "  const question = findQuestion(questionId);"} -->
```ts
  function findPlayer(user: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), user.toBuffer()],
      program.programId,
    )[0];
  }

  function findPosition(questionAddress: anchor.web3.PublicKey, user: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("position"), questionAddress.toBuffer(), user.toBuffer()],
      program.programId,
    )[0];
  }

```

**Code 2 — chèn ngay dưới dòng `const question = findQuestion(questionId);`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "after", "anchor": "  const question = findQuestion(questionId);"} -->
```ts
  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();
```

Alice và Bob là hai ví mới mỗi lần chạy test, nên bộ test chạy lại được nhiều lần, kể cả trên Devnet. Chạy `anchor test`: `3 passing`.

### 3j. Test đăng ký người chơi

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("đăng ký người chơi nhận 1000 điểm giả lập", async () => {
    const fund = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({ fromPubkey: authority, toPubkey: alice.publicKey, lamports: 50_000_000 }),
      anchor.web3.SystemProgram.transfer({ fromPubkey: authority, toPubkey: bob.publicKey, lamports: 50_000_000 }),
    );
    await provider.sendAndConfirm(fund);

    for (const user of [alice, bob]) {
      await program.methods
        .registerPlayer()
        .accounts({ user: user.publicKey })
        .signers([user])
        .rpc();
    }
  });
```

Ví học tập chuyển cho mỗi người 0,05 SOL để trả rent và phí; không dùng airdrop vì Devnet giới hạn airdrop. `player` không có trong `.accounts(...)`: Anchor tự tính PDA từ seeds trong IDL. Chạy `anchor test`: `4 passing`.

### 3k. Kiểm tra sổ điểm

**Trong test `đăng ký người chơi…`, chèn ngay dưới `}` đóng vòng `for`, cách một dòng trống:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "after", "scope": "  it(\"đăng ký người chơi nhận 1000 điểm giả lập\"", "anchor": "    }", "blank_before": true} -->
```ts
    const player = await program.account.player.fetch(findPlayer(alice.publicKey));
    expect(player.points.toNumber()).to.equal(1000);
    expect(player.score.toNumber()).to.equal(0);
```

Chạy `anchor test`: `4 passing`.

### 3l. Test dự đoán

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("dự đoán khóa điểm và tạo position", async () => {
    await program.methods
      .predict(0, new BN(300))
      .accounts({ question, user: alice.publicKey })
      .signers([alice])
      .rpc();
    await program.methods
      .predict(1, new BN(200))
      .accounts({ question, user: bob.publicKey })
      .signers([bob])
      .rpc();
  });
```

Alice chọn `Có` với 300 điểm, Bob chọn `Không` với 200 điểm. Chạy `anchor test`: `5 passing`.

### 3m. Kiểm tra điểm bị khóa

**Trong test `dự đoán khóa điểm…`, chèn ngay dưới `.rpc();` của Bob, cách một dòng trống:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "after", "scope": "      .signers([bob])", "anchor": "      .rpc();", "blank_before": true} -->
```ts
    const player = await program.account.player.fetch(findPlayer(alice.publicKey));
    const position = await program.account.position.fetch(findPosition(question, alice.publicKey));
    const state = await program.account.question.fetch(question);
    expect(player.points.toNumber()).to.equal(700);
    expect(position.choice).to.equal(0);
    expect(position.points.toNumber()).to.equal(300);
    expect(state.participantCount).to.equal(2);
```

Chạy `anchor test`: `5 passing`.

### 3n. Test lựa chọn không tồn tại

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối lựa chọn không tồn tại", async () => {
    const otherId = questionId.addn(3);
    const otherQuestion = findQuestion(otherId);
    await program.methods
      .createQuestion(otherId, "Câu hỏi phụ", outcomes, new BN(closeTime))
      .accounts({ question: otherQuestion, authority })
      .rpc();
    try {
      await program.methods
        .predict(5, new BN(100))
        .accounts({ question: otherQuestion, user: alice.publicKey })
        .signers([alice])
        .rpc();
      expect.fail("choice ngoài danh sách phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Lựa chọn không tồn tại");
    }
  });
```

Câu hỏi phụ dùng cho các test lỗi để không đụng vào Position của câu hỏi chính. Chạy `anchor test`: `6 passing`.

### 3o. Test không đủ điểm

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối dùng quá số điểm đang có", async () => {
    const otherQuestion = findQuestion(questionId.addn(3));
    try {
      await program.methods
        .predict(0, new BN(5000))
        .accounts({ question: otherQuestion, user: alice.publicKey })
        .signers([alice])
        .rpc();
      expect.fail("dùng quá điểm phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Không đủ điểm giả lập");
    }
    const player = await program.account.player.fetch(findPlayer(alice.publicKey));
    expect(player.points.toNumber()).to.equal(700);
  });
```

Chạy `anchor test`: `7 passing`.

### 3p. Test dự đoán lần hai

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối dự đoán lần hai trên cùng câu hỏi", async () => {
    try {
      await program.methods
        .predict(1, new BN(100))
        .accounts({ question, user: alice.publicKey })
        .signers([alice])
        .rpc();
      expect.fail("position đã tồn tại");
    } catch (error) {
      expect(String(error)).to.contain("already in use");
    }
    const position = await program.account.position.fetch(findPosition(question, alice.publicKey));
    expect(position.choice).to.equal(0);
  });
```

Lỗi đến từ System Program khi `init` gặp account đã tồn tại, nên chuỗi là `already in use` chứ không phải lỗi của `ForecastError`. Chạy `anchor test`: `8 passing`.

<a id="fc-4"></a>
## Bước 4 — Resolve

**Khái niệm:** [resolve](./lessons.md#145-resolve) · [state machine](./lessons.md#state-machine)

### 4a. Danh sách account và lỗi của `resolve`

**Code 1 — chèn ngay trên `#[account]` của `Question`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "before-question-state"} -->
```rust
#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(mut, has_one = authority @ ForecastError::Unauthorized)]
    pub question: Account<'info, Question>,
    pub authority: Signer<'info>,
}

```

**Code 2 — trong `pub enum ForecastError`, chèn ngay trên dấu `}` cuối file:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-file-block"} -->
```rust
    #[msg("Chỉ authority của câu hỏi được resolve")]
    Unauthorized,
    #[msg("Câu hỏi chưa đóng nên chưa resolve được")]
    QuestionStillOpen,
    #[msg("Câu hỏi đã được resolve")]
    AlreadyResolved,
```

Chạy `anchor build`: build được.

### 4b. `resolve`

**Trong `pub mod forecasting`, chèn ngay trên dấu `}` đóng module (dưới `predict`), cách một dòng trống:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-program"} -->
```rust
    pub fn resolve(ctx: Context<Resolve>, outcome: u8) -> Result<()> {
        let question = &mut ctx.accounts.question;
        let now = Clock::get()?.unix_timestamp;
        require!(
            now >= question.close_time,
            ForecastError::QuestionStillOpen
        );
        require!(
            question.resolved_outcome.is_none(),
            ForecastError::AlreadyResolved
        );
        require!(
            (outcome as usize) < question.outcomes.len(),
            ForecastError::InvalidChoice
        );
        question.resolved_outcome = Some(outcome);
        Ok(())
    }
```

Bốn điều kiện của lesson 14.5: đúng resolver (`has_one`), sau giờ đóng, đúng một lần, outcome hợp lệ. Chạy `anchor build`: build sạch.

### 4c. Test resolve bởi ví lạ

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối ví khác authority resolve", async () => {
    try {
      await program.methods
        .resolve(0)
        .accounts({ question, authority: bob.publicKey })
        .signers([bob])
        .rpc();
      expect.fail("ví lạ resolve phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Chỉ authority của câu hỏi được resolve");
    }
  });
```

Chạy `anchor test`: `9 passing`.

### 4d. Test resolve khi còn mở

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối resolve trước giờ đóng", async () => {
    try {
      await program.methods.resolve(0).accounts({ question, authority }).rpc();
      expect.fail("resolve khi còn mở phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Câu hỏi chưa đóng nên chưa resolve được");
    }
  });
```

Chạy `anchor test`: `10 passing`.

### 4e. Chờ qua giờ đóng, test dự đoán muộn

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối dự đoán sau giờ đóng", async () => {
    const waitMs = (closeTime + 2) * 1000 - Date.now();
    await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 0)));
    const otherQuestion = findQuestion(questionId.addn(3));
    try {
      await program.methods
        .predict(0, new BN(100))
        .accounts({ question: otherQuestion, user: bob.publicKey })
        .signers([bob])
        .rpc();
      expect.fail("dự đoán sau close_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Câu hỏi đã đóng, không nhận dự đoán");
    }
  });
```

Test chờ đến 2 giây sau `closeTime` rồi mới gửi. Từ test này trở đi, cả hai câu hỏi đã đóng. Chạy `anchor test`: `11 passing`, test này mất khoảng 10–15 giây.

### 4f. Test resolve đúng một lần

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("resolve đúng một lần", async () => {
    await program.methods.resolve(0).accounts({ question, authority }).rpc();
    try {
      await program.methods.resolve(1).accounts({ question, authority }).rpc();
      expect.fail("resolve lần hai phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Câu hỏi đã được resolve");
    }
    const state = await program.account.question.fetch(question);
    expect(state.resolvedOutcome).to.equal(0);
  });
```

Chạy `anchor test`: `12 passing`. Program và test giờ giống `checkpoint-2`.

<a id="fc-5"></a>
## Bước 5 — Claim

**Khái niệm:** [claim score](./lessons.md#146-claim-score)

### 5a. Danh sách account và lỗi của `claim`

**Code 1 — chèn ngay trên `#[account]` của `Question`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "before-question-state"} -->
```rust
#[derive(Accounts)]
pub struct Claim<'info> {
    pub question: Account<'info, Question>,
    #[account(
        mut,
        seeds = [b"player", user.key().as_ref()],
        bump = player.bump
    )]
    pub player: Account<'info, Player>,
    pub user: Signer<'info>,
}

```

**Code 2 — trong `pub enum ForecastError`, chèn ngay trên dấu `}` cuối file:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-file-block"} -->
```rust
    #[msg("Câu hỏi chưa có kết quả")]
    NotResolved,
    #[msg("Position này đã claim")]
    AlreadyClaimed,
```

Chạy `anchor build`: build được.

### 5b. Position trong `Claim`

**Trong `pub struct Claim`, chèn ngay dưới dòng `pub player: Account<'info, Player>,`:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "after", "scope": "pub struct Claim<'info> {", "anchor": "    pub player: Account<'info, Player>,"} -->
```rust
    #[account(
        mut,
        seeds = [b"position", question.key().as_ref(), user.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
```

Seeds buộc Position phải thuộc đúng câu hỏi và đúng ví đang ký; không ai claim hộ hay claim Position của câu hỏi khác. Chạy `anchor build`: build được.

### 5c. `claim`

**Trong `pub mod forecasting`, chèn ngay trên dấu `}` đóng module (dưới `resolve`), cách một dòng trống:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "end-of-program"} -->
```rust
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let outcome = ctx
            .accounts
            .question
            .resolved_outcome
            .ok_or(ForecastError::NotResolved)?;
        let position = &mut ctx.accounts.position;
        require!(!position.claimed, ForecastError::AlreadyClaimed);
        position.claimed = true;
        todo!("trả điểm và cộng score")
    }
```

Chạy `anchor build`: build được, cảnh báo `unused variable: outcome` vì bước sau mới dùng.

### 5d. Trả điểm và cộng score

**Xóa dòng `todo!("trả điểm và cộng score")`, để một dòng trống rồi gõ:**

<!-- step: {"file": "programs/forecasting/src/lib.rs", "mode": "replace-todo", "blank_before": true} -->
```rust
        let player = &mut ctx.accounts.player;
        player.points = player
            .points
            .checked_add(position.points)
            .ok_or(ForecastError::MathOverflow)?;
        if position.choice == outcome {
            player.score = player
                .score
                .checked_add(position.points)
                .ok_or(ForecastError::MathOverflow)?;
        }
        Ok(())
```

Công thức điểm cố định: điểm đã khóa luôn được trả về `points`; đoán đúng thì `score` cộng đúng số điểm đã khóa, đoán sai cộng 0. Không ai mất điểm cho người khác, nên đây không phải cơ chế cá cược. Chạy `anchor build`: build sạch. Program giờ giống `final`.

### 5e. Test claim trước khi có kết quả

**Chèn ngay trên dòng `it("từ chối dự đoán sau giờ đóng"`** (test này phải chạy khi câu hỏi chưa resolve):

<!-- step: {"file": "tests/forecasting.ts", "mode": "before", "anchor": "  it(\"từ chối dự đoán sau giờ đóng\", async () => {"} -->
```ts
  it("từ chối claim trước khi có kết quả", async () => {
    try {
      await program.methods
        .claim()
        .accounts({ question, user: alice.publicKey })
        .signers([alice])
        .rpc();
      expect.fail("claim trước resolve phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Câu hỏi chưa có kết quả");
    }
  });

```

Chạy `anchor test`: `13 passing`.

### 5f. Test claim đúng công thức

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("claim trả điểm và cộng score cho dự đoán đúng", async () => {
    for (const user of [alice, bob]) {
      await program.methods
        .claim()
        .accounts({ question, user: user.publicKey })
        .signers([user])
        .rpc();
    }

    const winner = await program.account.player.fetch(findPlayer(alice.publicKey));
    const other = await program.account.player.fetch(findPlayer(bob.publicKey));
    expect(winner.points.toNumber()).to.equal(1000);
    expect(winner.score.toNumber()).to.equal(300);
    expect(other.points.toNumber()).to.equal(1000);
    expect(other.score.toNumber()).to.equal(0);
  });
```

Chạy `anchor test`: `14 passing`.

### 5g. Test claim hai lần

**Thêm vào cuối `describe`:**

<!-- step: {"file": "tests/forecasting.ts", "mode": "end-of-describe"} -->
```ts

  it("từ chối claim hai lần", async () => {
    // Chờ blockhash mới để transaction này khác hẳn transaction claim ở test trước.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await program.methods
        .claim()
        .accounts({ question, user: alice.publicKey })
        .signers([alice])
        .rpc();
      expect.fail("claim lần hai phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Position này đã claim");
    }
    const winner = await program.account.player.fetch(findPlayer(alice.publicKey));
    expect(winner.score.toNumber()).to.equal(300);
  });
```

Lần claim thứ hai giống hệt lần claim của Alice ở test trước. Nếu gửi trong cùng blockhash, hai transaction trùng từng byte, có cùng chữ ký, và validator từ chối với `This transaction has already been processed` trước khi program kịp chạy; chờ 1 giây để có blockhash mới thì program mới thật sự kiểm tra `claimed`. Chạy `anchor test`: `15 passing`. `tests/forecasting.ts` giờ giống `final`.

<a id="fc-6"></a>
## Bước 6 — Leaderboard

**Khái niệm:** [leaderboard](./lessons.md#147-leaderboard)

Leaderboard đọc thẳng các account `Player` trên chain, nên claim trên chain vẫn là nguồn sự thật; phần xếp hạng là hàm thuần TypeScript, test được không cần validator.

### 6a. Hàm xếp hạng

**Tạo file mới `app/leaderboard.ts`:**

<!-- step: {"file": "app/leaderboard.ts", "mode": "replace"} -->
```ts
export type PlayerRow = { user: string; score: number; points: number };

export function rankPlayers(rows: PlayerRow[], page: number, pageSize: number) {
  const sorted = [...rows].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.user < b.user ? -1 : a.user > b.user ? 1 : 0;
  });
  const start = (page - 1) * pageSize;
  return sorted
    .slice(start, start + pageSize)
    .map((row, index) => ({ rank: start + index + 1, ...row }));
}
```

Tie-breaker: cùng `score` thì xếp theo địa chỉ ví tăng dần, so bằng `<` để không phụ thuộc ngôn ngữ của máy. Chạy `pnpm exec tsc --noEmit -p tsconfig.json`: không lỗi.

### 6b. Test xếp hạng ổn định

**Tạo file mới `tests/leaderboard.ts`:**

<!-- step: {"file": "tests/leaderboard.ts", "mode": "replace"} -->
```ts
import { expect } from "chai";
import { rankPlayers } from "../app/leaderboard";

describe("leaderboard", () => {
  const rows = [
    { user: "Cxyz", score: 300, points: 1000 },
    { user: "Aabc", score: 300, points: 1000 },
    { user: "Bdef", score: 500, points: 900 },
  ];

  it("xếp theo score rồi theo địa chỉ, không phụ thuộc thứ tự đầu vào", () => {
    const first = rankPlayers(rows, 1, 10).map((row) => row.user);
    const second = rankPlayers([...rows].reverse(), 1, 10).map((row) => row.user);
    expect(first).to.deep.equal(["Bdef", "Aabc", "Cxyz"]);
    expect(second).to.deep.equal(first);
  });
});
```

Chạy `anchor test`: `16 passing` (15 test forecasting + 1 test leaderboard).

### 6c. Test chia trang

**Thêm vào cuối `describe` của `tests/leaderboard.ts`:**

<!-- step: {"file": "tests/leaderboard.ts", "mode": "end-of-describe"} -->
```ts

  it("chia trang và giữ đúng hạng", () => {
    const page2 = rankPlayers(rows, 2, 2);
    expect(page2).to.deep.equal([{ rank: 3, user: "Cxyz", score: 300, points: 1000 }]);
  });
```

Chạy `anchor test`: `17 passing`.

### 6d. Script in leaderboard

```bash
pnpm add -D tsx@4.23.15
```

**Tạo file mới `app/show-leaderboard.ts`:**

<!-- step: {"file": "app/show-leaderboard.ts", "mode": "replace"} -->
```ts
import * as anchor from "@anchor-lang/core";
import { rankPlayers } from "./leaderboard";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program: any = anchor.workspace.forecasting;

  const accounts = await program.account.player.all();
  const rows = accounts.map((item: any) => ({
    user: item.account.user.toBase58(),
    score: item.account.score.toNumber(),
    points: item.account.points.toNumber(),
  }));
}

main();
```

`program.account.player.all()` lấy mọi account `Player` của program qua RPC `getProgramAccounts`. Chạy `pnpm exec tsc --noEmit -p tsconfig.json`: không lỗi (có thể có cảnh báo biến `rows` chưa dùng trong editor).

### 6e. In bảng xếp hạng kèm disclaimer

**Trong `main`, chèn ngay dưới `}));` của `rows`, cách một dòng trống:**

<!-- step: {"file": "app/show-leaderboard.ts", "mode": "after", "anchor": "  }));", "blank_before": true} -->
```ts
  console.log("ĐIỂM GIẢ LẬP — KHÔNG PHẢI TIỀN THẬT");
  for (const row of rankPlayers(rows, 1, 10)) {
    console.log(`#${row.rank} ${row.user} score=${row.score} points=${row.points}`);
  }
```

**Trong `Anchor.toml`, section `[scripts]`, thêm một dòng dưới dòng `test = ...`:**

```toml
leaderboard = "pnpm exec tsx app/show-leaderboard.ts"
```

`anchor run leaderboard` chạy script với `ANCHOR_PROVIDER_URL` và `ANCHOR_WALLET` lấy từ `Anchor.toml`. Script cần một cluster đang chạy có dữ liệu, nên chạy nó ở bước 7 trên Devnet. Chạy `pnpm exec tsc --noEmit -p tsconfig.json`: không lỗi.

<a id="fc-7"></a>
## Bước 7 — Devnet và leaderboard thật

**Khái niệm:** [Module 6 lesson 6.9](../module-06-voting/lessons.md#69-devnet) · [Module 1 lesson 1.4–1.5](../module-01-orientation/lessons.md#14-deploy--upgrade-program-on-devnet)

```bash
anchor keys list
```

Trong `Anchor.toml`, giữ `[programs.localnet]` và thêm ngay sau nó (thay `YOUR_PROGRAM_ID` bằng địa chỉ vừa đọc):

```toml
[programs.devnet]
forecasting = "YOUR_PROGRAM_ID"
```

Trong `[provider]`, đổi `cluster = "localnet"` thành `cluster = "devnet"`, giữ wallet học tập. Từ giờ chạy test local bằng `anchor test --provider.cluster localnet`.

```bash
anchor build
solana config get
solana balance --url devnet
```

Solana CLI phải trỏ Devnet, đúng wallet học tập và có ít nhất 3 Devnet SOL (deploy khoảng 1,5 SOL tiền rent cho program); thiếu thì lấy thêm ở [faucet chính thức](https://faucet.solana.com/). Deploy, chạy test trên Devnet rồi in leaderboard:

```bash
anchor program deploy --provider.cluster devnet
anchor test --provider.cluster devnet --skip-deploy
anchor run leaderboard --provider.cluster devnet
```

Mỗi lần chạy test trên Devnet tạo hai người chơi mới, nên leaderboard có thêm một người `score=300` (Alice) và một người `score=0` (Bob). Dòng đầu luôn là `ĐIỂM GIẢ LẬP — KHÔNG PHẢI TIỀN THẬT`.

## Đối chiếu

So `programs/forecasting/src/lib.rs`, `tests/forecasting.ts`, `tests/leaderboard.ts`, `app/leaderboard.ts` và `app/show-leaderboard.ts` của bạn với [final](../../projects/forecasting-app/final). Khác biệt hợp lệ duy nhất là Program ID trong `declare_id!` và `Anchor.toml`.

Chưa có test: câu hỏi quá dài, nhãn lựa chọn rỗng, đặt 0 điểm và resolve outcome ngoài danh sách. Thử tự viết từng test, cần thấy đúng lời nhắn trong `ForecastError`.
