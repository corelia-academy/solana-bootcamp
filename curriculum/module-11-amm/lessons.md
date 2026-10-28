# Nội dung bài học — Module 11

## 11.1 AMM

AMM dùng reserves và invariant thay order book. Trader thay đổi reserve ratio; LP chịu inventory/price risk.

## 11.2 Pool state

Pool lưu canonical mint ordering, vaults, LP mint, fee và bump. Một mint pair không được tạo duplicate pool bằng đảo thứ tự. Fee nằm trong seeds và chỉ nhận fee tier cố định (5/30/100 bps): nếu người tạo pool đầu tiên được tự đặt fee và mỗi cặp chỉ có một pool, họ có thể chiếm cặp đó với fee 99%.

## 11.3 Vaults

Hai vault ATAs thuộc pool authority PDA. Validate mint A/B và không cho cùng account đóng nhiều vai trò.

## 11.4 LP token

LP shares biểu diễn tỷ lệ ownership reserves, không phải fixed claim theo token amount ban đầu.

## 11.5 Constant product

Với fee-adjusted input, output giữ invariant `x*y≈k` trong integer arithmetic. Xác định rounding direction bảo vệ pool.

## 11.6 Slippage

Client truyền `minimum_amount_out`; program reject nếu quote thay đổi bất lợi. Không chỉ hiển thị warning ở UI.

## 11.7 Liquidity

Initial deposit định nghĩa ratio; subsequent deposit theo ratio hiện tại; remove burn LP và trả proportional reserves.

## 11.8 Stable swap

Tổng quan invariant tập trung thanh khoản quanh peg; không nhảy thẳng Newton iteration trong core exercise.

## 11.9 Oracle

Oracle cung cấp reference price nhưng có freshness/confidence/manipulation risks; AMM core không được giả định oracle luôn đúng.

## 11.10 Tests

Initialization, initial/subsequent liquidity, withdrawal, swap, fee/rounding, invariant, wrong vault/mint, slippage và zero input.

## Pool contract

Pool PDA dùng cặp mint canonical để tránh hai pool đảo thứ tự. Vault A/B là ATA của Pool PDA; LP mint cũng do Pool PDA kiểm soát. State lưu fee basis points, bump và các địa chỉ đã validate.

## Math và rounding

Swap constant-product tính output từ reserves trước transaction, trừ fee và luôn round theo hướng bảo vệ pool. `minimum_output` là slippage guard của user. Initial liquidity xác định LP shares; subsequent liquidity và withdrawal phải tỷ lệ với reserves.

**First-depositor attack.** Nếu pool không khóa share nào, kẻ tấn công nạp 1 đơn vị mỗi token để nhận 1 share, rồi chuyển thẳng một lượng lớn token vào vault (ai cũng gửi được vào ATA). Giá 1 share tăng vọt, người nạp sau bị làm tròn xuống 0 hoặc rất ít share và mất phần chênh. Project khóa `MINIMUM_LIQUIDITY = 1_000` shares vào account `locked_lp` ở lần nạp đầu, nên supply không bao giờ về 0 và chi phí tấn công tăng hàng nghìn lần. User vẫn phải đặt `minimum_lp` hợp lý.

**Chỉ lấy phần tỷ lệ.** `add_liquidity(max_amount_a, max_amount_b, minimum_lp)`: program tính shares theo token "thiếu" hơn (làm tròn xuống), rồi tính lại lượng A/B cần nạp cho đúng số shares đó (làm tròn lên), chỉ chuyển đúng lượng ấy. Nếu chuyển cả `max_amount` thì phần dư bị tặng không cho các LP khác.

## Instruction flow

Khởi tạo pool/vault/LP mint; add liquidity và mint LP; burn LP để remove; swap A→B hoặc B→A bằng PDA signer. Không tin reserve/price do client truyền; program đọc token accounts.

## Test matrix

Initial/subsequent liquidity, proportional withdrawal, both swap directions, fee rounding, zero input, slippage rejection, wrong vault/mint, overflow và invariant không giảm ngoài rounding/fee policy.

## Hoàn thành module khi

Final triển khai constant product thật, không dùng swap 1:1; math helpers có unit tests; integration tests chứng minh balance changes và LP accounting; stable-swap/oracle chỉ là extension có ghi rõ.
