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

  function findQuestion(id: BN) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("question"), authority.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];
  }

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

  const question = findQuestion(questionId);
  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();

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

    const player = await program.account.player.fetch(findPlayer(alice.publicKey));
    expect(player.points.toNumber()).to.equal(1000);
    expect(player.score.toNumber()).to.equal(0);
  });

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

    const player = await program.account.player.fetch(findPlayer(alice.publicKey));
    const position = await program.account.position.fetch(findPosition(question, alice.publicKey));
    const state = await program.account.question.fetch(question);
    expect(player.points.toNumber()).to.equal(700);
    expect(position.choice).to.equal(0);
    expect(position.points.toNumber()).to.equal(300);
    expect(state.participantCount).to.equal(2);
  });

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

  it("từ chối resolve trước giờ đóng", async () => {
    try {
      await program.methods.resolve(0).accounts({ question, authority }).rpc();
      expect.fail("resolve khi còn mở phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Câu hỏi chưa đóng nên chưa resolve được");
    }
  });

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
});
