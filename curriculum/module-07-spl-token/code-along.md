# SPL Token Basics — Code-along từng bước

Bài này viết lại [SPL Token Basics](../../projects/token-basics/README.md) từ một thư mục trống, theo đúng thứ tự video Module 7. Mỗi bước gõ một đoạn ngắn rồi type-check, test hoặc chạy ngay. Bước cuối ra đúng code `final` (`src/` và `tests/`); `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần Solana CLI 4.1.2 (có sẵn `solana-test-validator` và `spl-token`), Node 24 và pnpm theo [docs/setup.md](../../docs/setup.md). Project này là client TypeScript gọi thẳng SPL Token Program, không có program Anchor riêng.

<a id="token-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học, cạnh các lab trước. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs/token-basics
cd ~/code/bootcamp-labs/token-basics
mkdir src tests
```

### 0a. `package.json` và các script

**Tạo file `package.json`** ở gốc project:

<!-- file: package.json; mode: replace -->
```json
{
  "name": "token-basics",
  "private": true,
  "license": "MIT",
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "lab": "tsx src/token-lifecycle.ts",
    "test": "vitest run amounts",
    "test:chain": "vitest run token-rules"
  }
}
```

```bash
pnpm install
```

Kết quả: `Already up to date`, có thêm `pnpm-lock.yaml`. Bốn script: `check` type-check, `lab` chạy client, `test` chạy unit test của amount (không cần validator), `test:chain` chạy test trên validator local.

### 0b. Dependencies

**Trong `package.json`, thay dòng `  }` đóng khối `scripts`** bằng:

<!-- file: package.json; mode: replace-line; anchor:   } -->
```json
  },
  "dependencies": {
    "@solana/spl-token": "0.4.15",
    "@solana/web3.js": "1.98.4"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.3",
    "vitest": "^3.0.0"
  }
```

```bash
pnpm install
```

Hai thư viện Solana được khóa đúng phiên bản; bốn công cụ dev dùng khoảng `^`. File giờ giống `final/package.json`, chỉ khác `name`.

### 0c. `tsconfig.json`

**Tạo file `tsconfig.json`** ở gốc project:

<!-- file: tsconfig.json; mode: replace -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

Chưa chạy `pnpm run check` ở bước này: `src` và `tests` còn trống nên `tsc` báo `No inputs were found`.

<a id="token-1"></a>
## Bước 1 — Amount bằng `bigint`

**Khái niệm:** [Mint account, decimals](./lessons.md#71-mint-account) · [Luồng client lab](./lessons.md#luồng-client-lab)

### 1a. `toBaseUnits`

**Tạo file `src/amounts.ts`:**

<!-- file: src/amounts.ts; mode: replace -->
```ts
export function toBaseUnits(amount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("decimals không hợp lệ");
  if (!/^\d+(\.\d+)?$/.test(amount)) throw new Error("amount phải là số dương dạng thập phân");

  const [whole, fraction = ""] = amount.split(".");
  if (fraction.length > decimals) throw new Error("amount có quá nhiều chữ số thập phân");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
}
```

Chạy `pnpm run check`: không in lỗi.

### 1b. Test `toBaseUnits`

**Tạo file `tests/amounts.test.ts`:**

<!-- file: tests/amounts.test.ts; mode: replace -->
```ts
import { describe, expect, it } from "vitest";
import { toBaseUnits } from "../src/amounts.js";

describe("token amounts", () => {
  it("chuyển UI amount sang base units mà không dùng float", () => {
    expect(toBaseUnits("25.125", 6)).toBe(25_125_000n);
  });

  it("từ chối precision vượt decimals", () => {
    expect(() => toBaseUnits("1.0000001", 6)).toThrow(/quá nhiều/);
  });
});
```

Chạy `pnpm test`: `Tests  2 passed (2)`.

### 1c. Supply bằng tổng balance

**Thêm vào cuối `src/amounts.ts`:**

<!-- file: src/amounts.ts; mode: append -->
```ts

export function assertSupplyInvariant(supply: bigint, balances: bigint[]): void {
  const total = balances.reduce((sum, balance) => sum + balance, 0n);
  if (supply !== total) throw new Error(`supply ${supply} khác tổng balance ${total}`);
}
```

**Trong `tests/amounts.test.ts`, thay dòng import thứ hai** bằng:

<!-- file: tests/amounts.test.ts; mode: replace-line; anchor: import { toBaseUnits } from "../src/amounts.js"; -->
```ts
import { assertSupplyInvariant, toBaseUnits } from "../src/amounts.js";
```

**Chèn trước dòng `});` cuối file:**

<!-- file: tests/amounts.test.ts; mode: insert-before; anchor: }); -->
```ts

  it("kiểm tra supply bằng tổng token accounts", () => {
    expect(() => assertSupplyInvariant(95n, [75n, 20n])).not.toThrow();
    expect(() => assertSupplyInvariant(96n, [75n, 20n])).toThrow(/khác/);
  });
```

