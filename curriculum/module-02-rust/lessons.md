# Nội dung bài học — Module 2

## 2.1 Cargo project và module

`Cargo.toml` mô tả crate, dependency và feature. `src/main.rs` tạo binary; `src/lib.rs` tạo library; `mod` chia code theo trách nhiệm.

Thực hành: tạo CLI `poll-counter`, tách `model.rs`, `parser.rs`, `lib.rs`, `main.rs`; chạy `cargo check`, `cargo test`, `cargo run`.

## 2.2 Variables và kiểu dữ liệu

Rust immutable mặc định. Chọn integer theo miền dữ liệu; tránh cast ngầm; `String` sở hữu buffer trong khi `&str` là view. Input terminal luôn là dữ liệu chưa tin cậy.

Thực hành: parse `yes|no|abstain`, trả `Result<VoteChoice, ParseVoteError>` thay vì panic.

## 2.3 Struct và impl

Struct gom dữ liệu có quan hệ; `impl` chứa constructor và invariant-preserving behavior. Field public chỉ khi consumer thực sự cần mutate trực tiếp.

Thực hành: tạo `Poll { title, yes, no, abstain }` và methods `new`, `vote`, `total`.

## 2.4 Enum và pattern matching

Enum biểu diễn tập trạng thái đóng. `match` buộc xử lý mọi variant, phù hợp với instruction state và custom error sau này.

Thực hành: dùng `VoteChoice` để cập nhật đúng counter; thêm test cho cả ba variant.

## 2.5 Option, Result và error

`Option<T>` diễn tả có/không; `Result<T,E>` diễn tả thành công/thất bại. `?` truyền lỗi lên caller mà không che mất nguyên nhân.

Thực hành: tự định nghĩa error cho title rỗng, choice sai và overflow; không dùng `unwrap` trên input người dùng.

## 2.6 Ownership và borrowing

Mỗi value có một owner; borrow cho phép đọc hoặc mutate có kiểm soát. Solana/Anchor dùng lifetime và reference nhiều nên cần đọc được lỗi borrow checker thay vì né tránh bằng clone mọi nơi.

Thực hành: sửa ba đoạn code move-after-use, simultaneous mutable borrow và dangling reference.

## 2.7 Macros

`#[derive(...)]` sinh implementation; attribute macro có thể biến đổi item. Anchor macros tạo validation và serialization nhưng học viên vẫn phải hiểu code contract mà macro biểu đạt.

Thực hành: derive `Debug`, `Clone`, `PartialEq`; dùng `cargo expand` nếu môi trường hỗ trợ và ghi lại code được sinh.

## 2.8 Rust tests

Test đặt cạnh module cho unit behavior; integration tests đặt trong `tests/`. Tên test mô tả điều kiện và kết quả.

Thực hành: test khởi tạo poll, ba vote variants, invalid input và checked overflow.

## Bài tập

Hoàn thiện Poll Counter CLI chạy terminal, có help text, không panic vì input, và toàn bộ tests pass. Đây là mental model trực tiếp cho Voting App onchain.
