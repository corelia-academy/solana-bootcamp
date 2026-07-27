# Script quay video — Module 5: Testing trên Solana

**Thời lượng đề xuất:** 55–70 phút (chia 3 phần nếu cần)
**Chuẩn bị trước khi bấm record:**

- Terminal 1: `projects/pda-counter/final/` — đã `anchor build` xong.
- Terminal 2: mở sẵn `curriculum/module-05-testing/lessons.md`, `test-matrix.md`, `lab/starter/pda-counter.ts`.
- Editor: mở song song `lab/starter/pda-counter.ts` và `lab/solution/pda-counter.ts` (che solution lại lúc quay).
- Trình duyệt: mở tab README Module 4 để show lại program đang được test.
- Xóa terminal, tắt notification, mute Slack/Telegram.

---

## 0. Intro (2–3 phút)

**On-camera / voice-over:**

> Chào cả nhà, đây là Module 5 của Solana Bootcamp — Testing.
>
> Ở Module 4 mình đã viết xong PDA Counter. Ở module này mình không viết thêm program mới. Mình sẽ dùng lại chính con Counter đó, và tập trung 100% vào một câu hỏi: **làm sao để tin rằng program của mình chạy đúng?**
>
> Sau video này bạn sẽ:
> 1. Biết chọn đúng tầng test — không phải cái gì cũng `anchor test`.
> 2. Viết được happy path và failure path đàng hoàng.
> 3. Assert đúng custom error và chứng minh state không đổi khi transaction lỗi.
> 4. Đọc được transaction log để debug khi test đỏ.
> 5. Setup CI tối thiểu cho project Solana.

**B-roll gợi ý:** show file tree `curriculum/module-05-testing/` để người xem biết bám vào đâu.

---

## 1. Vì sao Module 5 tách riêng (3 phút)

Điểm cần nhấn:

- Test không phải phần "làm cho vui". Trên Solana, một bug logic có thể mất tiền thật.
- Đa số bootcamp dạy testing bằng cách bảo `anchor test`. Đó là **một** trong bốn tầng. Dùng sai tầng thì test vừa chậm vừa không chứng minh được gì.
- Module này ép mình phải phân biệt: cái gì test bằng Rust unit, cái gì bằng LiteSVM, cái gì bằng Anchor TS, cái gì phải devnet.

**Câu chốt để nói to:**
> Test tốt không phải là test nhiều — mà là test đúng tầng, đúng invariant, và chứng minh được state không đổi khi lỗi.

---

## 2. Testing pyramid trên Solana (7–8 phút)

Mở `lessons.md` mục 5.1, share screen.

Giải thích từng tầng bằng ví dụ cụ thể:

| Tầng | Ví dụ mình nói |
| --- | --- |
| Rust unit | "`checked_add` overflow — không cần validator, chạy 5ms" |
| LiteSVM | "Sai owner của account — cần runtime, nhưng không cần deploy" |
| Anchor TS | "Full flow: derive PDA, gọi instruction, fetch account — cần local validator" |
| E2E devnet | "Wallet popup, sign tx từ Phantom — chỉ tầng này chứng minh được" |

**Quy tắc vàng đọc thành câu:**
> Chọn tầng thấp nhất có thể chứng minh yêu cầu.

Show 4 nhóm test tối thiểu cho một instruction — vẽ lên bảng hoặc đọc list:
1. happy path;
2. sai/thiếu authority;
3. sai quan hệ account (mint/owner/PDA);
4. boundary — 0, max, duplicate, biên thời gian.

**Chuyển cảnh:** "Giờ áp cái pyramid này lên PDA Counter thật."

---

## 3. Cấu trúc thư mục và naming (3 phút)

Show block cấu trúc trong `lessons.md` mục 5.2.

Nhấn 2 điểm:

- **Fixture tách khỏi test.** Wallet, PDA, ATA để trong `tests/fixtures/`. Test file chỉ chứa Arrange → Act → Assert.
- **Tên test theo behavior, không theo error code.** Nói to:
  > "`rejects duplicate vote receipt` tốt hơn `vote error 2`."
  Lý do: 6 tháng sau đọc lại, tên phải cho biết business invariant nào bị vi phạm, không phải index của error.

---

## 4. Live-coding: mở lab starter (2 phút)

Chuyển sang editor. Mở `curriculum/module-05-testing/lab/starter/pda-counter.ts`.

Nói:

> Đây là điểm xuất phát. Có sẵn helper `deriveCounter` và một test derive PDA đang xanh. Còn lại 5 TODO đang `skip`. Mình sẽ hoàn thiện từng cái, theo đúng test matrix.

Chạy lệnh baseline trong terminal:

