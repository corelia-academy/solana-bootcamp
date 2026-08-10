# Final — vòng đời SPL Token hoàn chỉnh

## Mục tiêu state

Lab tạo mint 6 decimals, tạo ATA cho Alice/Bob, mint 100 token, chuyển 25, burn 5, kiểm tra invariant và thu hồi mint authority.

## Phần đã có

Checked token lifecycle, bigint helpers và supply tests. `tests/token-rules.test.ts` chạy trên validator local, kiểm tra mint/burn trái phép, sai mint, sai decimals, vượt số dư và mint sau khi thu hồi authority.

## Học viên cần làm

Đối chiếu raw amount, owner/mint checks và authority revocation với bài làm.

## Chạy và kiểm tra

```bash
solana-test-validator --reset
pnpm install
pnpm test
pnpm run check
pnpm run lab
pnpm run test:chain
```

`pnpm test` chỉ chạy unit test của amount, không cần validator. `pnpm run lab` và `pnpm run test:chain` cần `solana-test-validator` đang chạy ở terminal khác.

Kết quả cuối: Alice `75`, Bob `20`, supply `95` token. Script dùng `bigint`, các thao tác thay đổi balance đều là biến thể `*Checked`, và mint authority được đặt về `null` sau khi hoàn tất.
