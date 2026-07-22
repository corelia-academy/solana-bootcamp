# Module 4: Anchor Fundamentals

## Kết quả đầu ra

Xây và deploy PDA Counter theo từng user, đồng thời giải thích được mọi Anchor abstraction đã dùng.

## Bài học

Đọc [nội dung chi tiết từng lesson](./lessons.md).

1. Anchor workspace and `Anchor.toml`
2. `#[program]` and instruction handlers
3. `#[account]` state structs
4. `#[derive(Accounts)]` contexts
5. `init`, `mut`, `payer`, and `space`
6. PDA seeds, bump, and deterministic addresses
7. `Signer`, `Program<System>`, and `Account<T>`
8. `require!` and `#[error_code]`
9. IDL and client contract
10. Build, test và deploy Devnet

## Project

[PDA Counter](../../projects/pda-counter/README.md): initialize, increment, decrement, reset, full Anchor tests. Reference: [PDA note](../../notes/pda.md).

## Điều kiện tiên quyết

Hoàn thành Module 2–3.

## Điều hướng

Module trước: [Module 3](../module-03-solana-mental-model/README.md) · Module tiếp theo: [Module 5](../module-05-testing/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
