# Tên project

## Product brief

Vấn đề, người dùng, phạm vi và non-goals rõ ràng.

## Kết quả đầu ra

- Năng lực có thể quan sát và kiểm chứng.

## Mô hình state/API

| Account/API | PDA seeds/schema | Fields | Authority/policy |
| --- | --- | --- | --- |

## Instructions/operations

| Operation | Signer/auth | Mutable state | Preconditions | Kết quả |
| --- | --- | --- | --- | --- |

## Diagrams

- Quan hệ account/component.
- Instruction/request flow.
- PDA derivation hoặc no-PDA rationale.
- Frontend/client/server flow.

## Các trạng thái

| State | Nội dung | Nhiệm vụ học viên |
| --- | --- | --- |
| starter | Boilerplate/interface/TODO | Bắt đầu tại đây |
| checkpoint-1 | Milestone đầu | Phục hồi khi bị kẹt |
| checkpoint-2 | Main state flow | Hoàn thiện tests/UI |
| final | Bản tham khảo hoàn chỉnh | Chỉ xem sau khi nộp |

## Test matrix

| Case | Kết quả mong đợi |
| --- | --- |
| Happy path | Success và state/output đúng |
| Missing signer/auth | Authorization error có cấu trúc |
| Wrong PDA/account/input | Constraint/validation error |
| Boundary/replay | Hành vi xác định và state rollback |

## Security review

Authorities, ownership, seeds, mints, arithmetic, CPI/external targets, replay/idempotency, close và retry behavior.
