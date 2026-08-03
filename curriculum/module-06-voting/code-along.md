# Voting App — Code-along từng bước

Bài này viết lại [Voting App](../../projects/voting-app/README.md) từ một project trống, theo đúng thứ tự video Module 6. Mỗi bước gõ một đoạn ngắn rồi build hoặc test ngay. Bước cuối ra đúng code `final`; `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần làm xong [Module 1 lesson 1.3](../module-01-orientation/lessons.md#13-your-first-anchor-project) (toolchain, wallet học tập) và Module 4–5 trước.

<a id="vote-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học, cạnh `hello-solana` của Module 1. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs
cd ~/code/bootcamp-labs
anchor init voting --template single --package-manager pnpm --test-template mocha --no-install
cd voting
```

`--template single` để cả program nằm trong một file `programs/voting/src/lib.rs`. Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/voting`, nơi có `Anchor.toml`.

Khóa phiên bản như Module 1:

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
- `anchor test` chạy Surfpool, mà Surfpool chỉ cấp SOL cho `~/.config/solana/id.json`. Lấy địa chỉ wallet học tập bằng `solana address -k ~/.config/solana/bootcamp-devnet.json`, rồi thêm vào cuối `Anchor.toml` (thay `ĐỊA_CHỈ_WALLET`):

  ```toml
  [surfpool]
  airdrop_addresses = ["ĐỊA_CHỈ_WALLET"]
  ```
- Trong `programs/voting/Cargo.toml`, đặt `anchor-lang = "=1.2.1"`.
- Trong `package.json`, đặt `@anchor-lang/core` thành `"1.2.1"` và `mocha` thành `"^11.7.5"`. Mocha 9 của template nạp file test dưới dạng ES module trên Node 24, khi đó `anchor.BN` là `undefined`.

```bash
pnpm install
anchor keys sync
anchor build
```

`anchor keys sync` ghi Program ID của máy bạn vào `declare_id!` và `Anchor.toml`. Build xong không lỗi là được; program mẫu (counter) sẽ được thay ở bước 1.

<a id="vote-1"></a>
## Bước 1 — Ba account lưu dữ liệu

**Khái niệm:** [`#[account]`, space](./lessons.md#62-state-design) · [schema xuyên suốt](./lessons.md#schema-xuyên-suốt)

### 1a. Khung program

**Thay toàn bộ `programs/voting/src/lib.rs`** bằng đoạn dưới. Dòng `declare_id!` giữ nguyên địa chỉ trong file của bạn, không chép địa chỉ mẫu.

<!-- file: programs/voting/src/lib.rs; mode: replace -->
```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod voting {
    use super::*;
}
```

Chạy `anchor build`: build được, có cảnh báo `unused import` cho `use super::*` vì program chưa có instruction.

### 1b. Poll

**Thêm vào cuối file:**

<!-- file: programs/voting/src/lib.rs; mode: append -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub authority: Pubkey,
    pub poll_id: u64,
    #[max_len(64)]
    pub title: String,
    pub start_time: i64,
    pub end_time: i64,
    pub candidate_count: u16,
    pub bump: u8,
}

impl Poll {
    pub const MAX_TITLE_LEN: usize = 64;
}
```

- `#[account]` đánh dấu struct là dữ liệu của một account; Anchor thêm 8 byte discriminator ở đầu.
- `#[derive(InitSpace)]` tự tính số byte vào `Poll::INIT_SPACE`; `#[max_len(64)]` cho biết `title` tối đa 64 byte.
- `MAX_TITLE_LEN` dùng để kiểm tra input ở bước 2. Poll tốn 8 + 32 + 8 + (4 + 64) + 8 + 8 + 2 + 1 = 135 byte.

### 1c. Candidate

**Thêm vào cuối file:**

<!-- file: programs/voting/src/lib.rs; mode: append -->
```rust

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    pub poll: Pubkey,
    pub candidate_id: u16,
    #[max_len(32)]
    pub name: String,
    pub votes: u64,
    pub bump: u8,
}

impl Candidate {
    pub const MAX_NAME_LEN: usize = 32;
}
```

Field `poll` ghi Poll mà candidate thuộc về; bước 4 dùng nó để chặn candidate của poll khác.

### 1d. VoteReceipt

