# Module 12: Privacy & ZK on Solana (Optional)

## Kết quả đầu ra

Sau module này, học viên có thể:

- phân biệt dữ liệu public, private witness và metadata vẫn bị lộ;
- giải thích trọn flow `note → commitment → Merkle root → proof → nullifier → output note`;
- viết và test relation ở TypeScript trước khi biểu diễn nó bằng constraint;
- tạo và verify một proof Noir/Barretenberg ở local;
- thiết kế ranh giới CPI an toàn giữa application program và verifier program trên Solana.

Module không xây mixer hay private token production. Noir proof được verify bằng backend
Barretenberg ở local; nó **không** được đưa thẳng vào ZK ElGamal Proof Program của Solana.

## Câu chuyện xuyên suốt

Alice sở hữu một private note có `amount = 10`. Onchain chỉ lưu commitment của note trong
Merkle tree. Khi tiêu note, Alice chứng minh mình biết preimage của một leaf thuộc current root,
công bố nullifier duy nhất để chặn double-spend, và tạo output commitment mới có cùng amount.

Đọc [nội dung chi tiết từng lesson](./lessons.md) trước khi làm lab.

## Lab ba tầng

Lab nằm tại [exercises/privacy-zk-lab](../../exercises/privacy-zk-lab/README.md):

1. **TypeScript mental model:** kiểm tra trực tiếp witness/relation; đây không phải ZK.
2. **Noir circuit:** constraint và proof thật, verify local bằng Barretenberg.
3. **Solana boundary:** mock verifier CPI và nullifier PDA để học integration; đây không phải
   production proof verifier.

## Sản phẩm nộp

- hai diagram đánh dấu public/private và offchain/onchain;
- TypeScript relation tests cho valid, invalid và replay cases;
- Noir circuit, output `nargo test` và log `bb verify`;
- Anchor CPI/replay tests;
- [threat-model worksheet](./threat-model.md) đã điền.

## Điều kiện tiên quyết

Hoàn thành Module 3 và Module 5. Noir và Barretenberg chỉ cần cài nếu làm tầng 2; Anchor
toolchain của khóa học chỉ cần cho tầng 3.

## Điều hướng

Module trước: [Module 11](../module-11-amm/README.md) · Module tiếp theo:
[Module 13](../module-13-indexing/README.md) ·
[Bản đồ phụ thuộc](../../docs/module-dependencies.md)
