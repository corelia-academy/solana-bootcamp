# Nội dung bài học — Module 10

## 10.1 Admin/config model

Tách protocol configuration khỏi wallet admin. Mọi privileged instruction đọc authority từ config onchain.

## 10.2 Config account

Lưu admin, mint, paused, cap và bump. Initialize một lần; validate mint authority relationship.

## 10.3 Minter allowance

Allowance PDA theo config + minter giới hạn quyền mint. Grant/revoke chỉ admin; mint trừ allowance bằng checked arithmetic.

## 10.4 Pause/unpause

Pause là emergency control, không phải cơ chế che lỗi. Định nghĩa rõ instruction nào bị chặn và ai có quyền unpause.

## 10.5 Authorized mint

Validate minter, allowance, cap, mint và destination ATA; program/PDA làm mint authority nếu thiết kế yêu cầu.

## 10.6 Burn

Holder burn token của chính mình; cập nhật supply tự động qua Token Program. Không cần admin cho normal burn.

## 10.7 Freeze/force-transfer

Thảo luận trade-off kiểm soát/composability và disclosure. Không triển khai force-transfer như default “stablecoin feature”.

## 10.8 Token-2022

Giới thiệu extension-enabled mint/account, program ID khác và nhu cầu kiểm tra extension compatibility.

## 10.9 Tests

Admin/minter roles, pause, revoke, allowance/cap boundary, wrong mint, overflow và state after failure.

## 10.10 Thiết kế admin client

Lập contract cho client hiển thị admin, paused, supply/cap và minters; mô tả transaction confirmation cùng error catalogue. Đây là bài thiết kế dựa trên IDL, không phải frontend được cung cấp sẵn trong project.

## Protocol contract

Config PDA theo mint lưu admin, paused, total cap và minted-through-protocol. MinterAllowance PDA theo config/minter lưu remaining allowance. Program không giữ private key; Config PDA làm mint authority bằng signer seeds.

## Instruction flow

`initialize_config` tiếp nhận mint authority; `set_minter` cấp/thu hồi allowance; `pause/unpause` chỉ admin; `mint` kiểm tra paused, allowance và cap trước CPI; `burn` yêu cầu holder ký. Freeze/force-transfer chỉ là thảo luận rủi ro, mặc định không triển khai.

## Security và tests

Test wrong admin/minter/mint, paused behavior, allowance exhaustion, cap boundary, checked arithmetic, revoked role và holder burn. Failure phải giữ nguyên allowance, protocol total và token balances. Phân biệt supply thật của mint với lượng được mint qua protocol.

## Hoàn thành module khi

Bốn trạng thái dùng cùng instruction schema, final có tests quyền hạn/boundary, bản thiết kế admin client chỉ gọi interface đã học và README nêu rõ đây không phải hạ tầng stablecoin production.
