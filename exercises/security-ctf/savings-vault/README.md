# Thiếu kiểm tra PDA

Program **Savings Vault** cho mỗi người một vault PDA (seeds = `["vault", owner]`) để gửi SOL. Theo thiết kế, chỉ chủ vault mới rút được SOL của chính mình.

Program đang có lỗi. Hãy rút SOL từ vault của người khác.

## Nhiệm vụ

Viết exploit trong [`exercise/tests/test.rs`](./exercise/tests/test.rs): dùng ví `attacker` rút sạch vault của `victim` về ví mình, chỉ ký bằng `attacker`.

## Build

```shell
cargo build-sbf
```

## Kiểm thử

Exploit thành công khi test chạy xanh.

```shell
cargo test -- --nocapture
```

## Gợi ý bản vá (chỉ mở sau khi exploit đã chạy xanh)

<details>
<summary>Nguyên nhân</summary>

`withdraw_all` kiểm tra `owner.is_signer` và `vault.owner == program_id`, nhưng không derive lại PDA từ `owner.key` để so với account `vault` được truyền vào. Người ký có thể đưa vault của bất kỳ ai, miễn nó do program sở hữu.

</details>

<details>
<summary>Bản vá tham khảo</summary>

```rust
let (expected, _bump) = vault_pda(program_id, owner.key);
if *vault.key != expected {
    return Err(ProgramError::InvalidSeeds);
}
```

Tốt hơn: lưu `bump` trong state lúc tạo vault và derive bằng `create_program_address` với bump đó. Trong Anchor: `#[account(mut, seeds = [b"vault", owner.key().as_ref()], bump = vault.bump)]`.

Sau khi vá, chạy lại exploit: test phải **fail**. Thêm một test regression khẳng định điều đó.

</details>
