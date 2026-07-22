# Nội dung bài học — Module 5: Testing Solana Program

## Mục tiêu module

Sau module này, bạn có thể:

- chọn đúng tầng test thay vì dùng `anchor test` cho mọi thứ;
- dựng fixture có thể tái sử dụng cho wallet, PDA, mint và token account;
- kiểm tra cả state trước/sau transaction, không chỉ kiểm tra signature;
- assert đúng custom error hoặc Anchor constraint;
- đọc simulation log để tìm instruction/CPI gây lỗi;
- biến một lỗ hổng thành regression test;
- thiết lập bộ lệnh kiểm tra tối thiểu cho CI.

## 5.1 Testing pyramid trên Solana

| Tầng | Chạy ở đâu | Phù hợp nhất | Không chứng minh được |
| --- | --- | --- | --- |
| Rust unit test | Trong process Rust | Toán học, serialize, validation thuần | Signer, owner, PDA, CPI |
| LiteSVM | SVM trong process | Account behavior và instruction nhanh | Deploy flow thực tế |
| Anchor TypeScript | Local validator | IDL, account resolver, client flow, CPI | Hành vi trên cluster thật |
| End-to-end | Devnet/test validator | Deploy, RPC, frontend và transaction UX | Test nhanh, deterministic |

Quy tắc chọn tầng thấp nhất có thể chứng minh yêu cầu. Ví dụ `checked_add` nên là Rust unit test; sai PDA phải chạy qua runtime; wallet confirmation cần frontend/E2E.

Một instruction tối thiểu cần bốn nhóm test:

1. happy path;
2. sai hoặc thiếu authority;
3. sai quan hệ account như mint/owner/PDA;
4. boundary: 0, max value, thời gian bắt đầu/kết thúc hoặc duplicate call.

## 5.2 Cấu trúc thư mục và cách đặt tên

```text
programs/voting/src/
├── lib.rs
├── state.rs
└── instructions/
    └── vote.rs
tests/
├── fixtures/
│   ├── wallets.ts
│   └── voting.ts
├── initialize-poll.ts
└── vote.ts
```

Tên test nên mô tả business invariant: `rejects duplicate vote receipt` tốt hơn `vote error 2`. Mỗi test theo Arrange → Act → Assert và không phụ thuộc thứ tự chạy của test khác.

## 5.3 Anchor TypeScript integration test

Luồng chuẩn gồm provider, PDA deterministic, gọi instruction, fetch state và assert:

```ts
anchor.setProvider(anchor.AnchorProvider.env());
const provider = anchor.getProvider() as anchor.AnchorProvider;
const program = anchor.workspace.PdaCounter;

const [counter] = PublicKey.findProgramAddressSync(
  [Buffer.from("counter"), provider.publicKey.toBuffer()],
  program.programId,
);

await program.methods.initialize().accounts({ counter }).rpc();
const state = await program.account.counter.fetch(counter);
expect(state.owner.equals(provider.publicKey)).to.equal(true);
expect(state.value.toNumber()).to.equal(0);
```

Không dùng “transaction không throw” làm assertion duy nhất. Với instruction thay đổi balance, hãy đọc balance trước/sau. Với instruction đóng account, assert `getAccountInfo(address) === null`.

Xem code hoàn chỉnh tại [PDA Counter final tests](../../projects/pda-counter/final/tests/pda-counter.ts).

## 5.4 LiteSVM test đầu tiên

LiteSVM hữu ích khi muốn thực thi instruction nhanh mà không khởi động validator. Test cần:

1. tạo `LiteSVM`;
2. nạp program bytes hoặc processor;
3. tạo/fund payer và accounts;
4. xây instruction cùng account metas;
5. ký transaction và gọi `send_transaction`;
6. đọc account/log để assert.

Pseudo-flow:

