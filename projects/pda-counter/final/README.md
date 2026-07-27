## Cấu trúc

```
video-labs/module-05-testing/
├── Anchor.toml               # chỉ chạy tests/anchor/**
├── Cargo.toml                # workspace
├── package.json              # scripts: test:anchor, test:litesvm, test:all
├── tsconfig.json
├── programs/pda-counter/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs            # #[program] handlers + Accounts structs
│       └── state.rs          # Counter struct + pure methods + #[cfg(test)] unit tests
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
# tầng 1 — pure Rust, không cần build .so, ~ms
pnpm run test:unit
# hoặc thẳng cargo:
cargo test --manifest-path programs/pda-counter/Cargo.toml --lib

# tầng 2 — LiteSVM in-process, cần .so đã build
pnpm run test:litesvm

# tầng 3 — full stack với local validator
pnpm run test:anchor

# cả 3 tầng
pnpm run test:all
```

Chạy 1 test cụ thể:

```bash
pnpm exec ts-mocha -p ./tsconfig.json -t 60000 tests/litesvm/**/*.ts -g "underflow"
```
