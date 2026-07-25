# Stablecoin Lite

Protocol token giáo dục có admin, roles, pause, mint/burn và Token-2022 concepts; đây không phải hạ tầng stablecoin production.

Mã nguồn: [starter](./starter/README.md) → [checkpoint 1](./checkpoint-1/README.md) → [checkpoint 2](./checkpoint-2/README.md) → [final](./final/README.md).

![Stablecoin flow](../../notes/images/stablecoin-flow.png)

## State

| Account | Seeds | Fields |
| --- | --- | --- |
| Config | `['config', mint]` | admin, paused, mint, total cap |
| Minter allowance | `['minter', config, minter]` | minter, remaining allowance |

## Instructions

- khởi tạo configuration;
- cấp/thu hồi minter allowance;
- pause/unpause;
- mint có phân quyền trong allowance/cap;
- holder tự burn;
- thảo luận tùy chọn freeze/force-transfer, mặc định tắt.

## Signer, writable và owner

| Write path | Signer/authority | State mutable | External owner/program |
| --- | --- | --- | --- |
| `initialize_config` | admin; config PDA phải là mint authority | Config | System Program, Token Program |
| `set_minter` | Config admin | Allowance | System Program |
| `set_paused` | Config admin | Config | Stablecoin Lite Program |
| `authorized_mint` | minter | Allowance, Config, Mint, destination token account | Token Program qua checked CPI |
| `burn` | token holder | Mint, holder token account | Token Program qua checked CPI |

```mermaid
flowchart LR
    Admin --> Config[Config PDA]
    Config --> Allowance[Minter allowance PDA]
    Minter --> Allowance
    Allowance --> Mint[Token mint]
```

## Các trạng thái

- `starter`: config schema và threat model
- `checkpoint-1`: khởi tạo và quản lý role
- `checkpoint-2`: pause và mint có phân quyền
- `final`: burn, logic test, integration-test matrix và ghi chú Token-2022

## Test bắt buộc

Kiểm thử quyền admin/minter, trạng thái pause, dùng hết allowance, cap boundary, sai mint, burn accounting và thu hồi role.

## Tài nguyên sơ đồ

[Mở Mermaid source](../../notes/images/stablecoin-flow.mmd) để chỉnh sửa sơ đồ.