**Thêm vào cuối file:**

<!-- file: programs/voting/src/lib.rs; mode: append -->
```rust

#[account]
#[derive(InitSpace)]
pub struct VoteReceipt {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub candidate: Pubkey,
    pub bump: u8,
}
```

Chạy `anchor build`: build được, vẫn còn cảnh báo `unused import`.

<a id="vote-2"></a>
## Bước 2 — Tạo poll

**Khái niệm:** [PDA design](./lessons.md#63-pda-design) · [initialize poll](./lessons.md#64-initialize-poll)

### 2a. Danh sách account của `initialize_poll`

**Chèn ngay sau dấu `}` đóng `pub mod voting`**, trước `#[account]` của `Poll`:

<!-- file: programs/voting/src/lib.rs; mode: after-program -->
```rust

/// Poll PDA gồm authority trong seeds: mỗi authority có namespace `poll_id` riêng,
/// nên không ai chiếm trước `poll_id` của người khác.
#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Poll::INIT_SPACE,
        seeds = [b"poll", authority.key().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

- `#[instruction(poll_id: u64)]` lấy tham số đầu của instruction để dùng trong `seeds`.
- `init, payer, space` tạo account mới, authority trả rent. `seeds` + `bump` làm Poll thành PDA `["poll", authority, poll_id]`.

### 2b. Lỗi của `initialize_poll`

**Thêm vào cuối file:**

<!-- file: programs/voting/src/lib.rs; mode: append -->
```rust

#[error_code]
pub enum VotingError {
    #[msg("Tiêu đề poll không được để trống")]
    EmptyTitle,
    #[msg("Tiêu đề poll dài hơn 64 bytes")]
    TitleTooLong,
    #[msg("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc")]
    InvalidTimeWindow,
}
```

### 2c. Kiểm tra input

**Trong `pub mod voting`, chèn ngay dưới dòng `use super::*;`** (để một dòng trống giữa hai phần):

<!-- file: programs/voting/src/lib.rs; mode: in-program -->
```rust

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        title: String,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        require!(!title.trim().is_empty(), VotingError::EmptyTitle);
        require!(
            title.len() <= Poll::MAX_TITLE_LEN,
            VotingError::TitleTooLong
        );
        require!(start_time < end_time, VotingError::InvalidTimeWindow);
        todo!("ghi state vào Poll")
    }
```

Chạy `anchor build`: build được, có cảnh báo `unused variable` cho `ctx` và `poll_id`.

### 2d. Ghi state

**Thay dòng `todo!("ghi state vào Poll")`** bằng:

<!-- file: programs/voting/src/lib.rs; mode: replace-todo -->
```rust

        let poll = &mut ctx.accounts.poll;
        poll.authority = ctx.accounts.authority.key();
        poll.poll_id = poll_id;
        poll.title = title;
        poll.start_time = start_time;
        poll.end_time = end_time;
        poll.candidate_count = 0;
        poll.bump = ctx.bumps.poll;
        Ok(())
```

Chạy `anchor build`: build sạch. Hàm `initialize_poll` giờ giống `checkpoint-1`.

### 2e. Khung test

**Thay toàn bộ `tests/voting.ts`** bằng:

<!-- file: tests/voting.ts; mode: replace -->
```ts
import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/voting.ts).
  const program: any = anchor.workspace.voting;
  const authority = provider.wallet.publicKey;
  const pollId = new anchor.BN(Date.now());
  const now = Math.floor(Date.now() / 1000);
  const startTime = new anchor.BN(now + 4);
  const endTime = new anchor.BN(now + 600);
});
```

Poll mở sau 4 giây để bước 4 thử được cả vote quá sớm lẫn vote đúng giờ. Chạy `anchor test`: `0 passing`.

### 2f. Test tạo poll

**Trong `describe`, chèn ngay dưới dòng `const endTime = ...`:**

<!-- file: tests/voting.ts; mode: after-endTime -->
```ts

  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), provider.wallet.publicKey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );

  it("tạo poll và candidate đúng PDA", async () => {
    await program.methods
      .initializePoll(pollId, "Solana Bootcamp", startTime, endTime)
      .accounts({ poll, authority })
      .rpc();

    const pollState = await program.account.poll.fetch(poll);
    expect(pollState.title).to.equal("Solana Bootcamp");
  });
```

Seeds bên TypeScript phải khớp từng byte với `seeds` bên Rust: `"poll"`, ví authority, `poll_id` 8 byte little-endian. Test này thêm phần candidate ở bước 3. Chạy `anchor test`: `1 passing`.

### 2g. Test time window sai

**Chèn ngay trên dòng `it("tạo poll và candidate đúng PDA"`:**

<!-- file: tests/voting.ts; mode: before-first-test -->
```ts
  function findPoll(id: anchor.BN) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), authority.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];
  }

```

**Thêm vào cuối `describe`, trước `});` cuối file:**

<!-- file: tests/voting.ts; mode: end-of-describe -->
```ts

  it("từ chối time window không hợp lệ", async () => {
    const badPollId = pollId.addn(1);
    const badPoll = findPoll(badPollId);
    try {
      await program.methods
        .initializePoll(badPollId, "Sai giờ", endTime, startTime)
        .accounts({ poll: badPoll, authority })
        .rpc();
      expect.fail("start_time >= end_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
    }
    expect(await program.account.poll.fetchNullable(badPoll)).to.equal(null);
  });
```

`fetchNullable` trả `null` khi account không tồn tại: transaction lỗi thì Poll không được tạo. Chạy `anchor test`: `2 passing`.

<a id="vote-3"></a>
## Bước 3 — Thêm candidate

**Khái niệm:** [add candidate](./lessons.md#65-add-candidate)

### 3a. Account của `add_candidate`, phần Poll

**Chèn ngay sau `}` đóng struct `InitializePoll`:**

<!-- file: programs/voting/src/lib.rs; mode: after-InitializePoll -->
```rust

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_id: u16)]
pub struct AddCandidate<'info> {
    #[account(
        mut,
        seeds = [b"poll", authority.key().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump = poll.bump,
        has_one = authority
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}
```

`has_one = authority` so `poll.authority` với ví đang ký: chỉ người tạo poll mới thêm được candidate. `Sysvar<Clock>` cho handler đọc giờ của chain. Chạy `anchor build`.

### 3b. Phần Candidate

**Trong `AddCandidate`, chèn ngay dưới dòng `pub poll: Account<'info, Poll>,`:**

<!-- file: programs/voting/src/lib.rs; mode: after-AddCandidate-poll -->
```rust
    #[account(
        init,
        payer = authority,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [b"candidate", poll.key().as_ref(), candidate_id.to_le_bytes().as_ref()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
```

Seeds có địa chỉ Poll nên candidate gắn với đúng một poll; gửi lại `candidate_id` cũ thì `init` thất bại. Chạy `anchor build`.

### 3c. Lỗi của `add_candidate`

**Trong `VotingError`, chèn ngay dưới dòng `InvalidTimeWindow,`:**

<!-- file: programs/voting/src/lib.rs; mode: after-InvalidTimeWindow -->
```rust
    #[msg("Poll đã bắt đầu nên không thể thêm candidate")]
    PollAlreadyStarted,
    #[msg("Tên candidate không được để trống")]
    EmptyCandidateName,
    #[msg("Tên candidate dài hơn 32 bytes")]
    CandidateNameTooLong,
    #[msg("Phép tính bị overflow")]
    Overflow,
```

### 3d. Kiểm tra giờ và tên

**Trong `pub mod voting`, chèn ngay sau `}` đóng hàm `initialize_poll`:**

<!-- file: programs/voting/src/lib.rs; mode: after-initialize_poll -->
```rust

    pub fn add_candidate(
        ctx: Context<AddCandidate>,
        _poll_id: u64,
        candidate_id: u16,
        name: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.clock.unix_timestamp < ctx.accounts.poll.start_time,
            VotingError::PollAlreadyStarted
        );
        require!(!name.trim().is_empty(), VotingError::EmptyCandidateName);
        require!(
            name.len() <= Candidate::MAX_NAME_LEN,
            VotingError::CandidateNameTooLong
        );
        todo!("ghi Candidate và tăng candidate_count")
    }
```

`_poll_id` có gạch dưới vì handler không dùng nó; tham số vẫn phải có để thứ tự khớp `#[instruction(poll_id, candidate_id)]`. Chạy `anchor build`: build được, có cảnh báo `unused variable` cho `candidate_id` (bước 3e dùng tới).

### 3e. Ghi Candidate

**Thay dòng `todo!("ghi Candidate và tăng candidate_count")`** bằng:

<!-- file: programs/voting/src/lib.rs; mode: replace-todo -->
```rust

        let candidate = &mut ctx.accounts.candidate;
        candidate.poll = ctx.accounts.poll.key();
        candidate.candidate_id = candidate_id;
        candidate.name = name;
        candidate.votes = 0;
        candidate.bump = ctx.bumps.candidate;

        let poll = &mut ctx.accounts.poll;
        poll.candidate_count = poll
            .candidate_count
            .checked_add(1)
            .ok_or(VotingError::Overflow)?;
        Ok(())
```

`checked_add` trả `None` khi tràn số; `ok_or` đổi `None` thành lỗi `Overflow` và `?` trả lỗi đó ra ngoài. Chạy `anchor build`: hàm giống `checkpoint-2`.

### 3f. Test thêm candidate

**Trong `tests/voting.ts`, chèn `const candidateId = 1;` ngay dưới dòng `const pollId = ...`.**

**Chèn ngay dưới khối `const [poll] = ...;`:**

<!-- file: tests/voting.ts; mode: after-poll-pda -->
```ts
  const [candidate] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("candidate"),
      poll.toBuffer(),
      new anchor.BN(candidateId).toArrayLike(Buffer, "le", 2),
    ],
    program.programId,
  );
```

**Trong test `tạo poll và candidate đúng PDA`, chèn ngay sau `.rpc();` đầu tiên** (để một dòng trống trước và sau):

<!-- file: tests/voting.ts; mode: after-initialize-rpc -->
```ts

    await program.methods
      .addCandidate(pollId, candidateId, "Candidate A")
      .accounts({ poll, candidate, authority })
      .rpc();
```

**Thay hai dòng cuối của test đó** (`const pollState ...` và `expect(pollState.title)...`) bằng:

<!-- file: tests/voting.ts; mode: replace-create-asserts -->
```ts
    const pollState = await program.account.poll.fetch(poll);
    const candidateState = await program.account.candidate.fetch(candidate);
    expect(pollState.title).to.equal("Solana Bootcamp");
    expect(pollState.candidateCount).to.equal(candidateId);
    expect(candidateState.poll.equals(poll)).to.equal(true);
    expect(candidateState.votes.toNumber()).to.equal(0);
```

`candidate_id` là `u16` nên seed dài 2 byte. Chạy `anchor test`: `2 passing`.

### 3g. Test sai authority

**Chèn ngay dưới `}` đóng hàm `findPoll`:**

<!-- file: tests/voting.ts; mode: after-findPoll -->
```ts

  function findCandidate(pollAddress: anchor.web3.PublicKey, id: number) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), pollAddress.toBuffer(), new anchor.BN(id).toArrayLike(Buffer, "le", 2)],
      program.programId,
    )[0];
  }

  async function fund(to: anchor.web3.PublicKey) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({ fromPubkey: authority, toPubkey: to, lamports: 10_000_000 }),
    );
    await provider.sendAndConfirm(tx);
  }
```

`fund` chuyển 0.01 SOL từ ví của test sang một ví khác, để ví đó trả được rent.

**Chèn ngay sau `});` đóng test `tạo poll và candidate đúng PDA`:**

<!-- file: tests/voting.ts; mode: after-create-test -->
```ts

  it("từ chối ví khác authority thêm candidate", async () => {
    const stranger = anchor.web3.Keypair.generate();
    const strangerCandidate = findCandidate(poll, 2);
    await fund(stranger.publicKey);
    try {
      await program.methods
        .addCandidate(pollId, 2, "Candidate lạ")
        .accounts({ poll, candidate: strangerCandidate, authority: stranger.publicKey })
        .signers([stranger])
        .rpc();
      expect.fail("ví không phải authority phải bị từ chối");
    } catch (error) {
      expect(String(error)).to.match(/ConstraintSeeds|ConstraintHasOne/);
    }
    const pollState = await program.account.poll.fetch(poll);
    expect(pollState.candidateCount).to.equal(1);
  });
```

Ví lạ ký thay authority: seeds của Poll tính bằng ví lạ ra địa chỉ khác, Anchor từ chối trước khi handler chạy. Sau lỗi, `candidateCount` vẫn là 1. Chạy `anchor test`: `3 passing`.

<a id="vote-4"></a>
## Bước 4 — Vote và time window

**Khái niệm:** [vote](./lessons.md#66-vote) · [time errors](./lessons.md#67-time-errors)

### 4a. Account của `vote`, phần Poll

**Chèn ngay sau `}` đóng struct `AddCandidate`:**

<!-- file: programs/voting/src/lib.rs; mode: after-AddCandidate -->
```rust

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_id: u16)]
pub struct Vote<'info> {
    #[account(
        seeds = [b"poll", poll.authority.as_ref(), poll_id.to_le_bytes().as_ref()],
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}
```

Voter không phải authority, nên seed lấy `poll.authority` đã lưu trong Poll. Poll không `mut` vì vote không sửa Poll. Chạy `anchor build`.

### 4b. Phần Candidate

**Trong `Vote`, chèn ngay dưới dòng `pub poll: Account<'info, Poll>,`:**

<!-- file: programs/voting/src/lib.rs; mode: after-Vote-poll -->
```rust
    #[account(
        mut,
        seeds = [b"candidate", poll.key().as_ref(), candidate_id.to_le_bytes().as_ref()],
        bump = candidate.bump,
        has_one = poll
    )]
    pub candidate: Account<'info, Candidate>,
```

`has_one = poll` so `candidate.poll` với Poll gửi lên: candidate của poll khác bị từ chối. Chạy `anchor build`.

### 4c. Phần VoteReceipt

**Trong `Vote`, chèn ngay dưới dòng `pub candidate: Account<'info, Candidate>,`:**

<!-- file: programs/voting/src/lib.rs; mode: after-Vote-candidate -->
```rust
    #[account(
        init,
        payer = voter,
        space = 8 + VoteReceipt::INIT_SPACE,
        seeds = [b"vote", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,
```

Receipt nằm ở PDA `["vote", poll, voter]`. Vote lần hai thì địa chỉ này đã có account, `init` thất bại và cả transaction bị hủy. Chạy `anchor build`.

### 4d. Lỗi của `vote`

**Trong `VotingError`, chèn ngay dưới dòng `CandidateNameTooLong,`:**

<!-- file: programs/voting/src/lib.rs; mode: after-CandidateNameTooLong -->
```rust
    #[msg("Poll chưa bắt đầu")]
    PollNotStarted,
    #[msg("Poll đã kết thúc")]
    PollEnded,
```

### 4e. Kiểm tra giờ

**Trong `pub mod voting`, chèn ngay sau `}` đóng hàm `add_candidate`:**

<!-- file: programs/voting/src/lib.rs; mode: after-add_candidate -->
```rust

    pub fn vote(ctx: Context<Vote>, _poll_id: u64, _candidate_id: u16) -> Result<()> {
        let now = ctx.accounts.clock.unix_timestamp;
        require!(
            now >= ctx.accounts.poll.start_time,
            VotingError::PollNotStarted
        );
        require!(now < ctx.accounts.poll.end_time, VotingError::PollEnded);
        todo!("tăng votes và ghi VoteReceipt")
    }
```

Poll mở trong khoảng `start_time <= now < end_time`, giờ lấy từ `Clock` của chain. Chạy `anchor build`.

### 4f. Tăng phiếu và ghi receipt

**Thay dòng `todo!("tăng votes và ghi VoteReceipt")`** bằng:

<!-- file: programs/voting/src/lib.rs; mode: replace-todo -->
```rust

        let candidate = &mut ctx.accounts.candidate;
        candidate.votes = candidate
            .votes
            .checked_add(1)
            .ok_or(VotingError::Overflow)?;

        let receipt = &mut ctx.accounts.vote_receipt;
        receipt.poll = ctx.accounts.poll.key();
        receipt.voter = ctx.accounts.voter.key();
        receipt.candidate = candidate.key();
        receipt.bump = ctx.bumps.vote_receipt;
        Ok(())
```

Chạy `anchor build`. `lib.rs` giờ giống `final/programs/voting/src/lib.rs`, trừ `declare_id!`.

### 4g. Test vote quá sớm

**Chèn ngay dưới khối `const [candidate] = ...;`:**

<!-- file: tests/voting.ts; mode: after-candidate-pda -->
```ts
  const [voteReceipt] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), poll.toBuffer(), authority.toBuffer()],
    program.programId,
  );
```

**Thêm vào cuối `describe`:**

<!-- file: tests/voting.ts; mode: end-of-describe -->
```ts

  it("từ chối vote trước thời gian bắt đầu", async () => {
    try {
      await program.methods
        .vote(pollId, candidateId)
        .accounts({ poll, candidate, voteReceipt, voter: authority })
        .rpc();
      expect.fail("vote trước start_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Poll chưa bắt đầu");
    }
  });
```

Chạy `anchor test`: `4 passing`.

### 4h. Test vote đúng giờ

**Thêm vào cuối `describe`:**

<!-- file: tests/voting.ts; mode: end-of-describe -->
```ts

  it("vote đúng candidate và tạo receipt", async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await program.methods
      .vote(pollId, candidateId)
      .accounts({ poll, candidate, voteReceipt, voter: authority })
      .rpc();
    const state = await program.account.candidate.fetch(candidate);
    const receipt = await program.account.voteReceipt.fetch(voteReceipt);
    expect(state.votes.toNumber()).to.equal(1);
    expect(receipt.voter.equals(authority)).to.equal(true);
  });
```

Chờ 5 giây để qua `start_time`. Chạy `anchor test`: `5 passing`.

### 4i. Test vote trùng

**Thêm vào cuối `describe`:**

<!-- file: tests/voting.ts; mode: end-of-describe -->
```ts

  it("từ chối cùng wallet vote lần hai", async () => {
    try {
      await program.methods
        .vote(pollId, candidateId)
        .accounts({ poll, candidate, voteReceipt, voter: authority })
        .rpc();
      expect.fail("vote receipt đã tồn tại");
    } catch (error) {
      expect(String(error)).to.not.equal("");
    }
    const state = await program.account.candidate.fetch(candidate);
    expect(state.votes.toNumber()).to.equal(1);
  });
```

Lỗi đến từ `init` của receipt (account đã tồn tại), không phải `VotingError`. Sau lỗi, `votes` vẫn là 1. Chạy `anchor test`: `6 passing`.

<a id="vote-5"></a>
## Bước 5 — Các đường lỗi còn lại

**Khái niệm:** [tests](./lessons.md#68-tests) · [test matrix tối thiểu](./lessons.md#test-matrix-tối-thiểu)

### 5a. Candidate thuộc poll khác

**Chèn ngay trên dòng `it("vote đúng candidate và tạo receipt"`:**

<!-- file: tests/voting.ts; mode: before-vote-test -->
```ts
  it("từ chối candidate thuộc poll khác", async () => {
    const otherPollId = pollId.addn(2);
    const otherPoll = findPoll(otherPollId);
    const otherCandidate = findCandidate(otherPoll, candidateId);
    await program.methods
      .initializePoll(otherPollId, "Poll khác", endTime, endTime.addn(600))
      .accounts({ poll: otherPoll, authority })
      .rpc();
    await program.methods
      .addCandidate(otherPollId, candidateId, "Candidate B")
      .accounts({ poll: otherPoll, candidate: otherCandidate, authority })
      .rpc();
  });

```

Chạy `anchor test`: `7 passing` (test mới mới tạo poll thứ hai và candidate của nó).

### 5b. Vote bằng candidate đó

**Trong test `từ chối candidate thuộc poll khác`, chèn ngay sau `.rpc();` cuối cùng:**

<!-- file: tests/voting.ts; mode: end-of-other-poll-test -->
```ts

    try {
      await program.methods
        .vote(pollId, candidateId)
        .accounts({ poll, candidate: otherCandidate, voteReceipt, voter: authority })
        .rpc();
      expect.fail("candidate của poll khác phải bị từ chối");
    } catch (error) {
      expect(String(error)).to.match(/ConstraintSeeds|ConstraintHasOne/);
    }
    const otherState = await program.account.candidate.fetch(otherCandidate);
    expect(otherState.votes.toNumber()).to.equal(0);
```

Seeds của `candidate` tính bằng Poll thứ nhất nên không khớp candidate của poll thứ hai; nếu seeds khớp thì `has_one = poll` vẫn chặn. Chạy `anchor test`: `7 passing`.

### 5c. Thêm candidate sau giờ mở

**Thêm vào cuối `describe`:**

<!-- file: tests/voting.ts; mode: end-of-describe -->
```ts

  it("từ chối thêm candidate sau khi poll bắt đầu", async () => {
    const lateCandidate = findCandidate(poll, 2);
    try {
      await program.methods
        .addCandidate(pollId, 2, "Candidate muộn")
        .accounts({ poll, candidate: lateCandidate, authority })
        .rpc();
      expect.fail("thêm candidate sau start_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Poll đã bắt đầu nên không thể thêm candidate");
    }
    const pollState = await program.account.poll.fetch(poll);
    expect(pollState.candidateCount).to.equal(1);
  });
```

Chạy `anchor test`: `8 passing`. `tests/voting.ts` giờ giống `final/tests/voting.ts`.

Chưa có test: vote sau `end_time` (phải chờ hết time window) và tràn `votes` (`u64::MAX`). Thử tự viết: tạo poll đóng sau vài giây rồi vote sau khi đóng, cần thấy `Poll đã kết thúc`.

<a id="vote-6"></a>
## Bước 6 — Deploy Devnet

**Khái niệm:** [devnet](./lessons.md#69-devnet) · [Module 1 lesson 1.4–1.5](../module-01-orientation/lessons.md#14-deploy--upgrade-program-on-devnet)

```bash
anchor keys list
```

Trong `Anchor.toml`, giữ `[programs.localnet]` và thêm ngay sau nó (thay `YOUR_PROGRAM_ID` bằng địa chỉ vừa đọc):

```toml
[programs.devnet]
voting = "YOUR_PROGRAM_ID"
```

Trong `[provider]`, đổi `cluster = "localnet"` thành `cluster = "devnet"`, giữ wallet học tập. Kiểm tra cấu hình và balance:

```bash
anchor keys sync
anchor build
solana config get
solana balance --url devnet
```

Solana CLI phải trỏ Devnet, đúng wallet học tập và có Devnet SOL; thiếu thì lấy thêm ở [faucet chính thức](https://faucet.solana.com/). Deploy và kiểm tra (thay `YOUR_PROGRAM_ID`):

```bash
anchor program deploy --provider.cluster devnet
VOTING_PROGRAM_ID=YOUR_PROGRAM_ID
solana program show "$VOTING_PROGRAM_ID" --url devnet
```

`Authority` phải là wallet học tập. Chạy bộ test trên Devnet để tạo poll demo:

```bash
anchor test --provider.cluster devnet --skip-deploy
```

Cần thấy `8 passing`. Mở [Explorer Devnet](https://explorer.solana.com/?cluster=devnet), tìm Program ID và lưu link vài transaction (tạo poll, add candidate, vote). Mỗi lần chạy trên Devnet tạo account thật và tốn Devnet SOL; test thường ngày chạy `anchor test --provider.cluster localnet`.

<a id="vote-7"></a>
## Bước 7 — Xem frontend dùng IDL

**Khái niệm:** [frontend](./lessons.md#610-frontend)

[Voting Frontend](../../projects/voting-frontend/README.md) là project của Module 9; ở đây chỉ chạy thử bản `final` với program của bạn. Poll do bộ test tạo chỉ mở 10 phút, nên chạy lại test Devnet ngay trước khi vote. Thay `~/code/solana-bootcamp` bằng nơi bạn clone repo:

```bash
anchor test --provider.cluster devnet --skip-deploy
cp -R ~/code/solana-bootcamp/projects/voting-frontend/final ~/code/bootcamp-labs/voting-frontend
cd ~/code/bootcamp-labs/voting-frontend
cp ../voting/target/idl/voting.json src/idl/voting.json
pnpm install
VITE_RPC_URL=https://api.devnet.solana.com pnpm dev
```

Mở địa chỉ Vite in ra, trang phải ghi `Anchor mode: devnet`. Kết nối Phantom ở Devnet (có Devnet SOL), vote `Candidate A` của poll `Solana Bootcamp`: số phiếu tăng sau khi giao dịch được xác nhận và có link Explorer. Vote lần hai bằng cùng ví phải bị từ chối.