```rust
let mut svm = LiteSVM::new();
svm.add_program(PROGRAM_ID, PROGRAM_BYTES);
svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

let tx = Transaction::new_signed_with_payer(
    &[instruction],
    Some(&payer.pubkey()),
    &[&payer],
    svm.latest_blockhash(),
);
svm.send_transaction(tx).unwrap();
```

Các CTF trong [Security CTF](../../exercises/security-ctf/README.md) cung cấp test LiteSVM thật. Với toolchain khóa học, build SBF trước để test có program binary.

## 5.5 Fixtures không che mất hành vi

Fixture nên lo phần lặp lại: airdrop, tạo mint, ATA, PDA và initial balances. Action đang được kiểm tra vẫn nên hiện rõ trong test.

```ts
type TokenFixture = {
  mint: PublicKey;
  alice: Keypair;
  aliceAta: PublicKey;
  initialAmount: bigint;
};
```

Ưu tiên deterministic seed khi có thể. Một fixture phải trả lại public keys và expected state để test có thể tự assert. Tránh helper kiểu `setupEverythingAndVote()` vì nó che mất instruction chính.

## 5.6 Assert lỗi và state rollback

Test lỗi phải chứng minh ba điều:

- transaction thất bại vì đúng nguyên nhân;
- error code/constraint khớp kỳ vọng;
- state và balances không đổi.

```ts
const before = await program.account.counter.fetch(counter);

try {
  await program.methods.decrement().accounts({ counter }).rpc();
  expect.fail("decrement phải thất bại khi counter bằng 0");
} catch (error) {
  expect(String(error)).to.match(/Underflow|6001/);
}

const after = await program.account.counter.fetch(counter);
expect(after.value.eq(before.value)).to.equal(true);
```

Với Anchor, phân biệt custom program error (`InvalidAmount`) và account constraint (`ConstraintSeeds`, `ConstraintHasOne`). Không assert một substring chung như `failed`.

## 5.7 Debug transaction logs

Khi test đỏ, đọc theo thứ tự:

1. instruction ngoài cùng nào được gọi;
2. account constraint nào chạy trước handler;
3. `Program log` cuối cùng của program;
4. CPI nào thất bại;
5. custom error hex/decimal;
6. compute units đã dùng.

Chạy riêng một test để giảm nhiễu:

```bash
anchor test -- --grep "duplicate vote"
```

Nếu RPC trả lỗi trước khi gửi transaction, dùng simulation logs trong error object. Nếu test phụ thuộc program binary cũ, xóa build artifact của đúng workspace rồi build lại; không xóa cả repository.

## 5.8 CI tối thiểu

CI cần pin cùng toolchain với khóa học và chạy từ rẻ đến đắt:

```bash
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
pnpm install --frozen-lockfile
anchor test
```

Không cache `target/deploy` như nguồn sự thật. CI phải có khả năng build lại program từ source. Khi test validator chạy song song, dùng port và ledger directory riêng cho từng job.

## Lab bắt buộc

Project mẫu của module là [PDA Counter Testing Lab](./lab/README.md), dùng lại program đã xây ở Module 4.

1. Bắt đầu từ [`lab/starter`](./lab/starter/pda-counter.ts), không bắt đầu từ solution.
2. Điền [test matrix](./test-matrix.md) cho PDA Counter.
3. Chạy test final của Module 4 để quan sát baseline xanh.
4. Hoàn thiện từng TODO và bỏ `skip` theo thứ tự.
5. Thêm test wrong owner và chứng minh state không đổi sau lỗi.
6. Chọn một Security CTF, vá lỗi rồi giữ exploit cũ làm regression test.
7. Ghi lại lỗi khó nhất theo [debug worksheet](./debug-worksheet.md).

## Definition of done

- Không có test phụ thuộc thứ tự.
- Mỗi instruction có happy path và ít nhất một adversarial case.
- Error test kiểm tra state rollback.
- Test tên theo behavior, không theo implementation.
- Lệnh format, static check và test được ghi rõ trong README của project.
