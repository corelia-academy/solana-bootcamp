# Threat-model worksheet — Private note demo

Điền bảng sau trước khi xem solution. “Mitigation” phải chỉ ra circuit constraint, account
validation hoặc operational control cụ thể; không ghi chung chung “dùng ZK”.

| Asset/invariant | Attacker capability | Attack | Mitigation | Residual leakage/risk |
| --- | --- | --- | --- | --- |
| Input note chỉ tiêu một lần | Gửi nhiều transaction |  |  |  |
| Amount không được tạo thêm | Chọn witness tùy ý |  |  |  |
| Proof dùng đúng deployment | Copy public inputs/proof |  |  |  |
| Root là state hiện hành | Dùng proof cũ |  |  |  |
| Verifier là program tin cậy | Truyền account tùy ý |  |  |  |
| Secret không rời prover | Quan sát RPC/log/frontend |  |  |  |

## Câu hỏi bắt buộc

1. Fee payer, timing, program ID và transaction size có public không?
2. Nullifier ngăn replay nhưng tạo ra correlation nào?
3. Root history dài giúp usability nhưng mở rộng freshness window ra sao?
4. Nếu circuit artifact và verification key lệch version, verifier đang chứng minh câu nào?
5. Mock verifier của lab thiếu security property nào nên tuyệt đối không được deploy production?
