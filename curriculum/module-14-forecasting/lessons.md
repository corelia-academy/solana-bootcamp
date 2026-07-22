# Nội dung bài học — Module 14

> Chỉ dùng điểm giả lập; không dùng tiền thật hoặc cơ chế cá cược.

## 14.1 Forecasting concept

User dự đoán outcome của câu hỏi có deadline và resolver. Scope giáo dục tập trung state machine, không pricing market thực.

## 14.2 Question account

Lưu creator/resolver, bounded text, outcomes, open/close time, status và resolved outcome.

## 14.3 User position

PDA theo question + user, lưu choice và committed points. Quy định một hay nhiều update trước close.

## 14.4 Fake points

Points là ledger giáo dục, không redeem và không monetary claim. Mint/award rules minh bạch, checked arithmetic.

## 14.5 Resolve

Chỉ resolver, sau close, đúng một lần, outcome hợp lệ. Resolution authority/risk phải hiển thị ở UI.

## 14.6 Claim score

Receipt/claimed flag ngăn double claim; score formula deterministic và test boundary.

## 14.7 Leaderboard

Indexer tổng hợp score; onchain state vẫn là nguồn claim. API pagination và tie-breaker rõ ràng.

## 14.8 Frontend

Tạo/read questions, submit prediction, countdown, resolution, claim và disclaimer nổi bật.

## Lab tự chọn

Ứng dụng chỉ dùng điểm giả lập. Market lưu question, choices, close time, resolution và authority; Position PDA theo market/user lưu choice, points và claimed flag.

## State machine

`Open → Closed → Resolved`. User chỉ tham gia khi Open; authority chỉ resolve một lần sau close; claim chỉ sau resolution và chỉ một lần. Không có deposit, withdrawal, odds hoặc token có giá trị.

## Tests và UX

Test invalid time, participation sau close, double resolve, unauthorized resolve, wrong choice, duplicate claim và leaderboard deterministic. Frontend phải hiển thị rõ “điểm giả lập — không phải tiền thật”.

## Hoàn thành module khi

Starter/solution có state machine chạy được, tests bảo vệ resolution/claim, leaderboard được derive từ data đã xác minh và mọi trang đều có disclaimer no-real-money.
