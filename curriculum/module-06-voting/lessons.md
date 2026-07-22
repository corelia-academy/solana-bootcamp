# Nội dung bài học — Module 6

## 6.1 Product spec

Định nghĩa ai tạo poll, lúc nào thêm candidate, ai vote, một wallet được vote mấy lần và thời gian dùng timestamp nào. Non-goal: governance production.

## 6.2 State design

Poll chứa authority, ID, title giới hạn, start/end và candidate count. Candidate tham chiếu Poll và vote count. Vote Receipt chống duplicate.

## 6.3 PDA design

Poll: `["poll", poll_id]`; Candidate: `["candidate", poll, candidate_id]`; Receipt: `["vote", poll, voter]`. Không dùng string không giới hạn làm seed.

## 6.4 Initialize poll

Validate title, `start < end`, payer/authority và deterministic PDA. Lưu bump nếu project dùng lại cho signing/validation.

## 6.5 Add candidate

Chỉ poll authority, trước thời điểm bắt đầu, candidate ID duy nhất và tên bounded.

## 6.6 Vote

Voter ký, poll đang active, candidate thuộc đúng poll, receipt chưa tồn tại; checked increment.

## 6.7 Time errors

Clock là onchain source. Test before-start, boundary start, boundary end và after-end có behavior được định nghĩa rõ.

## 6.8 Tests

Test account relationships và state sau lỗi, không chỉ custom error. Candidate từ poll khác phải bị reject.

## 6.9 Devnet

Deploy program ID nhất quán, tạo poll demo, lưu signatures và Explorer links đúng cluster.

## 6.10 Frontend

Form tạo poll/candidate/vote, derive PDA, wallet sign, confirmation, refresh state và lỗi người dùng hiểu được.

## Project

Hoàn thiện [Voting App](../../projects/voting-app/README.md) theo bốn repo states.

## Schema xuyên suốt

| Account | PDA seeds | Invariant |
| --- | --- | --- |
| Poll | `["poll", poll_id]` | authority, time window và candidate count là nguồn sự thật |
| Candidate | `["candidate", poll, candidate_id]` | thuộc đúng Poll và votes không overflow |
| VoteReceipt | `["vote", poll, voter]` | một voter chỉ có một receipt trên mỗi Poll |

Client không được tự quyết định poll đang mở. Program đọc `Clock`, kiểm tra `start_at <= now <= end_at` và chỉ authority của Poll được thêm candidate trước thời điểm bắt đầu.

## Luồng code-along

1. Khởi tạo Poll với title, time window và authority.
2. Thêm candidate bằng ID tuần tự; test sai authority và thêm quá muộn.
3. Vote bằng cách tạo VoteReceipt và tăng counter có checked arithmetic.
4. Fetch Poll/Candidate/Receipt để chứng minh state.
5. Deploy Devnet rồi ghi lại program ID và Explorer links.

## Test matrix tối thiểu

Happy path gồm initialize, add candidate và vote. Failure path gồm invalid time range, vote trước/sau cửa sổ, candidate sai Poll, duplicate receipt, wrong authority và arithmetic boundary. Sau mỗi failure, fetch lại Candidate để chứng minh votes không đổi.

## Hoàn thành module khi

Program ở trạng thái `final` build được, tests mô tả business behavior, mỗi PDA được derive giống nhau trong Rust/TypeScript và học viên giải thích được vì sao receipt ngăn duplicate vote.
