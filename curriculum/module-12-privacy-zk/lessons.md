# Nội dung bài học — Module 12

## 12.1 Privacy problem

Public ledger làm address, amount và interaction graph quan sát được. Pseudonymity không đồng nghĩa privacy.

## 12.2 Commitment

Commitment che value nhưng ràng buộc người tạo với value/secret; cần hiding và binding properties.

## 12.3 Nullifier

Nullifier công khai chứng minh một note đã dùng mà không tiết lộ note gốc, ngăn double-spend.

## 12.4 Merkle tree

Tree cam kết tập notes bằng root nhỏ; proof chứng minh leaf membership. State onchain lưu root/history và used nullifiers.

## 12.5 ZK intuition

Prover chứng minh statement đúng mà không tiết lộ witness. Public inputs phải bind proof với network/program/state mong muốn.

## 12.6 Noir circuit

Phân biệt private witness, public inputs và constraints; test circuit độc lập trước verifier integration.

## 12.7 Verifier program

Program nhận proof/public inputs, gọi verifier hoặc verify library, rồi cập nhật nullifier/state chỉ khi proof hợp lệ.

## 12.8 CPI verify

Application program validate verifier program ID, input accounts và domain separation trước CPI.

## 12.9 Private transfer demo

Demo commitment → proof membership/ownership → nullifier → new commitments; không tuyên bố anonymity production.

## 12.10 Limitations

Trusted setup, circuit bugs, metadata leakage, relayer, proof cost, root freshness và key management phải được nêu rõ.

## Lab tự chọn

Lab dùng commitment/nullifier nhỏ chạy local. Starter định nghĩa public inputs và TODO; solution tạo commitment deterministic, xác minh witness mock/local proof và lưu nullifier để chặn replay. Mục tiêu là hiểu flow, không tuyên bố privacy production.

## Data flow

User tạo secret/witness ngoài chain → công bố commitment → tạo proof cho statement → verifier kiểm tra public inputs/root → program đánh dấu nullifier đã dùng. Secret không được log hoặc gửi như instruction argument.

## Threat model và tests

Test proof hợp lệ, witness sai, Merkle root sai, nullifier replay và public input bị thay. Ghi rõ mock verifier không cung cấp soundness; nếu dùng Noir/local circuit, pin circuit artifact và verifier version.

## Hoàn thành module khi

Starter/solution chạy độc lập, diagram chỉ rõ dữ liệu public/private, tests chứng minh invalid/replay rejection và README liệt kê metadata vẫn bị lộ trên public chain.
