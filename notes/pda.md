# Program Derived Address (PDA)

![Sơ đồ PDA](./images/pda.png)

PDA là địa chỉ được derive tất định từ seeds và program ID. PDA không có private key; owner program có thể ký thay PDA trong CPI bằng cách cung cấp lại seeds và bump ban đầu.

```mermaid
flowchart LR
    Seeds[Seeds: "poll" + poll_id] --> Derive[findProgramAddress]
    Program[Program ID] --> Derive
    Derive --> PDA[Poll PDA]
    Derive --> Bump[Bump]
```

## Quy tắc

- Seeds phải ổn định, có giới hạn và không mơ hồ.
- Dùng namespace prefix như `b"poll"`.
- Xác minh PDA trong mọi instruction phụ thuộc vào danh tính của nó.
- Không xem riêng bump là bằng chứng về danh tính.
- Frontend và test phải derive cùng địa chỉ từ cùng chuỗi byte.

## Tài nguyên sơ đồ

[Mở bản Excalidraw](./images/pda.excalidraw) để chỉnh sửa sơ đồ.
