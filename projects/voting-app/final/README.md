# Voting App — Final

## Mục tiêu state

Bản tham khảo hoàn chỉnh gồm Poll PDA, Candidate PDA và Vote Receipt PDA chống vote trùng.

## Phần đã có

Poll, candidate, vote, time window và duplicate-vote coverage.

## Học viên cần làm

Đối chiếu PDA derivation và failure paths với bài làm trước khi xem source final.

## Chạy và kiểm tra

```shell
pnpm install
anchor build
anchor test
```

Test dùng poll bắt đầu sau vài giây để chứng minh cả lỗi `PollNotStarted` và happy path.
