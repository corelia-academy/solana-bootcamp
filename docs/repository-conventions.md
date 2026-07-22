# Quy ước repository

## Mô hình project bốn trạng thái

```text
project-name/
├── starter/       # Boilerplate, interface và TODO
├── checkpoint-1/  # Điểm phục hồi sau milestone đầu
├── checkpoint-2/  # Điểm phục hồi giữa project
└── final/          # Bản tham khảo sau khi nộp
```

Checkpoint là snapshot của cùng một sản phẩm. Tool versions, commands, public interfaces và instruction order phải nhất quán ở cả bốn trạng thái.

## Layout Anchor project

```text
project/
├── Anchor.toml
├── Cargo.toml
├── programs/<program-name>/src/lib.rs
├── tests/
└── README.md
```

Project TypeScript/frontend/server có cấu trúc tương đương với `src/`, `tests/`, `package.json` và `tsconfig.json`; mỗi project cài dependency độc lập.

## Tài liệu bắt buộc

- learning outcomes và prerequisites;
- account/state/API schema;
- instruction/data flow;
- PDA seed table hoặc lý do không dùng PDA;
- signer/writable/owner hoặc authentication/policy roles;
- lệnh build/test;
- test matrix happy path và expected errors;
- security assumptions và known limitations;
- diagram source cùng PNG dùng để publish.

## Trình tự lesson

Dùng `Concept → Schema → Code → Test`. Không để starter chứa sẵn implementation final. Test skip trong starter phải tương ứng với milestone rõ ràng và được mở dần ở checkpoint.

## Style nội dung

- Root README chỉ là mục lục ngắn giống `solana-course`.
- Giải thích/diagram tái sử dụng đặt trong `notes/`.
- Module sequencing và outcomes đặt trong `curriculum/`.
- Product state, instructions, tests và checkpoints đặt trong `projects/`.
- Mermaid/Excalidraw source và PNG đều được version-control.

Dùng [lesson template](./lesson-template.md), [project template](./project-template.md) và [project artifact matrix](./project-artifact-matrix.md) khi audit nội dung.