```bash
cd projects/pda-counter/final
anchor test
```

Chờ output, chỉ vào test đang skip: "Đây là baseline. Xanh nhưng không chứng minh gì. Mình sẽ biến nó thành đen trước, rồi mới sửa để xanh lại — TDD style."

---

## 5. Điền test matrix trước khi code (4 phút)

Mở `test-matrix.md`. Điền live 3 dòng đầu tiên trên camera:

| Scenario | Tầng | Arrange | Action | Expected |
| --- | --- | --- | --- | --- |
| Initialize trùng PDA | Anchor TS | setup counter xong | gọi `initialize` lần 2 cùng owner | fail: `already in use` |
| Wrong owner update | Anchor TS | setup counter với owner A | gọi `increment` bằng attacker B | fail: `ConstraintSeeds`, value không đổi |
| Decrement khi bằng 0 | Anchor TS | init counter, value = 0 | gọi `decrement` | fail: `Underflow / 6001`, value vẫn 0 |

Nhấn:

> Điền matrix trước, code sau. Nếu chưa viết được "Expected" mà đã mở editor — nghĩa là chưa biết mình đang test cái gì.

---

## 6. TODO 1 — Happy path initialize (5 phút)

Bỏ `it.skip` đầu tiên. Vừa gõ vừa nói:

```ts
it("initialize lưu đúng owner và value = 0", async () => {
  const owner = anchor.web3.Keypair.generate();
  const counter = deriveCounter(owner.publicKey);

  // fund owner để trả rent + fee
  const sig = await provider.connection.requestAirdrop(
    owner.publicKey,
    anchor.web3.LAMPORTS_PER_SOL,
  );
  await provider.connection.confirmTransaction(sig, "confirmed");

  await program.methods
    .initialize()
    .accounts({ counter, owner: owner.publicKey })
    .signers([owner])
    .rpc();

  const state = await program.account.counter.fetch(counter);
  expect(state.owner.equals(owner.publicKey)).to.equal(true);
  expect(state.value.toNumber()).to.equal(0);
});
```

**Điểm giáo dục cần nhấn khi gõ:**

- Mỗi test dùng owner **mới** (`Keypair.generate()`) → không phụ thuộc thứ tự chạy.
- Airdrop phải `confirmTransaction`, không thì race condition.
- Assert **cả** `owner` và `value`, không chỉ "tx không throw".

Chạy `anchor test -- --grep "initialize lưu đúng"` để show test xanh riêng lẻ.

**Chuyển cảnh:** "Xanh rồi. Nhưng test xanh mà không có failure path thì vô nghĩa. Sang TODO 2."

---

## 7. Refactor thành fixture (3 phút)

Trước khi làm TODO 2, kéo phần setup ra fixture. Live-refactor:

```ts
const fund = async (wallet: anchor.web3.PublicKey) => {
  const sig = await provider.connection.requestAirdrop(
    wallet,
    anchor.web3.LAMPORTS_PER_SOL,
  );
  await provider.connection.confirmTransaction(sig, "confirmed");
};

const setupCounter = async () => {
  const owner = anchor.web3.Keypair.generate();
  const counter = deriveCounter(owner.publicKey);
  await fund(owner.publicKey);
  await program.methods
    .initialize()
    .accounts({ counter, owner: owner.publicKey })
    .signers([owner])
    .rpc();
  return { owner, counter };
};
```

Nhấn quy tắc từ lessons 5.5:

> Fixture lo cái lặp lại. Nhưng **action đang test** thì phải hiện rõ trong test — không được giấu vào helper kiểu `setupEverythingAndVote()`.

---

## 8. TODO 2 — Duplicate initialize thất bại (5 phút)

Viết helper `expectFailure` trước:

```ts
const expectFailure = async (action: Promise<unknown>, pattern: RegExp) => {
  try {
    await action;
    expect.fail("Transaction đáng lẽ phải thất bại");
  } catch (error) {
    expect(String(error)).to.match(pattern);
  }
};
```

Giải thích **vì sao cần `expect.fail`**: nếu tx không throw, `try` chạy tới cuối và test vẫn xanh — false positive kinh điển.

Test:

```ts
it("duplicate initialize thất bại", async () => {
  const { owner, counter } = await setupCounter();
  await expectFailure(
    program.methods
      .initialize()
      .accounts({ counter, owner: owner.publicKey })
      .signers([owner])
      .rpc(),
    /already in use|Allocate|custom program error/i,
  );
});
```

Chạy test. Nếu đỏ vì regex không match → mở log, đọc thông báo thật, sửa regex. Đây là **cơ hội dạy debug** — dừng lại nói:

