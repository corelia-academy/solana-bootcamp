# Cross-program invocation (CPI)

CPI cho phép một Solana program gọi program khác.

```mermaid
sequenceDiagram
    participant U as User
    participant E as Escrow Program
    participant T as Token Program
    U->>E: take(escrow accounts)
    E->>E: validate state and PDAs
    E->>T: transfer_checked(token B)
    E->>T: transfer_checked(token A, PDA signer)
    E-->>U: settlement complete
```

Trước khi gọi CPI, program phải xác minh target program, quan hệ giữa các account, token mint/owner, số lượng và signer seeds.
