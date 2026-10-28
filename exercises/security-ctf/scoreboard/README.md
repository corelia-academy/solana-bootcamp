# Thiếu kiểm tra quyền

Program **Scoreboard** lưu người dẫn đầu của một giải đấu. Theo thiết kế, chỉ ban tổ chức (authority lưu trong board) mới được ghi kết quả.

Program đang có lỗi. Hãy ghi một người dẫn đầu khác mà không phải ban tổ chức.

## Nhiệm vụ

Viết exploit trong [`exercise/tests/test.rs`](./exercise/tests/test.rs): dùng ví `attacker` tự ghi mình là người dẫn đầu với `1_000_000` điểm, chỉ ký bằng `attacker`.

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

`record_leader` chỉ kiểm tra account thứ hai **có ký**, không kiểm tra account đó **có phải** `board.authority`. Có chữ ký mới chứng minh danh tính, chưa chứng minh quyền.

</details>

<details>
<summary>Bản vá tham khảo</summary>

```rust
if !authority.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
}
if board.authority != *authority.key {
    return Err(ProgramError::IllegalOwner);
}
```

Trong Anchor: `#[account(mut, has_one = authority)] pub board: Account<'info, Board>` cùng `pub authority: Signer<'info>`.

Sau khi vá, chạy lại exploit: test phải **fail**. Thêm một test regression khẳng định điều đó.

</details>
