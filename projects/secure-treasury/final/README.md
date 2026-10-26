# Secure Treasury — Final

## Mục tiêu state

Bản tham khảo hoàn chỉnh: Treasury PDA, Vault PDA giữ SOL, rút 2-trên-3 với hai approver khác nhau, công tắc tạm dừng của admin, và client gửi giao dịch có compute budget, priority fee có trần, retry theo blockhash.

## Phần đã có

Mọi bản vá của code-along Bước 2–7 cùng test regression cho từng bản vá; `SECURITY.md` liên kết invariant với constraint và test.

## Học viên cần làm

Đối chiếu từng constraint với test chứng minh nó. Thử gỡ một bản vá (ví dụ `seeds` của `vault` trong `Withdraw`) và xác nhận test tương ứng đỏ lại, rồi khôi phục.

## Chạy và kiểm tra

```shell
pnpm install
anchor keys sync   # Anchor 1.x: đồng bộ Program ID trước khi build
anchor build
anchor test
```

Kết quả mong đợi: `9 passing`. Deploy Devnet theo code-along Bước 8 rồi điền Program ID và commit vào `SECURITY.md`.
