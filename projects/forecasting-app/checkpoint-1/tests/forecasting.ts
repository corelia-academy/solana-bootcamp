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

  const question = findQuestion(questionId);

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
});
