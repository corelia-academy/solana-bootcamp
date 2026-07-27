# Video Lab — Module 5: Testing (Anchor TS + LiteSVM TS)

Repo song song với [`../video-scripts/module-05-testing.md`](../video-scripts/module-05-testing.md). Copy self-contained của PDA Counter (Module 4) + bộ test đầy đủ theo flow của video: **cùng 5 scenario chạy trên hai runtime** để so sánh.

## Vì sao Anchor + LiteSVM song song?

| Runtime | File test | Cần validator? | Tốc độ | Dùng khi |
| --- | --- | --- | --- | --- |
| `anchor test` | `tests/anchor/*.ts` | Có (`solana-test-validator`) | ~5–10s/scenario | Chứng minh flow thật: IDL, account resolver, provider, client SDK |
| `litesvm` in-process | `tests/litesvm/*.ts` | Không | ~1–5ms/scenario | Lặp nhanh khi phát triển, fuzz, kiểm tra invariant, CI song song |

**Kết luận:** viết logic test 1 lần trên LiteSVM để dev nhanh, giữ Anchor TS làm smoke test cho luồng client thật. Cả 2 dùng chung fixture ở `tests/fixtures/`.

## Cấu trúc

```
video-labs/module-05-testing/
├── Anchor.toml               # chỉ chạy tests/anchor/**
├── Cargo.toml                # workspace
├── package.json              # scripts: test:anchor, test:litesvm, test:all
├── tsconfig.json
├── programs/pda-counter/     # program y hệt projects/pda-counter/final
├── scripts/test-anchor.sh    # spawn test-wallet + anchor test
└── tests/
    ├── fixtures/pda.ts       # deriveCounter + expectFailure (share)
    ├── anchor/pda-counter.ts # 5 TODO + BONUS chạy trên local validator
    └── litesvm/
        ├── setup.ts          # LiteSVM ctx: load .so, Anchor coder, send/expectFailure
        └── pda-counter.ts    # 5 TODO + BONUS chạy in-process, có mini-benchmark
```

## Điều kiện tiên quyết

- Rust + Solana CLI + Anchor 0.31.1 (xem `docs/setup.md` gốc bootcamp).
- Node 20+, pnpm.

## Cài + build một lần

```bash
cd video-labs/module-05-testing
pnpm install
pnpm run build          # anchor build -> sinh target/deploy/pda_counter.so + target/idl/pda_counter.json
```

LiteSVM đọc trực tiếp `target/deploy/pda_counter.so` và `target/idl/pda_counter.json`. Sau khi sửa program thì phải `pnpm run build` lại.

## Chạy test

```bash
# in-process, cực nhanh — dev loop
pnpm run test:litesvm

# full stack với local validator
pnpm run test:anchor

# cả hai
pnpm run test:all
```

Chạy 1 test cụ thể:

```bash
pnpm exec ts-mocha -p ./tsconfig.json -t 60000 tests/litesvm/**/*.ts -g "underflow"
```

## Ánh xạ với video script

| Section trong video script | File test tương ứng |
| --- | --- |
| §6 TODO 1 — happy init | `tests/anchor/pda-counter.ts` + `tests/litesvm/pda-counter.ts` — "TODO 1" |
| §7 Refactor fixture | `setupCounter` trong cả 2 file |
| §8 TODO 2 — duplicate init | "TODO 2 — duplicate initialize" |
| §9 TODO 3 — state transitions | "TODO 3 — increment, decrement, reset" |
| §10 TODO 4 — underflow + rollback | "TODO 4 — underflow" |
| §11 TODO 5 — wrong authority | "TODO 5 — wrong authority" + "BONUS — PDA của owner khác" |
| §12 Debug log | LiteSVM `expectSendFailure` in ra full `meta().logs()` khi mismatch |
| §13 LiteSVM giải thích | Toàn bộ `tests/litesvm/` là code minh hoạ |

## Điểm quan trọng khi quay

- Trước camera: `pnpm run test:litesvm` chạy < 1 giây → tạo cảm giác dev loop tức thì.
- Chuyển sang `pnpm run test:anchor` để show local validator boot và cùng test xanh.
- BONUS scenario ở LiteSVM in ra thời gian 100 increment — dùng để nhấn "LiteSVM nhanh gấp X lần so với anchor test".

## Regenerate program khi lib.rs đổi

```bash
pnpm run build && pnpm run test:all
```

Không cache `target/deploy/` như nguồn sự thật (theo tinh thần lessons 5.8).
