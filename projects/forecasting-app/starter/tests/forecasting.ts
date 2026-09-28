import * as anchor from "@anchor-lang/core";
import { BN } from "@anchor-lang/core";
import { expect } from "chai";

describe("forecasting starter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/forecasting.ts).
  const program: any = anchor.workspace.forecasting;
  const questionId = new BN(Date.now());
  const [question] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("question"), provider.wallet.publicKey.toBuffer(), questionId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );

  it("derive Question PDA", () => {
    expect(question.equals(anchor.web3.PublicKey.default)).to.equal(false);
  });

  it.skip("TODO: create_question và lỗi giờ đóng / số lựa chọn", () => {});
  it.skip("TODO: register_player, predict và lỗi điểm giả lập", () => {});
  it.skip("TODO: resolve, claim và leaderboard", () => {});
});
