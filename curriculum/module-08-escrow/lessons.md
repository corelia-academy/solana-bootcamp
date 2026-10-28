# Nội dung bài học — Module 8

## 8.1 Maker/taker flow

Maker công bố offer và khóa token A; taker trả token B; settlement atomic. Maker chỉ refund khi escrow chưa được take.

## 8.2 Escrow state

State lưu maker, mint A/B, offered/wanted amount, seed và bump. Không tin client truyền lại dữ liệu có thể đọc từ state.

## 8.3 Vault PDA

Escrow PDA là authority của vault ATA. Vault phải đúng mint A và đúng owner PDA.

## 8.4 CPI Token Program

Program validate toàn bộ relationship trước CPI; Token Program thực thi balance mutation. CPI không tự chứng minh business rule.

## 8.5 Make

Tạo state/vault, transfer checked token A từ maker, đảm bảo amount > 0 và mints khác nhau.

## 8.6 Take

Transfer B taker→maker và A vault→taker trong cùng transaction; PDA ký bằng seeds; close state/vault đúng destination. `maker_ata_b` phải tồn tại trước khi take (program không tạo hộ); client có thể thêm instruction `createAssociatedTokenAccountIdempotent` vào cùng transaction.

## 8.7 Refund

Chỉ maker, trả toàn bộ A và close. Không thể refund state sai maker hoặc đã settle.

## 8.8 PDA signer

`with_signer` sử dụng chính xác namespace, maker/seed bytes và bump của escrow đã validate.

## 8.9 Security review

Kiểm tra token programs, mints, owners, vault, receive accounts, duplicate accounts, amounts, close authority và checked arithmetic.

## 8.10 Tests

Make/take/refund happy path, wrong maker/mint/vault, insufficient funds, substituted accounts, duplicate use và state unchanged after failure.

## 8.11 Frontend

Offer list, maker form, take confirmation, refund action, token decimals, transaction status và refresh state.

## Account contract

Escrow PDA lưu maker, mint A/B, offered/wanted amount, seed và bump. Vault là ATA của Escrow PDA với mint A. `take` khóa maker receive account, taker accounts, hai mint và token program bằng constraints trước CPI.

## Atomic settlement

Trong một instruction, taker chuyển token B cho maker, Escrow PDA ký để chuyển toàn bộ token A trong vault cho taker, rồi vault/state được đóng. Nếu bất kỳ CPI nào lỗi, Solana rollback toàn transaction. `refund` dùng cùng signer seeds nhưng chỉ maker được gọi.

## Threat model và tests

Test wrong maker, substituted receive account, wrong mint/vault, zero amount, same mint, token donation vào vault, refund bởi attacker và replay sau close. Token gửi ngoài ý muốn không được làm kẹt close; final chuyển `vault.amount` thay vì chỉ amount ban đầu.

## Hoàn thành module khi

Bốn snapshot compile, final có make/take/refund, test chứng minh settlement/refund và rollback, account table giải thích signer/writable/owner, còn frontend chỉ được ghi là preview.
