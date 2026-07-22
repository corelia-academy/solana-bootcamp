# Frontend-to-program data flow

[Mermaid source](./images/frontend-flow.mmd)

![Luồng frontend đến Solana program](./images/frontend-flow.png)

```mermaid
sequenceDiagram
    participant UI as UI
    participant W as Wallet
    participant C as Anchor client
    participant R as RPC
    participant P as Program
    UI->>C: form values
    C->>C: derive PDAs and build instruction
    C->>W: request signature
    W->>R: signed transaction
    R->>P: execute
    P-->>R: logs and state
    R-->>UI: confirmation and refreshed accounts
```

The IDL describes instruction names, arguments, accounts, and account data. It does not remove the need to understand PDAs, signers, confirmations, retries, or errors.
