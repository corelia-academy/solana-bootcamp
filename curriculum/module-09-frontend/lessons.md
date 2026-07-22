# Nội dung bài học — Module 9

## 9.1 IDL contract

IDL mô tả instruction, args, accounts, errors và account types. Đối chiếu một handler Rust với entry IDL tương ứng.

## 9.2 TypeScript client

Tạo typed `Program`, provider và connection. Program ID, IDL và cluster phải cùng deployment.

## 9.3 Wallet connection

Wallet adapter cung cấp public key và signing capability; app không bao giờ đọc private key. Xử lý disconnected/connecting/connected.

## 9.4 Build transaction

Validate form, convert units, derive PDA, chọn accounts và instruction. Có thể mô phỏng trước khi xin ký.

## 9.5 Send/confirm

Phân biệt signature được trả về với confirmed success. Dùng commitment, blockhash/lastValidBlockHeight và retry có idempotency.

## 9.6 Read account data

Fetch một PDA hoặc `all` có filter phù hợp; hiểu discriminator và serialization; không scan không giới hạn.

## 9.7 UI states

Loading, empty, success, user rejection, simulation error, onchain custom error và RPC error cần message khác nhau.

## 9.8 Explorer links

Link signature/address/program phải có cluster query đúng Devnet/localnet context.

## 9.9 Freshness

Chọn refetch-after-confirmation, polling hoặc subscription theo nhu cầu; cleanup listener khi component unmount.

## 9.10 Failed transaction UX

Không auto-resubmit action tài chính mù quáng. Hiển thị nguyên nhân, giữ form state và chỉ retry khi biết action chưa thực thi.

## Lab

Thêm frontend cho Voting hoặc Escrow với create/read/action flow, explicit UI states và Explorer evidence.

## Project mẫu: Voting Frontend

Frontend dùng Voting App từ Module 6. Program interface không đổi; UI chỉ xây instruction, yêu cầu wallet ký, confirm transaction và refetch state. Mock mode cho phép chạy/test không cần validator; Devnet mode dùng program ID và IDL được cấu hình rõ ràng.

## Data flow

`IDL → VotingClient → wallet → send transaction → confirm → refetch Poll/Candidate → render`. Không cập nhật vote count như đã thành công trước confirmation. Explorer URL phải lấy cluster hiện tại thay vì hardcode.

## UI states bắt buộc

- wallet disconnected và đang connecting;
- initial loading, empty polls và fetch error;
- awaiting signature, confirming, success;
- user rejected signature và program error;
- stale state cần refetch/retry.

## Test matrix

Mock wallet để test disconnected/rejected signature; mock client để test failed confirmation và stale fetch; assert vote button bị disable khi pending; assert Explorer URL đúng local/devnet; assert successful vote gọi refetch đúng một lần.

## Hoàn thành module khi

Học viên chạy được mock mode, kết nối Devnet wallet, vote trên program Module 6, thấy confirmation/error rõ ràng và reload trang vẫn đọc đúng onchain state.
