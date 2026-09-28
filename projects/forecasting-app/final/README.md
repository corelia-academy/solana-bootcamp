# Forecasting App — Final

## Mục tiêu state

Bản tham khảo hoàn chỉnh: Question, Player, Position PDA; resolve một lần; claim một lần; leaderboard xếp hạng ổn định. Chỉ dùng **điểm giả lập — không phải tiền thật**.

## Phần đã có

5 instruction, 15 test program và 2 test leaderboard; script `anchor run leaderboard`.

## Học viên cần làm

Đối chiếu PDA derivation, công thức score và failure paths với bài làm trước khi xem source final.

## Chạy và kiểm tra

```shell
pnpm install
anchor keys sync   # Anchor 1.x: đồng bộ Program ID trước khi build
anchor build
anchor test
```

Bộ test chờ khoảng 20 giây để câu hỏi qua giờ đóng rồi mới resolve và claim. In leaderboard trên Devnet sau khi deploy:

```shell
anchor run leaderboard --provider.cluster devnet
```
