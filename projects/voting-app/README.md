# Voting App

Tạo poll có time window, đăng ký candidate và ghi vote. Final dùng VoteReceipt để giới hạn một vote cho mỗi wallet/poll.

![Voting flow](../../notes/images/voting-flow.png)

## Mô hình state

| Account | PDA seeds | Key fields |
| --- | --- | --- |
| Poll | `['poll', poll_id]` | authority, title, start/end, candidate count |
| Candidate | `['candidate', poll, name/hash]` | poll, name, votes |
| Vote receipt | `['vote', poll, voter]` | poll, voter, candidate |

```mermaid
flowchart TB
    Authority --> Poll[Poll PDA]
    Poll --> C1[Candidate PDA]
    Poll --> C2[Candidate PDA]
    Voter --> Receipt[Vote receipt PDA]
    Receipt --> C1
```

## Instructions

| Instruction | Signer | Important validation |
| --- | --- | --- |
| `initialize_poll` | authority | start < end, bounded title |
| `add_candidate` | authority | poll authority, before start, unique PDA |
| `vote` | voter | poll active, candidate belongs to poll, no receipt |

## Signer, writable và owner

| Write path | Signer | State mutable | Owner/relationship |
| --- | --- | --- | --- |
| `initialize_poll` | authority | Poll | Voting Program; PDA theo `poll_id` |
| `add_candidate` | authority | Poll, Candidate | `poll.authority == authority`; Candidate thuộc Poll |
| `vote` | voter | Candidate, VoteReceipt | Candidate thuộc Poll; receipt theo Poll/Voter |

## Các trạng thái

- `starter`: state types và mô tả test
- `checkpoint-1`: tạo poll
- `checkpoint-2`: candidate và PDA schema
- `final`: voting, receipt, bộ integration test và Voting Frontend tham khảo

## Test bắt buộc

- tạo poll và candidate;
- lỗi authority và time window;
- vote count chính xác;
- từ chối candidate không thuộc poll;
- từ chối vote trùng;
- frontend derive đúng cùng các PDA.

## Tài nguyên sơ đồ

[Mở Mermaid source](../../notes/images/voting-flow.mmd) để chỉnh sửa sơ đồ.
