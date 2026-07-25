# Luồng dữ liệu từ frontend đến program

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

IDL mô tả tên instruction, arguments, accounts và account data. Tuy vậy, developer vẫn cần hiểu PDA, signer, confirmation, retry và cách xử lý lỗi.

## Tài nguyên sơ đồ

[Mở Mermaid source](./images/frontend-flow.mmd) để chỉnh sửa sơ đồ.
