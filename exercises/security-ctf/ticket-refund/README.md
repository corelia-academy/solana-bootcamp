# Thiếu xử lý rent khi dọn account

Program **Ticket Refund** giữ tiền cọc vé sự kiện trong một account. Account được nạp dư lamports (cọc + rent-exempt reserve). Instruction `sweep` nhằm trả phần lamports NGOÀI tiền cọc về cho người mua.

Program đang có lỗi. Hãy lấy phần rent reserve ra khỏi account.

## Nhiệm vụ

Viết exploit trong [`exercise/tests/test.rs`](./exercise/tests/test.rs): dùng ví `attacker` quét phần rent-exempt reserve của vé về ví mình, khiến account tụt xuống dưới mức miễn rent. Chỉ ký bằng `attacker`.

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

`sweep` chỉ giữ lại đúng `deposit` rồi quét mọi lamports còn lại, gồm cả rent-exempt reserve. Nó cũng không kiểm tra `caller`/`recipient` có phải người mua. Account tụt dưới mức miễn rent có thể bị thu hồi.

</details>

<details>
<summary>Bản vá tham khảo</summary>

```rust
use solana_program::{rent::Rent, sysvar::Sysvar};

if ticket.buyer != *caller.key || ticket.buyer != *recipient.key {
    return Err(ProgramError::IllegalOwner);
}
let rent_min = Rent::get()?.minimum_balance(ticket_account.data_len());
let keep = ticket.deposit.checked_add(rent_min).ok_or(ProgramError::ArithmeticOverflow)?;
let balance = ticket_account.lamports();
if balance > keep {
    let diff = balance - keep;
    **ticket_account.try_borrow_mut_lamports()? -= diff;
    **recipient.try_borrow_mut_lamports()? += diff;
}
```

Sau khi vá, chạy lại exploit: test phải **fail**. Thêm một test regression khẳng định account không bao giờ tụt dưới mức miễn rent.

</details>
