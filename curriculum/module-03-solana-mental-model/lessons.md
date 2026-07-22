# Nội dung bài học — Module 3

## 3.1 Transaction, instruction và account

Transaction là envelope có chữ ký chứa một hoặc nhiều instructions. Mỗi instruction gồm program ID, account metas và instruction data. Runtime kiểm tra signature, khóa writable accounts và thực thi atomic.

Thực hành: phân rã một transaction theo [transaction schema](../../notes/transactions.md).

## 3.2 Solana khác EVM

Solana program thường stateless; dữ liệu nằm trong accounts được truyền vào. Client phải khai báo trước read/write set, tạo cơ hội thực thi song song.

Thực hành: chuyển một contract counter kiểu EVM thành danh sách program + data accounts + instruction inputs.

## 3.3 Account schema

Mỗi account có public key, owner program, lamports, data bytes và executable flag. Owner program mới được sửa data hoặc debit lamports.

Thực hành: đọc một account trên Explorer/RPC và xác định năm field này.

## 3.4 Program account và data account

Program account chứa executable code; data account chứa serialized application state. Program ID không phải nơi lưu từng poll/counter của user.

Thực hành: lập bảng cho System Program, Voting Program, Poll PDA và wallet account.

## 3.5 Built-in và token programs

System Program tạo/fund accounts; Token Program quản lý mint/token accounts; Associated Token Program tạo ATA chuẩn. Application program gọi chúng qua CPI thay vì tự sửa token balance.

Thực hành: vẽ program map cho thao tác mint và transfer token.

## 3.6 Signer, writable, read-only

Signer chứng minh quyền từ private key; writable cho phép state change; read-only chỉ đọc. Program phải kiểm tra authority semantics, không chỉ tin client đánh dấu account.

Thực hành: đánh dấu account metas cho initialize counter và increment counter.

## 3.7 Rent, space, serialization

Account cần lamports và allocated bytes. Anchor account thường có discriminator 8 bytes cộng serialized fields; string/vector cần giới hạn kích thước rõ ràng.

Thực hành: tính space cho account gồm authority `Pubkey`, `u64`, `bool`, string tối đa 64 bytes.

## 3.8 Đọc Explorer

Đọc signature, slot, status, fee, programs, account list, logs và token balance changes. Luôn kiểm tra cluster.

Thực hành: chú thích một Devnet transfer và một Anchor instruction.

## Mini project

Thiết kế Counter không Anchor: instruction enum, account layout, authority, serialization, error cases. Chưa cần code runtime hoàn chỉnh.