> Lỗi này đến từ Solana runtime chứ không phải Anchor. Account đã tồn tại nên `Allocate` fail. Regex mình đưa 3 alternative để phòng thay đổi wording giữa version.

---

## 9. TODO 3 — Increment / decrement / reset (4 phút)

```ts
it("increment, decrement và reset đúng state", async () => {
  const { owner, counter } = await setupCounter();
  const accounts = { counter, owner: owner.publicKey };

  await program.methods.increment().accounts(accounts).signers([owner]).rpc();
  await program.methods.increment().accounts(accounts).signers([owner]).rpc();
  await program.methods.decrement().accounts(accounts).signers([owner]).rpc();

  expect(
    (await program.account.counter.fetch(counter)).value.toNumber(),
  ).to.equal(1);

  await program.methods.reset().accounts(accounts).signers([owner]).rpc();
  expect(
    (await program.account.counter.fetch(counter)).value.toNumber(),
  ).to.equal(0);
});
```

Nhấn:
- Đọc state ở **cuối chuỗi**, không kiểm giữa chừng (trừ khi test invariant giữa).
- 1 test = 1 kịch bản. Nếu muốn test riêng reset → tách test.

---

## 10. TODO 4 — Underflow: custom error + rollback (7 phút) 🎯 điểm quan trọng nhất

Đây là phần mình khuyên **dành nhiều thời gian nhất**, vì nó dạy 3 kỹ năng cùng lúc.

```ts
it("underflow trả custom error và rollback state", async () => {
  const { owner, counter } = await setupCounter();
  const before = await program.account.counter.fetch(counter);

  await expectFailure(
    program.methods
      .decrement()
      .accounts({ counter, owner: owner.publicKey })
      .signers([owner])
      .rpc(),
    /Underflow|Counter đang bằng 0|6001/,
  );

  const after = await program.account.counter.fetch(counter);
  expect(after.value.eq(before.value)).to.equal(true);
});
```

Dừng camera, dạy chậm 3 điểm:

1. **`before` snapshot.** Đọc state trước khi Act. Nếu không có `before`, không thể chứng minh "không đổi".
2. **Match cụ thể.** `/Underflow|6001/` — bám tên custom error hoặc code. Không match `/failed/i` vì nó khớp mọi lỗi.
3. **`after.value.eq(before.value)`.** Đây là câu chứng minh rollback. Đọc to:
   > Solana có tính atomic — tx fail thì mọi write bị revert. Nhưng đừng tin — hãy **chứng minh**.

**Bonus:** show `Errors.md` hoặc `lib.rs` của program để chỉ ra `#[error_code] Underflow = 6001`. Người học phải hiểu error code đến từ đâu.

---

## 11. TODO 5 — Wrong authority (6 phút)

```ts
it("wrong authority bị từ chối và rollback state", async () => {
  const { counter } = await setupCounter();
  const attacker = anchor.web3.Keypair.generate();
  await fund(attacker.publicKey);

  const before = await program.account.counter.fetch(counter);

  await expectFailure(
    program.methods
      .increment()
      .accounts({ counter, owner: attacker.publicKey })
      .signers([attacker])
      .rpc(),
    /ConstraintSeeds|seeds constraint/i,
  );

  const after = await program.account.counter.fetch(counter);
  expect(after.value.eq(before.value)).to.equal(true);
});
```

Dạy sự khác nhau **custom error vs constraint error**:

- `Underflow` — do handler của mình raise (`err!(...)`).
- `ConstraintSeeds` — do Anchor macro raise **trước khi vào handler**, vì PDA derive từ attacker key không match PDA đã lưu.

Nói:
> Đây là lý do tại sao PDA + `seeds` + `bump` là hàng rào authority ngon. Attacker ký transaction đàng hoàng, nhưng seeds không derive ra đúng PDA → Anchor chặn ngay ở constraint layer.

---

## 12. Debug transaction log (5 phút)

Chuyển terminal, cố ý phá 1 test cho đỏ — ví dụ đổi regex thành `/NonExistent/`.

Chạy `anchor test -- --grep "underflow"`.

Chỉ vào output, đọc theo thứ tự của lessons 5.7:

1. Instruction ngoài cùng — `decrement`.
2. Constraint nào chạy — `has_one`, `seeds`...
3. `Program log` cuối — thường có error message.
4. CPI — với Counter không có, nhưng với SPL Token thì cực quan trọng.
5. Custom error hex — `0x1771` = 6001.
6. Compute units — đọc để phát hiện logic bị lặp.

Nói câu này to:
> Đọc log từ trên xuống, không phải nhảy tới dòng "Error:" cuối cùng. Nguyên nhân gốc nằm ở dòng đầu tiên báo bất thường.