Chạy `pnpm test`: `Tests  3 passed (3)`. `tests/amounts.test.ts` và `src/amounts.ts` giờ giống `final`.

<a id="token-2"></a>
## Bước 2 — Validator local, mint và ATA

**Khái niệm:** [Token account](./lessons.md#72-token-account) · [ATA](./lessons.md#73-associated-token-account) · [Create mint](./lessons.md#75-create-mint)

### 2a. Chạy validator local

Mở **terminal thứ hai**, chạy validator ở thư mục `bootcamp-labs` để thư mục `test-ledger` không nằm trong project:

```bash
cd ~/code/bootcamp-labs
solana-test-validator --reset
```

Để terminal này chạy suốt các bước còn lại. Mọi lệnh khác chạy ở terminal đầu, tại `~/code/bootcamp-labs/token-basics`.

### 2b. Kết nối và airdrop cho payer

**Tạo file `src/token-lifecycle.ts`:**

<!-- file: src/token-lifecycle.ts; mode: replace -->
```ts
import { Connection, Keypair } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899";

async function main(): Promise<void> {
  const connection = new Connection(RPC_URL, "confirmed");
  const payer = Keypair.generate();

  const airdrop = await connection.requestAirdrop(payer.publicKey, 2_000_000_000);
  await connection.confirmTransaction(airdrop, "confirmed");
  console.log("payer lamports:", await connection.getBalance(payer.publicKey));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

Chạy `pnpm run lab`: in `payer lamports: 2000000000`. Dòng `console.log` là dòng tạm, các bước sau thay nó.

### 2c. Tạo mint

**Thêm lên đầu `src/token-lifecycle.ts`:**

<!-- file: src/token-lifecycle.ts; mode: prepend -->
```ts
import {
  createMint,
} from "@solana/spl-token";
```

**Chèn sau dòng `const RPC_URL = ...`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor: const RPC_URL = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899"; -->
```ts
const DECIMALS = 6;
```

**Thay dòng tạm `console.log("payer lamports:", ...)`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor:   console.log("payer lamports:", await connection.getBalance(payer.publicKey)); -->
```ts

  const mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
  console.log("mint:", mint.toBase58());
```

Chạy `pnpm run lab`: in `mint: <địa chỉ>`. Xem mint vừa tạo bằng CLI (thay `<địa chỉ mint>` bằng địa chỉ vừa in):

```bash
spl-token display <địa chỉ mint> --url localhost
```

Kết quả: `Supply: 0`, `Decimals: 6`, `Mint authority:` là địa chỉ payer, `Freeze authority: (not set)`.

### 2d. Hai ATA của Alice và Bob

**Trong khối import `@solana/spl-token`, chèn sau dòng `  createMint,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   createMint, -->
```ts
  getOrCreateAssociatedTokenAccount,
```

**Chèn sau dòng `const payer = Keypair.generate();`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   const payer = Keypair.generate(); -->
```ts
  const alice = Keypair.generate();
  const bob = Keypair.generate();
```

**Thay dòng tạm `console.log("mint:", ...)`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor:   console.log("mint:", mint.toBase58()); -->
```ts
  const aliceAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, alice.publicKey);
  const bobAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, bob.publicKey);
  console.log("alice ata:", aliceAta.address.toBase58(), aliceAta.mint.equals(mint), aliceAta.owner.equals(alice.publicKey));
```

Chạy `pnpm run lab`: in `alice ata: <địa chỉ> true true` — ATA của Alice thuộc đúng mint và đúng owner. File giờ cùng trạng thái `checkpoint-1` (trừ dòng tạm).

<a id="token-3"></a>
## Bước 3 — Mint và transfer checked

**Khái niệm:** [Mint token](./lessons.md#76-mint-token) · [Transfer](./lessons.md#77-transfer)

### 3a. Mint 100 token cho Alice

**Trong khối import `@solana/spl-token`, chèn sau dòng `  createMint,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   createMint, -->
```ts
  getAccount,
```

**Chèn sau dòng `  getOrCreateAssociatedTokenAccount,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   getOrCreateAssociatedTokenAccount, -->
```ts
  mintToChecked,
```

**Chèn sau dòng `import { Connection, Keypair } from "@solana/web3.js";`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor: import { Connection, Keypair } from "@solana/web3.js"; -->
```ts
import { toBaseUnits } from "./amounts.js";
```

**Thay dòng tạm `console.log("alice ata:", ...)`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor:   console.log("alice ata:", aliceAta.address.toBase58(), aliceAta.mint.equals(mint), aliceAta.owner.equals(alice.publicKey)); -->
```ts

  await mintToChecked(connection, payer, mint, aliceAta.address, payer, toBaseUnits("100", DECIMALS), DECIMALS);
  console.log("alice:", (await getAccount(connection, aliceAta.address)).amount);
```

Chạy `pnpm run lab`: in `alice: 100000000n` (100 token × 10^6).

### 3b. Chuyển 25 token sang Bob

**Chèn sau dòng `  mintToChecked,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   mintToChecked, -->
```ts
  transferChecked,
```

**Thay dòng tạm `console.log("alice:", ...)`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor:   console.log("alice:", (await getAccount(connection, aliceAta.address)).amount); -->
```ts
  await transferChecked(connection, payer, aliceAta.address, mint, bobAta.address, alice, toBaseUnits("25", DECIMALS), DECIMALS);
  console.log("alice:", (await getAccount(connection, aliceAta.address)).amount, "bob:", (await getAccount(connection, bobAta.address)).amount);
```

Chạy `pnpm run lab`: in `alice: 75000000n bob: 25000000n`. Cùng trạng thái `checkpoint-2` (trừ dòng tạm).

<a id="token-4"></a>
## Bước 4 — Burn, đọc state, thu hồi authority

**Khái niệm:** [Burn](./lessons.md#78-burn) · [Đọc balance](./lessons.md#79-token-ui) · [Authorities](./lessons.md#74-authorities)

### 4a. Burn 5 token của Bob

**Chèn trước dòng `  createMint,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-before; anchor:   createMint, -->
```ts
  burnChecked,
```

**Thay dòng tạm `console.log("alice:", ..., "bob:", ...)`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor:   console.log("alice:", (await getAccount(connection, aliceAta.address)).amount, "bob:", (await getAccount(connection, bobAta.address)).amount); -->
```ts
  await burnChecked(connection, payer, bobAta.address, mint, bob, toBaseUnits("5", DECIMALS), DECIMALS);
  console.log("bob:", (await getAccount(connection, bobAta.address)).amount);
```

Chạy `pnpm run lab`: in `bob: 20000000n`.

### 4b. Đọc state và kiểm tra supply

**Chèn sau dòng `  getAccount,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   getAccount, -->
```ts
  getMint,
```

**Thay dòng `import { toBaseUnits } from "./amounts.js";`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor: import { toBaseUnits } from "./amounts.js"; -->
```ts
import { assertSupplyInvariant, toBaseUnits } from "./amounts.js";
```

**Thay dòng tạm `console.log("bob:", ...)`** bằng:

<!-- file: src/token-lifecycle.ts; mode: replace-line; anchor:   console.log("bob:", (await getAccount(connection, bobAta.address)).amount); -->
```ts

  const [mintState, aliceState, bobState] = await Promise.all([
    getMint(connection, mint),
    getAccount(connection, aliceAta.address),
    getAccount(connection, bobAta.address),
  ]);
  assertSupplyInvariant(mintState.supply, [aliceState.amount, bobState.amount]);

  console.table({ mint: mint.toBase58(), alice: aliceState.amount.toString(), bob: bobState.amount.toString(), supply: mintState.supply.toString() });
```

Chạy `pnpm run lab`: bảng có `alice` `75000000`, `bob` `20000000`, `supply` `95000000` (raw amount, 6 decimals: 75, 20 và 95 token). Không còn dòng tạm nào.

### 4c. Thu hồi mint authority

**Chèn trước dòng `  burnChecked,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-before; anchor:   burnChecked, -->
```ts
  AuthorityType,
```

**Chèn sau dòng `  mintToChecked,`:**

<!-- file: src/token-lifecycle.ts; mode: insert-after; anchor:   mintToChecked, -->
```ts
  setAuthority,
```

**Chèn trước dòng `  console.table(...)`:**

<!-- file: src/token-lifecycle.ts; mode: insert-before; anchor:   console.table({ mint: mint.toBase58(), alice: aliceState.amount.toString(), bob: bobState.amount.toString(), supply: mintState.supply.toString() }); -->
```ts
  await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
```

Chạy `pnpm run lab` rồi `spl-token display <địa chỉ mint trong bảng> --url localhost`: `Supply: 95000000`, `Mint authority: (not set)`. `src/token-lifecycle.ts` giờ giống `final`. Chạy `pnpm run check`: không lỗi.

<a id="token-5"></a>
## Bước 5 — Test các đường lỗi trên chain

**Khái niệm:** [Tests](./lessons.md#710-tests) · [Invariant và test matrix](./lessons.md#invariant-và-test-matrix)

Validator ở terminal thứ hai vẫn phải chạy.

### 5a. Import

**Tạo file `tests/token-rules.test.ts`:**

<!-- file: tests/token-rules.test.ts; mode: replace -->
```ts
import {
  AuthorityType,
  burnChecked,
  createMint,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
  setAuthority,
  transferChecked,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { beforeAll, describe, expect, it } from "vitest";
import { toBaseUnits } from "../src/amounts.js";
```

Chạy `pnpm run check`: không lỗi.

### 5b. Ví và địa chỉ dùng chung

**Thêm vào cuối file:**

<!-- file: tests/token-rules.test.ts; mode: append -->
```ts

const RPC_URL = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899";
const DECIMALS = 6;
const connection = new Connection(RPC_URL, "confirmed");
const payer = Keypair.generate();
const alice = Keypair.generate();
const bob = Keypair.generate();

let mint: PublicKey;
let otherMint: PublicKey;
let aliceAta: PublicKey;
let bobAta: PublicKey;
```

Chạy `pnpm run check`: không lỗi.

### 5c. Dựng state trước mọi test

**Thêm vào cuối file:**

<!-- file: tests/token-rules.test.ts; mode: append -->
```ts

describe("token rules trên validator local", { timeout: 30_000 }, () => {
  beforeAll(async () => {
    const airdrop = await connection.requestAirdrop(payer.publicKey, 2_000_000_000);
    await connection.confirmTransaction(airdrop, "confirmed");

    mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
    otherMint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
    aliceAta = (await getOrCreateAssociatedTokenAccount(connection, payer, mint, alice.publicKey)).address;
    bobAta = (await getOrCreateAssociatedTokenAccount(connection, payer, mint, bob.publicKey)).address;
    await mintToChecked(connection, payer, mint, aliceAta, payer, toBaseUnits("100", DECIMALS), DECIMALS);
  }, 60_000);
});
```

Chạy `pnpm run check`: không lỗi. Chưa chạy test vì `describe` chưa có `it` nào.

### 5d. Mint và burn trái phép

**Chèn trước dòng `});` cuối file:**

<!-- file: tests/token-rules.test.ts; mode: insert-before; anchor: }); -->
```ts

  it("chặn mint khi người ký không phải mint authority", async () => {
    await expect(
      mintToChecked(connection, payer, mint, aliceAta, alice, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x4\./);
  });

  it("chặn burn khi người ký không phải owner của token account", async () => {
    await expect(
      burnChecked(connection, payer, aliceAta, mint, bob, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x4\./);
  });
```

Chạy `pnpm run test:chain`: `Tests  2 passed (2)`. Mã `0x4` là `OwnerMismatch`, log của program ghi `Error: owner does not match`.

### 5e. Sai mint, sai decimals, vượt số dư

**Chèn trước dòng `});` cuối file:**

<!-- file: tests/token-rules.test.ts; mode: insert-before; anchor: }); -->
```ts

  it("chặn transfer khi truyền sai mint", async () => {
    await expect(
      transferChecked(connection, payer, aliceAta, otherMint, bobAta, alice, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x3\./);
  });

  it("chặn transfer khi truyền sai decimals", async () => {
    await expect(
      transferChecked(connection, payer, aliceAta, mint, bobAta, alice, toBaseUnits("1", DECIMALS), 9),
    ).rejects.toThrow(/custom program error: 0x12\./);
  });

  it("chặn transfer vượt số dư", async () => {
    await expect(
      transferChecked(connection, payer, aliceAta, mint, bobAta, alice, toBaseUnits("101", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x1\./);
  });
```

Chạy `pnpm run test:chain`: `Tests  5 passed (5)`. `0x3` là `MintMismatch`, `0x12` là `MintDecimalsMismatch`, `0x1` là `InsufficientFunds`.

### 5f. Mint sau khi thu hồi authority

**Chèn trước dòng `});` cuối file:**

<!-- file: tests/token-rules.test.ts; mode: insert-before; anchor: }); -->
```ts

  it("chặn mint sau khi thu hồi mint authority, state không đổi", async () => {
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
    await expect(
      mintToChecked(connection, payer, mint, aliceAta, payer, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x5\./);

    const [mintState, aliceState] = await Promise.all([getMint(connection, mint), getAccount(connection, aliceAta)]);
    expect(mintState.mintAuthority).toBeNull();
    expect(mintState.supply).toBe(toBaseUnits("100", DECIMALS));
    expect(aliceState.amount).toBe(toBaseUnits("100", DECIMALS));
  });
```

Chạy `pnpm run test:chain`: `Tests  6 passed (6)`. `0x5` là `FixedSupply`. Chạy thêm `pnpm test` (3 passed) và `pnpm run check`. `src/` và `tests/` giờ giống hệt `projects/token-basics/final`.
