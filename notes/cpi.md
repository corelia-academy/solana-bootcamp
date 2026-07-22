# Cross-program invocations

A CPI lets one Solana program invoke another.

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

The calling program must validate the target program, account relationships, token mints/owners, amounts, and signer seeds before invoking.
