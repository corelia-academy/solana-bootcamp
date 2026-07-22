# Programs, instructions, and transactions

![Program, instruction và transaction](./images/program.png)

[Mở source Excalidraw](./images/program.excalidraw)

```mermaid
flowchart LR
    Tx[Transaction] --> I1[Instruction 1]
    Tx --> I2[Instruction 2]
    I1 --> P1[Program ID]
    I1 --> A1[Account metas]
    I1 --> D1[Instruction data]
```

- A transaction is an atomic, signed envelope containing one or more instructions.
- An instruction identifies a program, lists accounts, and provides serialized data.
- The runtime locks writable accounts, verifies signatures, and invokes programs.
- If one instruction fails, the transaction's state changes roll back.

Before sending a transaction, a client needs a recent blockhash, fee payer, required signatures, and all instruction accounts.