Show tip: `anchor test -- --grep "duplicate"` để chạy 1 test, giảm nhiễu.

---

## 13. LiteSVM là gì và khi nào dùng (3 phút)

Không code trong video này (để không lan man), chỉ giải thích.

Show block code Rust từ lessons 5.4. Nói:

> Khi cần test hàng nghìn scenario nhỏ (fuzz, invariant), khởi động validator quá chậm. LiteSVM chạy SVM in-process, mỗi test vài mili-giây. Điểm đánh đổi: không test được deploy flow thật.
>
> Bootcamp có ví dụ LiteSVM ở [Security CTF](../../exercises/security-ctf/). Sau module này bạn nên mở xem để so sánh trải nghiệm với Anchor TS.

---

## 14. Regression test từ bug/CTF (3 phút)

Nhấn Definition of done:

> Mỗi bug bạn fix trong đời — biến nó thành 1 test. Test đó phải **đỏ nếu bỏ bản vá**. Không có bước xác nhận này thì không phải regression test, chỉ là test bình thường.

Mở `debug-worksheet.md`, chỉ vào cuối:
> "Test có thất bại khi bỏ bản vá không?" — đây là câu hỏi bắt buộc.

---

## 15. CI tối thiểu (3 phút)

Show block bash trong lessons 5.8:

```bash
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
pnpm install --frozen-lockfile
anchor test
```

Nhấn 2 nguyên tắc:

1. **Rẻ trước, đắt sau.** `fmt` fail thì không cần chạy `anchor test` tốn 2 phút.
2. **Không cache `target/deploy`** làm nguồn sự thật. CI phải build lại từ source, không thì test đang xanh trên artifact cũ.

---

## 16. Definition of done — checklist (2 phút)

Đọc lại từ lessons cuối file:

- [ ] Không có test phụ thuộc thứ tự.
- [ ] Mỗi instruction có happy path + ít nhất 1 adversarial case.
- [ ] Error test kiểm tra state rollback.
- [ ] Test tên theo behavior.
- [ ] `README` project ghi rõ lệnh fmt / lint / test.

Nếu checklist chưa xong → chưa qua module.

---

## 17. Outro (2 phút)

> Vậy là xong Module 5. Bạn đã:
>
> - Biết pyramid 4 tầng và cách chọn.
> - Viết được happy + duplicate + state transition + underflow + wrong authority.
> - Assert được custom error, ConstraintSeeds và rollback.
> - Đọc được log để debug.
> - Nắm CI tối thiểu.
>
> Bài tập về nhà: hoàn thành nốt test matrix — 2 scenario `u64::MAX increment` và `PDA bị thay thế` mình cố ý để lại. Câu trả lời có trong `lab/solution/pda-counter.ts`, nhưng đừng mở trước khi tự thử.
>
> Module 6 mình sẽ xây Voting App — bạn sẽ áp đúng những kỹ thuật test hôm nay lên một domain phức tạp hơn. Hẹn gặp lại.

---

## Cheat sheet lệnh cần sẵn (paste vào note bên cạnh camera)

```bash
# Baseline
cd projects/pda-counter/final && anchor test

# Chạy 1 test
anchor test -- --grep "underflow"

# Verbose log khi validator quá noisy
RUST_LOG=solana_runtime::message_processor=debug anchor test

# CI local dry-run
cargo fmt --all --check && cargo clippy --workspace --all-targets -- -D warnings && anchor test
```

## Timing block (nếu bám sát sẽ ~63 phút)

| Section | Phút | Cộng dồn |
| --- | --- | --- |
| 0 Intro | 3 | 3 |
| 1 Vì sao tách module | 3 | 6 |
| 2 Pyramid | 8 | 14 |
| 3 Cấu trúc thư mục | 3 | 17 |
| 4 Mở lab starter | 2 | 19 |
| 5 Test matrix | 4 | 23 |
| 6 TODO 1 | 5 | 28 |
| 7 Refactor fixture | 3 | 31 |
| 8 TODO 2 | 5 | 36 |
| 9 TODO 3 | 4 | 40 |
| 10 TODO 4 🎯 | 7 | 47 |
| 11 TODO 5 | 6 | 53 |
| 12 Debug log | 5 | 58 |
| 13 LiteSVM | 3 | 61 |
| 14 Regression | 3 | 64 |
| 15 CI | 3 | 67 |
| 16 Checklist | 2 | 69 |
| 17 Outro | 2 | 71 |

Nếu muốn <60 phút: gộp 13+14 vào Outro, cắt block Refactor fixture (7) thành 1 dòng nói mà không refactor live.
