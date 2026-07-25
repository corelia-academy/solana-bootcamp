# Program, instruction và transaction

![Program, instruction và transaction](./images/program.png)

```mermaid
flowchart LR
    Tx[Transaction] --> I1[Instruction 1]
    Tx --> I2[Instruction 2]
    I1 --> P1[Program ID]
    I1 --> A1[Account metas]
    I1 --> D1[Instruction data]
```

- Transaction là một gói nguyên tử đã được ký, chứa một hoặc nhiều instruction.
- Instruction xác định program, liệt kê account và cung cấp dữ liệu đã serialize.
- Runtime khóa các writable account, xác minh chữ ký và gọi program.
- Nếu một instruction thất bại, toàn bộ thay đổi trạng thái của transaction được rollback.

Trước khi gửi transaction, client cần recent blockhash, fee payer, các chữ ký bắt buộc và đầy đủ account của mọi instruction.

## Tài nguyên sơ đồ

[Mở bản Excalidraw](./images/program.excalidraw) để chỉnh sửa sơ đồ.
