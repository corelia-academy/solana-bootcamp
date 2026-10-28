# Thiếu kiểm tra signer

Program **Course Registry** lưu giá của từng khóa học. Theo thiết kế, chỉ admin của khóa học mới đổi được giá.

Program đang có lỗi. Hãy đổi giá một khóa học khi admin không ký transaction.

## Nhiệm vụ

Viết exploit trong [`exercise/tests/test.rs`](./exercise/tests/test.rs): dùng ví `attacker` đưa giá khóa học về `0`, chỉ ký bằng `attacker`.

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

`set_price` so sánh `course.admin` với pubkey của account thứ hai nhưng không kiểm tra account đó có ký hay không. Pubkey là thông tin công khai, nên ai cũng đưa được pubkey của admin vào transaction với `is_signer = false`.

</details>

<details>
<summary>Bản vá tham khảo</summary>

```rust
if !admin.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
}
if course.admin != *admin.key {
    return Err(ProgramError::IllegalOwner);
}
```

Trong Anchor: khai báo `pub admin: Signer<'info>` cùng `#[account(mut, has_one = admin)]` trên account khóa học.

Sau khi vá, chạy lại exploit: test phải **fail** (transaction bị từ chối). Thêm một test regression khẳng định điều đó.

</details>
