# Nội dung bài học — Module 4

## 4.1 Anchor workspace

Đọc `Anchor.toml`, workspace Cargo, program crate, test client và generated IDL. Phân biệt source-controlled file với `target/` artifact.

## 4.2 `#[program]`

Module `#[program]` công bố instruction handlers. Handler nhận `Context<...>` và arguments đã deserialize; nó vẫn phải enforce business invariants.

Thực hành: thêm `initialize(ctx)` và log signer.

## 4.3 `#[account]`

State struct được Anchor thêm discriminator và serialization. Field order/type là layout contract; thay đổi layout ảnh hưởng account đã deploy.

Thực hành: tạo `Counter { owner: Pubkey, value: u64, bump: u8 }`.

## 4.4 `#[derive(Accounts)]`

Context struct mô tả accounts, types và validation declarative. Mỗi constraint phải trả lời “invariant nào đang được bảo vệ?”.

Thực hành: tạo `Initialize` và `UpdateCounter` contexts.

## 4.5 Init, mut, payer, space

`init` tạo account; `payer` trả lamports; `space` allocate bytes; `mut` bắt buộc nếu lamports/data đổi. Không đánh dấu writable dư thừa.

Thực hành: tính `8 + 32 + 8 + 1` bytes cho Counter.

## 4.6 PDA

PDA được derive từ seeds + program ID + bump, không có private key. Namespace seeds và user pubkey tạo một counter mỗi user.

Thực hành: derive cùng PDA trong Rust test và TypeScript client.

## 4.7 Anchor account types

`Signer` yêu cầu signature; `Program<System>` validate program ID; `Account<T>` validate owner/discriminator và deserialize; `UncheckedAccount` chuyển trách nhiệm validation về developer.

## 4.8 Errors

`require!` phù hợp business condition; account constraints phù hợp relationship/authority. Custom errors phải dễ hiểu và test theo code.

## 4.9 IDL

IDL mô tả instructions, args, accounts, errors và account types cho client. IDL không thay thế PDA logic hoặc confirmation handling.

## 4.10 Build, test, deploy

Loop chuẩn: format/check → build → local test → inspect IDL/program ID → deploy Devnet → run client against correct cluster.

## Project

Làm [PDA Counter](../../projects/pda-counter/README.md) từ `starter` đến tests hoàn chỉnh.
