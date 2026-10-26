# Security review — treasury

Commit: COMMIT_HASH · Rust 1.89.0 · Anchor 1.2.1 · Solana CLI 4.1.2
Devnet program ID: YOUR_PROGRAM_ID · Upgrade authority: ví học tập (một khóa)

| Invariant | Bảo vệ ở | Test |
| --- | --- | --- |
| Không khởi tạo lại quỹ | `init` trên `treasury`, `vault` | không cho khởi tạo lại treasury |
| Vault thuộc đúng treasury | `seeds` + `bump = treasury.vault_bump` | chặn treasury giả mượn vault thật |
| Hai chữ ký khác nhau | `constraint approver_two != approver_one` | chặn một approver ký hai vai |
| Vault giữ tiền rent | `checked_sub` + `minimum_balance` | chặn rút quá số dư, giữ lại tiền rent |
| Chỉ admin bấm tạm dừng | `Signer` + `has_one = admin` | chặn người lạ tạm dừng quỹ |
| Tạm dừng chặn rút | `require!(!treasury.paused)` | admin tạm dừng thì không rút được |

Retry: gửi lại cùng bytes đã ký tới `lastValidBlockHeight`, hết hạn thì ký lại.
Monitoring: log `withdraw … lamports to …`, `paused = …`; cảnh báo khi số dư vault giảm bất thường.
Known limitations: upgrade authority và admin là một khóa; chưa có đổi approver; priority fee trần 10 000 micro-lamports.
