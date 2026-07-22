# Solana vs EVM

![So sánh Solana và EVM](./images/solana-vs-evm.png)

[Mở source Excalidraw](./images/solana-vs-evm.excalidraw)

| Question | Solana | EVM |
| --- | --- | --- |
| Where is state? | Separate accounts passed to instructions | Contract storage |
| Does program code store user data? | Usually no; programs are stateless logic | Contract owns its storage |
| Parallel execution | Enabled when account access does not conflict | Primarily sequential per chain |
| Call inputs | Program ID, account metas, instruction data | Target, calldata, value |
| Authorization | Signer flags plus program validation | `msg.sender` plus contract validation |

The crucial Solana habit is to ask: “Which accounts are read, which are written, who owns them, and who signed?”
