# Private Note — Code-along từng bước

Bài này viết lại [Private Note](../../projects/private-note/README.md) từ thư mục trống, theo đúng thứ tự video Module 12. Mỗi bước gõ một đoạn ngắn rồi check, test hoặc build ngay. Bước cuối của từng tầng ra đúng code trong `projects/private-note/final`; thư mục đó chỉ để đối chiếu.

Project có ba tầng, mỗi tầng một thư mục con:

| Thư mục | Tầng | Lệnh kiểm tra |
| --- | --- | --- |
| `relation` | TypeScript executable relation, **không phải ZK** | `pnpm test`, `pnpm run check` |
| `circuit` | Noir circuit, proof thật verify local bằng Barretenberg | `nargo test`, `bb verify` |
| `privacy-app` | Anchor: mock verifier + application program qua CPI | `anchor test` |

Cần làm xong Module 3, Module 4–5 và đọc [lessons.md](./lessons.md) 12.1–12.5 trước. Tầng `circuit` cần thêm `nargo 1.0.0-beta.20` và `bb 3.0.0-nightly.20251104` (cài ở bước 5).

Quy ước khối code: dòng chú thích `<!-- file: …; mode: … -->` ngay trên mỗi khối cho biết file và cách gõ:

- `replace`: thay toàn bộ file; `append`: thêm vào cuối file, cách một dòng trống;
- `after: X` / `before: X`: chèn ngay sau / trước dòng `X` (thêm `+gap` là cách một dòng trống);
- `after: X >> Y`: tìm dòng `X`, rồi chèn sau dòng `Y` đầu tiên phía dưới nó;
- `before-last: X`: chèn trước dòng `X` cuối cùng của file;
- `replace-line: X`: thay dòng `X` bằng khối code; `replace-range: X .. Y`: thay từ dòng `X` đến dòng `Y`;
- `prepend`: thêm lên đầu file, cách một dòng trống;
- `replace-from: X`: thay từ dòng `X` đến hết file.

<a id="pn-0"></a>
## Bước 0 — Tạo project TypeScript

Tạo project ngoài repo khóa học. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs/private-note/relation
cd ~/code/bootcamp-labs/private-note/relation
echo 24 > .nvmrc
```

Tạo `package.json`:

<!-- file: relation/package.json; mode: replace -->
```json
{
  "name": "private-note-relation",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "typescript": "5.8.3",
    "vitest": "3.2.4"
  }
}
```

Tạo `tsconfig.json`:

<!-- file: relation/tsconfig.json; mode: replace -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "types": ["node", "vitest/globals"],
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

```bash
pnpm install
mkdir src tests
```

<a id="pn-1"></a>
## Bước 1 — Note và commitment

**Khái niệm:** [12.2 Note và commitment](./lessons.md#122-note-và-commitment)

### 1a. Kiểu note và hàm hash có domain tag

<!-- file: relation/src/privacy.ts; mode: replace -->
```ts
import { createHash } from "node:crypto";

export type PrivateNote = {
  secret: string;
  salt: string;
  amount: bigint;
};

function encodePart(value: string): string {
  return `${Buffer.byteLength(value, "utf8")}:${value}`;
}

function hash(domain: string, ...values: string[]): string {
  const encoded = [domain, ...values].map(encodePart).join("|");
  return createHash("sha256").update(encoded, "utf8").digest("hex");
}
```

`pnpm run check` không lỗi.

- `encodePart` ghi độ dài trước mỗi phần, nên `("ab","c")` và `("a","bc")` không bao giờ ra cùng chuỗi.
- Tham số đầu của `hash` là domain tag: cùng input nhưng khác tag (note, nullifier, Merkle node) thì ra hash khác.

### 1b. `createCommitment`

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
function requireNonEmpty(label: string, value: string): void {
  if (value.length === 0) throw new Error(`${label.toUpperCase()}_EMPTY`);
}

function requireAmount(amount: bigint): void {
  if (amount <= 0n) throw new Error("INVALID_AMOUNT");
}

export function createCommitment(note: PrivateNote): string {
  requireNonEmpty("secret", note.secret);
  requireNonEmpty("salt", note.salt);
  requireAmount(note.amount);
  return hash("privacy-note-v1", note.secret, note.salt, note.amount.toString(10));
}
```

`pnpm run check` không lỗi.

### 1c. Test đầu tiên

<!-- file: relation/tests/privacy.test.ts; mode: replace -->
```ts
import { describe, expect, it } from "vitest";
import { createCommitment, type PrivateNote } from "../src/privacy.js";

const inputNote: PrivateNote = { secret: "alice-secret", salt: "input-salt", amount: 10n };
const inputCommitment = createCommitment(inputNote);

describe("createCommitment", () => {
  it("is deterministic and binds every field", () => {
    expect(createCommitment({ ...inputNote })).toBe(inputCommitment);
    expect(createCommitment({ ...inputNote, salt: "other-salt" })).not.toBe(inputCommitment);
    expect(createCommitment({ ...inputNote, amount: 11n })).not.toBe(inputCommitment);
  });
});
```

`pnpm test`: `1 passed`.

### 1d. Input không hợp lệ

<!-- file: relation/tests/privacy.test.ts; mode: before-last: }); +gap -->
```ts
  it("rejects an empty secret and a zero amount", () => {
    expect(() => createCommitment({ ...inputNote, secret: "" })).toThrow("SECRET_EMPTY");
    expect(() => createCommitment({ ...inputNote, amount: 0n })).toThrow("INVALID_AMOUNT");
  });
```

`pnpm test`: `2 passed`.

<a id="pn-2"></a>
## Bước 2 — Merkle tree bốn leaves

**Khái niệm:** [12.3 Merkle membership](./lessons.md#123-merkle-membership-bằng-tree-bốn-leaves)

### 2a. Root của tree

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
export const TREE_DEPTH = 2;
export const TREE_LEAF_COUNT = 4;

export type MerkleProof = {
  leafIndex: number;
  siblings: string[];
};

function hashNode(left: string, right: string): string {
  return hash("privacy-merkle-node-v1", left, right);
}

export function buildMerkleRoot(leaves: readonly string[]): string {
  if (leaves.length !== TREE_LEAF_COUNT) throw new Error("INVALID_LEAF_COUNT");
  return hashNode(hashNode(leaves[0], leaves[1]), hashNode(leaves[2], leaves[3]));
}
```

### 2b. Merkle path của một leaf

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
function requireLeafIndex(leafIndex: number): void {
  if (!Number.isSafeInteger(leafIndex) || leafIndex < 0 || leafIndex >= TREE_LEAF_COUNT) {
    throw new Error("INVALID_NOTE_INDEX");
  }
}

export function buildMerkleProof(leaves: readonly string[], leafIndex: number): MerkleProof {
  if (leaves.length !== TREE_LEAF_COUNT) throw new Error("INVALID_LEAF_COUNT");
  requireLeafIndex(leafIndex);
  const levelOne = [hashNode(leaves[0], leaves[1]), hashNode(leaves[2], leaves[3])];
  const siblings = [leaves[leafIndex ^ 1], levelOne[Math.floor(leafIndex / 2) ^ 1]];
  return { leafIndex, siblings };
}
```

`leafIndex ^ 1` đảo bit cuối: leaf 0 ↔ 1, 2 ↔ 3, tức leaf đứng cặp. `Math.floor(leafIndex / 2)` là vị trí ở tầng trên.

### 2c. Tính lại root từ leaf và path

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
export function computeRootFromProof(leaf: string, proof: MerkleProof): string {
  requireLeafIndex(proof.leafIndex);
  if (proof.siblings.length !== TREE_DEPTH) throw new Error("INVALID_MERKLE_PROOF");

  let current = leaf;
  let index = proof.leafIndex;
  for (const sibling of proof.siblings) {
    current = index % 2 === 0 ? hashNode(current, sibling) : hashNode(sibling, current);
    index = Math.floor(index / 2);
  }
  return current;
}
```

`pnpm run check` không lỗi.

### 2d. Fixture: tree có note của Alice ở leaf 1

**Code 1** — thay dòng import thứ hai:

<!-- file: relation/tests/privacy.test.ts; mode: replace-line: import { createCommitment, type PrivateNote } from "../src/privacy.js"; -->
```ts
import {
  buildMerkleProof,
  buildMerkleRoot,
  computeRootFromProof,
  createCommitment,
  type PrivateNote,
} from "../src/privacy.js";
```

**Code 2** — chèn ngay sau dòng `const inputCommitment = …`:

<!-- file: relation/tests/privacy.test.ts; mode: after: const inputCommitment = createCommitment(inputNote); -->
```ts
const leaves = [
  createCommitment({ secret: "decoy-0", salt: "salt-0", amount: 3n }),
  inputCommitment,
  createCommitment({ secret: "decoy-2", salt: "salt-2", amount: 8n }),
  createCommitment({ secret: "decoy-3", salt: "salt-3", amount: 5n }),
];
const merkleProof = buildMerkleProof(leaves, 1);
const currentRoot = buildMerkleRoot(leaves);
```

`pnpm test`: vẫn `2 passed`.

### 2e. Test membership

<!-- file: relation/tests/privacy.test.ts; mode: append -->
```ts
describe("Merkle membership", () => {
  it("recomputes the root from leaf 1 and its path", () => {
    expect(merkleProof.siblings).toHaveLength(2);
    expect(computeRootFromProof(inputCommitment, merkleProof)).toBe(currentRoot);
  });

  it("gives another root for a wrong sibling or index", () => {
    const wrongSibling = { ...merkleProof, siblings: ["wrong", merkleProof.siblings[1]] };
    expect(computeRootFromProof(inputCommitment, wrongSibling)).not.toBe(currentRoot);
    const wrongIndex = { ...merkleProof, leafIndex: 0 };
    expect(computeRootFromProof(inputCommitment, wrongIndex)).not.toBe(currentRoot);
  });
});
```

`pnpm test`: `4 passed`.

### 2f. Index nằm ngoài tree

<!-- file: relation/tests/privacy.test.ts; mode: before-last: }); +gap -->
```ts
  it("rejects an index outside the tree", () => {
    expect(() => buildMerkleProof(leaves, 4)).toThrow("INVALID_NOTE_INDEX");
  });
```

`pnpm test`: `5 passed`.

<a id="pn-3"></a>
## Bước 3 — Nullifier và spend relation

**Khái niệm:** [12.4 Nullifier](./lessons.md#124-nullifier-và-replay-protection) · [12.5 Statement](./lessons.md#125-statement-witness-và-public-inputs)

### 3a. `createNullifier`

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
export function createNullifier(
  secret: string,
  noteIndex: number,
  programId: string,
  domain: string,
): string {
  requireNonEmpty("secret", secret);
  requireNonEmpty("program_id", programId);
  requireNonEmpty("domain", domain);
  requireLeafIndex(noteIndex);
  return hash("privacy-nullifier-v1", secret, noteIndex.toString(10), programId, domain);
}
```

### 3b. Witness và public inputs

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
export type SpendWitness = {
  inputNote: PrivateNote;
  outputNote: PrivateNote;
  merkleProof: MerkleProof;
};

export type PublicSpend = {
  currentRoot: string;
  nullifier: string;
  outputCommitment: string;
  programId: string;
  domain: string;
};
```

### 3c. Relation: membership

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
export function verifySpendRelation(publicSpend: PublicSpend, witness: SpendWitness): void {
  const inputCommitment = createCommitment(witness.inputNote);
  const root = computeRootFromProof(inputCommitment, witness.merkleProof);
  if (root !== publicSpend.currentRoot) throw new Error("MERKLE_ROOT_MISMATCH");
}
```

### 3d. Relation: nullifier, bảo toàn giá trị, output

Chèn trước dấu `}` cuối file (cuối hàm `verifySpendRelation`), cách một dòng trống:

<!-- file: relation/src/privacy.ts; mode: before-last: } +gap -->
```ts
  const nullifier = createNullifier(
    witness.inputNote.secret,
    witness.merkleProof.leafIndex,
    publicSpend.programId,
    publicSpend.domain,
  );
  if (nullifier !== publicSpend.nullifier) throw new Error("NULLIFIER_MISMATCH");

  if (witness.inputNote.amount !== witness.outputNote.amount) {
    throw new Error("VALUE_NOT_CONSERVED");
  }
  const outputCommitment = createCommitment(witness.outputNote);
  if (outputCommitment !== publicSpend.outputCommitment) {
    throw new Error("OUTPUT_COMMITMENT_MISMATCH");
  }
```

`pnpm run check` không lỗi.

### 3e. Fixture của một spend hợp lệ

**Code 1** — thay cả khối import thứ hai (từ `import {` đến `} from "../src/privacy.js";`):

<!-- file: relation/tests/privacy.test.ts; mode: replace-range: import { .. } from "../src/privacy.js"; -->
```ts
import {
  buildMerkleProof,
  buildMerkleRoot,
  computeRootFromProof,
  createCommitment,
  createNullifier,
  verifySpendRelation,
  type PrivateNote,
  type PublicSpend,
  type SpendWitness,
} from "../src/privacy.js";
```

**Code 2** — chèn ngay sau dòng `const currentRoot = …`:

<!-- file: relation/tests/privacy.test.ts; mode: after: const currentRoot = buildMerkleRoot(leaves); -->
```ts
const programId = "Privacy111111111111111111111111111111111";
const domain = "localnet:module-12:v1";
const outputNote: PrivateNote = { secret: "alice-next-secret", salt: "output-salt", amount: 10n };

function fixture(): { publicSpend: PublicSpend; witness: SpendWitness } {
  return {
    publicSpend: {
      currentRoot,
      nullifier: createNullifier(inputNote.secret, 1, programId, domain),
      outputCommitment: createCommitment(outputNote),
      programId,
      domain,
    },
    witness: { inputNote, outputNote, merkleProof },
  };
}
```

`pnpm test`: vẫn `5 passed`.

### 3f. Witness hợp lệ được chấp nhận

<!-- file: relation/tests/privacy.test.ts; mode: append -->
```ts
describe("private-note spend relation", () => {
  it("accepts a valid witness", () => {
    const { publicSpend, witness } = fixture();
    expect(() => verifySpendRelation(publicSpend, witness)).not.toThrow();
  });
});
```

`pnpm test`: `6 passed`.

### 3g. Đổi một phần witness thì bị từ chối

<!-- file: relation/tests/privacy.test.ts; mode: before-last: }); +gap -->
```ts
  it.each([
    ["secret", { inputNote: { ...inputNote, secret: "wrong" } }, "MERKLE_ROOT_MISMATCH"],
    ["salt", { inputNote: { ...inputNote, salt: "wrong" } }, "MERKLE_ROOT_MISMATCH"],
    ["amount", { inputNote: { ...inputNote, amount: 11n } }, "MERKLE_ROOT_MISMATCH"],
    [
      "Merkle path",
      { merkleProof: { ...merkleProof, siblings: ["wrong", merkleProof.siblings[1]] } },
      "MERKLE_ROOT_MISMATCH",
    ],
  ])("rejects a changed %s", (_label, patch, error) => {
    const { publicSpend, witness } = fixture();
    expect(() => verifySpendRelation(publicSpend, { ...witness, ...patch })).toThrow(error);
  });
```

`pnpm test`: `10 passed`.

### 3h. Đổi public input và tạo thêm tiền

<!-- file: relation/tests/privacy.test.ts; mode: before-last: }); +gap -->
```ts
  it("rejects a changed root or domain", () => {
    const { publicSpend, witness } = fixture();
    expect(() =>
      verifySpendRelation({ ...publicSpend, currentRoot: "wrong-root" }, witness),
    ).toThrow("MERKLE_ROOT_MISMATCH");
    expect(() => verifySpendRelation({ ...publicSpend, domain: "devnet:v1" }, witness)).toThrow(
      "NULLIFIER_MISMATCH",
    );
  });

  it("rejects output inflation", () => {
    const { publicSpend, witness } = fixture();
    const inflated = { ...witness, outputNote: { ...outputNote, amount: 11n } };
    expect(() => verifySpendRelation(publicSpend, inflated)).toThrow("VALUE_NOT_CONSERVED");
  });
```

`pnpm test`: `12 passed`.

<a id="pn-4"></a>
## Bước 4 — State: consume một lần, nguyên tử

**Khái niệm:** [12.8 Atomic consume](./lessons.md#128-atomic-consume-và-cpi)

### 4a. `PrivacyState`

<!-- file: relation/src/privacy.ts; mode: append -->
```ts
export class PrivacyState {
  readonly #usedNullifiers = new Set<string>();
  readonly #outputCommitments: string[] = [];

  constructor(readonly currentRoot: string) {
    requireNonEmpty("current_root", currentRoot);
  }

  get outputCommitments(): readonly string[] {
    return [...this.#outputCommitments];
  }

  hasConsumed(nullifier: string): boolean {
    return this.#usedNullifiers.has(nullifier);
  }
}
```

### 4b. `consume`

Chèn trước dấu `}` cuối file (cuối class), cách một dòng trống:

<!-- file: relation/src/privacy.ts; mode: before-last: } +gap -->
```ts
  consume(publicSpend: PublicSpend, witness: SpendWitness): void {
    if (publicSpend.currentRoot !== this.currentRoot) throw new Error("STALE_ROOT");
    if (this.#usedNullifiers.has(publicSpend.nullifier)) throw new Error("NULLIFIER_REPLAY");

    // Kiểm tra hết trước khi đổi state, giống một transaction nguyên tử.
    verifySpendRelation(publicSpend, witness);
    this.#usedNullifiers.add(publicSpend.nullifier);
    this.#outputCommitments.push(publicSpend.outputCommitment);
  }
```

`pnpm run check` không lỗi.

### 4c. Consume một lần, lần hai bị chặn

**Code 1** — chèn ngay sau dòng `import {` (dòng import thứ hai):

<!-- file: relation/tests/privacy.test.ts; mode: after: import { -->
```ts
  PrivacyState,
```

**Code 2** — thêm vào cuối file:

<!-- file: relation/tests/privacy.test.ts; mode: append -->
```ts
describe("PrivacyState.consume", () => {
  it("consumes once and records the output", () => {
    const { publicSpend, witness } = fixture();
    const state = new PrivacyState(currentRoot);
    state.consume(publicSpend, witness);

    expect(state.hasConsumed(publicSpend.nullifier)).toBe(true);
    expect(state.outputCommitments).toEqual([publicSpend.outputCommitment]);
    expect(() => state.consume(publicSpend, witness)).toThrow("NULLIFIER_REPLAY");
  });
});
```

`pnpm test`: `13 passed`.

### 4d. Lỗi thì không đổi state

<!-- file: relation/tests/privacy.test.ts; mode: before-last: }); +gap -->
```ts
  it("does not mutate state when verification fails", () => {
    const { publicSpend, witness } = fixture();
    const state = new PrivacyState(currentRoot);
    const invalid = { ...witness, outputNote: { ...outputNote, amount: 11n } };

    expect(() => state.consume(publicSpend, invalid)).toThrow("VALUE_NOT_CONSERVED");
    expect(state.hasConsumed(publicSpend.nullifier)).toBe(false);
    expect(state.outputCommitments).toEqual([]);
  });

  it("rejects a stale root before mutation", () => {
    const { publicSpend, witness } = fixture();
    const state = new PrivacyState("new-root");
    expect(() => state.consume(publicSpend, witness)).toThrow("STALE_ROOT");
    expect(state.outputCommitments).toEqual([]);
  });
```

`pnpm test`: `15 passed`; `pnpm run check` không lỗi. Tầng `relation` giờ giống `final/relation`.

<a id="pn-5"></a>
## Bước 5 — Noir circuit

**Khái niệm:** [12.6 Từ TypeScript sang Noir](./lessons.md#126-từ-typescript-relation-sang-noir-circuit)

### 5a. Cài nargo và bb đúng phiên bản

Mở [noir-lang.org → Getting Started → Quick Start](https://noir-lang.org/docs/getting_started/quick_start). Chạy lệnh cài `noirup` trên trang đó, mở terminal mới, rồi chọn phiên bản của khóa học:

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup -v 1.0.0-beta.20
nargo --version
```

Cùng trang có lệnh cài `bbup` (Barretenberg). Mở terminal mới rồi:

```bash
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
bbup -v 3.0.0-nightly.20251104
bb --version
```

macOS, Linux và WSL dùng cùng lệnh. Trên Windows chạy trong Ubuntu của WSL.

### 5b. Tạo project Noir

```bash
cd ~/code/bootcamp-labs/private-note
nargo new circuit
cd circuit
```

Trong `Nargo.toml`, chèn sau dòng `authors = [""]`:

<!-- file: circuit/Nargo.toml; mode: after: authors = [""] -->
```toml
compiler_version = ">=1.0.0-beta.20"
```

`nargo check`: không lỗi, và sinh `Prover.toml`.

### 5c. Ba hàm hash

Thêm lên đầu `src/main.nr`, giữ nguyên hàm `main` mẫu bên dưới:

<!-- file: circuit/src/main.nr; mode: prepend -->
```rust
global TREE_DEPTH: u32 = 2;

fn note_commitment(secret: Field, salt: Field, amount: u64) -> Field {
    std::hash::pedersen_hash([secret, salt, amount as Field])
}

fn nullifier(secret: Field, leaf_index: u8, domain: Field) -> Field {
    std::hash::pedersen_hash([secret, leaf_index as Field, domain])
}

fn merkle_node(left: Field, right: Field) -> Field {
    std::hash::pedersen_hash([left, right])
}
```

`nargo check`: không lỗi, có cảnh báo hàm chưa dùng.

### 5d. Tính root từ leaf và path

Chèn ngay trên dòng `fn main(` mẫu, cách một dòng trống:

<!-- file: circuit/src/main.nr; mode: before: fn main(x: Field, y: pub Field) { +gap -->
```rust
fn compute_root(leaf: Field, leaf_index: u8, siblings: [Field; TREE_DEPTH]) -> Field {
    assert(leaf_index < 4, "leaf index outside depth-2 tree");

    let level_one = if (leaf_index & 1) == 0 {
        merkle_node(leaf, siblings[0])
    } else {
        merkle_node(siblings[0], leaf)
    };

    if (leaf_index & 2) == 0 {
        merkle_node(level_one, siblings[1])
    } else {
        merkle_node(siblings[1], level_one)
    }
}
```

### 5e. `main`: witness, public inputs và membership

Xóa từ dòng `fn main(x: Field, y: pub Field) {` đến hết file (hàm mẫu và test mẫu), gõ:

<!-- file: circuit/src/main.nr; mode: replace-from: fn main(x: Field, y: pub Field) { -->
```rust
fn main(
    secret: Field,
    salt: Field,
    input_amount: u64,
    leaf_index: u8,
    siblings: [Field; TREE_DEPTH],
    output_secret: Field,
    output_salt: Field,
    output_amount: u64,
    current_root: pub Field,
    expected_nullifier: pub Field,
    output_commitment: pub Field,
    domain: pub Field,
) {
    let input_commitment = note_commitment(secret, salt, input_amount);
    assert_eq(compute_root(input_commitment, leaf_index, siblings), current_root);
}
```

`nargo check`: không lỗi, cảnh báo các tham số chưa dùng.

### 5f. Nullifier, bảo toàn giá trị, output

<!-- file: circuit/src/main.nr; mode: after: assert_eq(compute_root(input_commitment, leaf_index, siblings), current_root); -->
```rust
    assert_eq(nullifier(secret, leaf_index, domain), expected_nullifier);
    assert_eq(input_amount, output_amount, "value must be conserved");
    assert_eq(
        note_commitment(output_secret, output_salt, output_amount),
        output_commitment,
    );
```

### 5g. Test witness hợp lệ

<!-- file: circuit/src/main.nr; mode: append -->
```rust
fn public_inputs() -> (Field, Field, Field) {
    let leaf = note_commitment(11, 22, 10);
    let root = compute_root(leaf, 1, [101, 202]);
    (root, nullifier(11, 1, 2026), note_commitment(33, 44, 10))
}

#[test]
fn accepts_valid_witness() {
    let (root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 10, root, nf, output, 2026);
}
```

`nargo test`: `1 test passed`.

<a id="pn-6"></a>
## Bước 6 — Test ràng buộc và proof thật

### 6a. Sai secret, sai path

<!-- file: circuit/src/main.nr; mode: append -->
```rust
#[test(should_fail)]
fn rejects_wrong_secret() {
    let (root, nf, output) = public_inputs();
    main(99, 22, 10, 1, [101, 202], 33, 44, 10, root, nf, output, 2026);
}

#[test(should_fail)]
fn rejects_wrong_merkle_path() {
    let (root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [999, 202], 33, 44, 10, root, nf, output, 2026);
}
```

`nargo test`: `3 tests passed`.

### 6b. Sai root, sai nullifier, tạo thêm tiền

<!-- file: circuit/src/main.nr; mode: append -->
```rust
#[test(should_fail)]
fn rejects_wrong_root() {
    let (_root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 10, 999, nf, output, 2026);
}

#[test(should_fail)]
fn rejects_wrong_nullifier() {
    let (root, _nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 10, root, 999, output, 2026);
}

#[test(should_fail)]
fn rejects_amount_inflation() {
    let (root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 11, root, nf, output, 2026);
}
```

`nargo test`: `6 tests passed`. Tầng `circuit/src/main.nr` còn thiếu test in giá trị ở 6c.

### 6c. In ba public input

<!-- file: circuit/src/main.nr; mode: append -->
```rust
#[test]
fn print_public_inputs() {
    let (root, nf, output) = public_inputs();
    std::println(root);
    std::println(nf);
    std::println(output);
}
```

```bash
nargo test --show-output print_public_inputs
```

In ra ba số hex: root, nullifier, output commitment. `src/main.nr` giờ giống `final/circuit/src/main.nr`.

### 6d. Prover.toml và witness

**Thay toàn bộ `Prover.toml`**, ba dòng có `0x…` dán đúng ba số vừa in theo thứ tự:

```toml
secret = "11"
salt = "22"
input_amount = "10"
leaf_index = "1"
siblings = ["101", "202"]
output_secret = "33"
output_salt = "44"
output_amount = "10"
current_root = "0x…"
expected_nullifier = "0x…"
output_commitment = "0x…"
domain = "2026"
```

`Prover.toml` chứa private witness: không commit file này.

```bash
nargo execute
ls target
```

Sinh `target/circuit.json` (circuit đã compile) và `target/circuit.gz` (witness).

### 6e. Tạo và verify proof

```bash
bb prove -b ./target/circuit.json -w ./target/circuit.gz --write_vk -o target
bb verify -p ./target/proof -k ./target/vk
```

`bb verify` báo proof hợp lệ.

### 6f. Sửa một byte của proof

```bash
cp target/proof target/proof.bak
printf '\x01' | dd of=target/proof bs=1 seek=100 conv=notrunc
bb verify -p ./target/proof -k ./target/vk
mv target/proof.bak target/proof
bb verify -p ./target/proof -k ./target/vk
```

`bb verify` thất bại với proof đã sửa; trả proof cũ về thì verify lại được.

<a id="pn-7"></a>
## Bước 7 — Anchor workspace và mock verifier

**Khái niệm:** [12.7 Solana verification boundary](./lessons.md#127-solana-verification-boundary)

### 7a. Tạo workspace hai program

```bash
cd ~/code/bootcamp-labs/private-note
anchor init privacy-app --template single --package-manager pnpm --test-template mocha --no-install
cd privacy-app
anchor new mock-verifier --template single
```

Khóa phiên bản như Module 6:

- `rust-toolchain.toml` phải có `channel = "1.89.0"`; tạo `.nvmrc` chứa `24`.
- Trong `Anchor.toml`, section `[toolchain]` có `anchor_version = "1.2.1"`, `solana_version = "4.1.2"`, `package_manager = "pnpm"`.
- Trong `[provider]`, giữ `cluster = "localnet"` và đặt `wallet = "~/.config/solana/bootcamp-devnet.json"`.
- Hai file `programs/*/Cargo.toml` có `anchor-lang = "1.2.1"`; `package.json` có `@anchor-lang/core` `"1.2.1"`.

```bash
pnpm install
anchor keys sync
anchor build
```

`anchor keys sync` ghi Program ID của máy bạn vào hai `declare_id!` và `Anchor.toml`; final dùng ID khác, không chép.

### 7b. Khung `mock_verifier`

**Thay toàn bộ `programs/mock-verifier/src/lib.rs`**, giữ nguyên địa chỉ trong `declare_id!` của bạn:

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: replace -->
```rust
use anchor_lang::prelude::*;

declare_id!("mBKqcnGotbsSb5vNrdyhzZ5EhqZdids9QYiTRckvi7v");

/// CHỈ ĐỂ HỌC: program này không verify proof mật mã nào.
/// Nó mô phỏng account boundary mà một verifier thật sẽ có.
#[program]
pub mod mock_verifier {
    use super::*;
}
```

`anchor build`: được, cảnh báo `unused import`.

### 7c. Context do verifier sở hữu

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: append -->
```rust
#[account]
#[derive(InitSpace)]
pub struct VerifiedContext {
    pub authority: Pubkey,
    pub root: [u8; 32],
    pub nullifier: [u8; 32],
    pub output_commitment: [u8; 32],
    pub domain: [u8; 32],
    pub bump: u8,
}
```

### 7d. Account của `verify_fixture`

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: append -->
```rust
#[derive(Accounts)]
#[instruction(_root: [u8; 32], nullifier: [u8; 32])]
pub struct VerifyFixture<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + VerifiedContext::INIT_SPACE,
        seeds = [b"verified", authority.key().as_ref(), nullifier.as_ref()],
        bump
    )]
    pub verified_context: Account<'info, VerifiedContext>,
    pub system_program: Program<'info, System>,
}
```

### 7e. `verify_fixture`

Trong `pub mod mock_verifier`, chèn ngay dưới `use super::*;`, cách một dòng trống:

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: after: use super::*; +gap -->
```rust
    pub fn verify_fixture(
        ctx: Context<VerifyFixture>,
        root: [u8; 32],
        nullifier: [u8; 32],
        output_commitment: [u8; 32],
        domain: [u8; 32],
    ) -> Result<()> {
        let verified = &mut ctx.accounts.verified_context;
        verified.authority = ctx.accounts.authority.key();
        verified.root = root;
        verified.nullifier = nullifier;
        verified.output_commitment = output_commitment;
        verified.domain = domain;
        verified.bump = ctx.bumps.verified_context;
        Ok(())
    }
```

`anchor build`: sạch.

### 7f. Lỗi của verifier

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: append -->
```rust
#[error_code]
pub enum MockVerifierError {
    #[msg("Verified context authority does not match")]
    AuthorityMismatch,
    #[msg("Verified context root does not match")]
    RootMismatch,
    #[msg("Verified context nullifier does not match")]
    NullifierMismatch,
    #[msg("Verified context output commitment does not match")]
    OutputMismatch,
    #[msg("Verified context domain does not match")]
    DomainMismatch,
}
```

### 7g. `assert_context`: điểm CPI

**Code 1** — chèn ngay trên dòng `#[error_code]`, cách một dòng trống:

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: before: #[error_code] +gap -->
```rust
#[derive(Accounts)]
pub struct AssertContext<'info> {
    pub authority: Signer<'info>,
    pub verified_context: Account<'info, VerifiedContext>,
}
```

**Code 2** — trong module, chèn sau `Ok(())` và `}` của `verify_fixture`, cách một dòng trống:

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: after: verified.bump = ctx.bumps.verified_context; >>     } +gap -->
```rust
    pub fn assert_context(
        ctx: Context<AssertContext>,
        root: [u8; 32],
        nullifier: [u8; 32],
        output_commitment: [u8; 32],
        domain: [u8; 32],
    ) -> Result<()> {
        let verified = &ctx.accounts.verified_context;
        require_keys_eq!(
            verified.authority,
            ctx.accounts.authority.key(),
            MockVerifierError::AuthorityMismatch
        );
        Ok(())
    }
```

`anchor build`: được, cảnh báo bốn tham số chưa dùng.

### 7h. So từng public input

<!-- file: privacy-app/programs/mock-verifier/src/lib.rs; mode: after: MockVerifierError::AuthorityMismatch >>         ); -->
```rust
        require!(verified.root == root, MockVerifierError::RootMismatch);
        require!(
            verified.nullifier == nullifier,
            MockVerifierError::NullifierMismatch
        );
        require!(
            verified.output_commitment == output_commitment,
            MockVerifierError::OutputMismatch
        );
        require!(verified.domain == domain, MockVerifierError::DomainMismatch);
```

`anchor build`: sạch. `mock-verifier/src/lib.rs` giống final (trừ `declare_id!`).

<a id="pn-8"></a>
## Bước 8 — Application program gọi verifier qua CPI

### 8a. Phụ thuộc vào crate `mock-verifier`

Trong `programs/privacy-app/Cargo.toml`:

<!-- file: privacy-app/programs/privacy-app/Cargo.toml; mode: replace-line: idl-build = ["anchor-lang/idl-build"] -->
```toml
idl-build = ["anchor-lang/idl-build", "mock-verifier/idl-build"]
```

<!-- file: privacy-app/programs/privacy-app/Cargo.toml; mode: after: anchor-lang = "1.2.1" -->
```toml
mock-verifier = { path = "../mock-verifier", features = ["cpi"] }
```

`features = ["cpi"]` cho `privacy-app` dùng client CPI của `mock-verifier` mà không kéo theo entrypoint của nó.

### 8b. Khung `privacy_app`

**Thay toàn bộ `programs/privacy-app/src/lib.rs`**, giữ nguyên `declare_id!` của bạn:

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: replace -->
```rust
use anchor_lang::prelude::*;

declare_id!("AoVsGaj8MSJ6xwKxfFxo9iZWH3enC8RRTXKH2fx2F8os");

#[program]
pub mod privacy_app {
    use super::*;
}
```

### 8c. State của application

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: append -->
```rust
#[account]
#[derive(InitSpace)]
pub struct PrivacyState {
    pub authority: Pubkey,
    pub domain: [u8; 32],
    pub current_root: [u8; 32],
    pub latest_output_commitment: [u8; 32],
    pub outputs_count: u64,
    pub bump: u8,
}
```

### 8d. Lỗi của application

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: append -->
```rust
#[error_code]
pub enum PrivacyError {
    #[msg("Domain cannot be all zeroes")]
    EmptyDomain,
    #[msg("Merkle root cannot be all zeroes")]
    EmptyRoot,
    #[msg("Nullifier cannot be all zeroes")]
    EmptyNullifier,
    #[msg("Output commitment cannot be all zeroes")]
    EmptyOutputCommitment,
    #[msg("Spend root is not the current root")]
    StaleRoot,
    #[msg("Spend domain does not match state")]
    DomainMismatch,
    #[msg("Output counter overflow")]
    CounterOverflow,
}
```

### 8e. Account của `initialize_state`

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: append -->
```rust
#[derive(Accounts)]
pub struct InitializeState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + PrivacyState::INIT_SPACE,
        seeds = [b"state", authority.key().as_ref()],
        bump
    )]
    pub state: Account<'info, PrivacyState>,
    pub system_program: Program<'info, System>,
}
```

### 8f. `initialize_state`

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: after: use super::*; +gap -->
```rust
    pub fn initialize_state(
        ctx: Context<InitializeState>,
        domain: [u8; 32],
        initial_root: [u8; 32],
    ) -> Result<()> {
        require!(domain != [0; 32], PrivacyError::EmptyDomain);
        require!(initial_root != [0; 32], PrivacyError::EmptyRoot);

        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.domain = domain;
        state.current_root = initial_root;
        state.latest_output_commitment = [0; 32];
        state.outputs_count = 0;
        state.bump = ctx.bumps.state;
        Ok(())
    }
```

`anchor build`: sạch.

### 8g. Biên lai nullifier

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: append -->
```rust
#[account]
#[derive(InitSpace)]
pub struct NullifierRecord {
    pub state: Pubkey,
    pub nullifier: [u8; 32],
    pub bump: u8,
}
```

### 8h. Account của `consume_note`

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: append -->
```rust
#[derive(Accounts)]
#[instruction(_root: [u8; 32], nullifier: [u8; 32])]
pub struct ConsumeNote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"state", authority.key().as_ref()],
        bump = state.bump,
        has_one = authority
    )]
    pub state: Account<'info, PrivacyState>,
    #[account(
        init,
        payer = authority,
        space = 8 + NullifierRecord::INIT_SPACE,
        seeds = [b"nullifier", state.key().as_ref(), nullifier.as_ref()],
        bump
    )]
    pub nullifier_record: Account<'info, NullifierRecord>,
    pub system_program: Program<'info, System>,
}
```

### 8i. `consume_note`: kiểm tra public input

Trong module, chèn sau `Ok(())` và `}` của `initialize_state`, cách một dòng trống:

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: after: state.bump = ctx.bumps.state; >>     } +gap -->
```rust
    pub fn consume_note(
        ctx: Context<ConsumeNote>,
        root: [u8; 32],
        nullifier: [u8; 32],
        output_commitment: [u8; 32],
        domain: [u8; 32],
    ) -> Result<()> {
        let state = &ctx.accounts.state;
        require!(root == state.current_root, PrivacyError::StaleRoot);
        require!(domain == state.domain, PrivacyError::DomainMismatch);
        require!(nullifier != [0; 32], PrivacyError::EmptyNullifier);
        require!(
            output_commitment != [0; 32],
            PrivacyError::EmptyOutputCommitment
        );
        todo!("ghi nullifier và output")
    }
```

`anchor build`: được.

### 8j. Ghi nullifier và output

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: replace-line:         todo!("ghi nullifier và output") -->
```rust

        let record = &mut ctx.accounts.nullifier_record;
        record.state = ctx.accounts.state.key();
        record.nullifier = nullifier;
        record.bump = ctx.bumps.nullifier_record;

        let state = &mut ctx.accounts.state;
        state.latest_output_commitment = output_commitment;
        state.outputs_count = state
            .outputs_count
            .checked_add(1)
            .ok_or(PrivacyError::CounterOverflow)?;
        Ok(())
```

`anchor build`: sạch. Program này **chưa an toàn**: ai cũng tiêu được note mà không cần proof.

### 8k. Account của verifier

**Code 1** — chèn ngay dưới dòng `use anchor_lang::prelude::*;`:

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: after: use anchor_lang::prelude::*; -->
```rust
use mock_verifier::program::MockVerifier;
```

**Code 2** — trong `ConsumeNote`, chèn ngay dưới dòng `pub nullifier_record: …`:

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: after:     pub nullifier_record: Account<'info, NullifierRecord>, -->
```rust
    pub verified_context: Account<'info, mock_verifier::VerifiedContext>,
    #[account(address = mock_verifier::ID)]
    pub verifier_program: Program<'info, MockVerifier>,
```

### 8l. CPI sang verifier trước khi ghi state

Chèn sau `require!` cuối (dòng `);` của `EmptyOutputCommitment`), cách một dòng trống:

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: after: PrivacyError::EmptyOutputCommitment >>         ); +gap -->
```rust
        let cpi_program = ctx.accounts.verifier_program.key();
        let cpi_accounts = mock_verifier::cpi::accounts::AssertContext {
            authority: ctx.accounts.authority.to_account_info(),
            verified_context: ctx.accounts.verified_context.to_account_info(),
        };
        mock_verifier::cpi::assert_context(
            CpiContext::new(cpi_program, cpi_accounts),
            root,
            nullifier,
            output_commitment,
            domain,
        )?;
```

Rồi chèn dòng chú thích ngay trên dòng `let record = …`:

<!-- file: privacy-app/programs/privacy-app/src/lib.rs; mode: before:         let record = &mut ctx.accounts.nullifier_record; -->
```rust
        // Chỉ ghi state sau khi CPI thành công; lỗi phía sau vẫn rollback cả transaction.
```

`anchor build`: sạch. Hai `lib.rs` giờ giống final (trừ `declare_id!`).

<a id="pn-9"></a>
## Bước 9 — Test ranh giới verifier

### 9a. Khung test

<!-- file: privacy-app/tests/privacy-app.ts; mode: replace -->
```ts
import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

const bytes = (fill: number): number[] => Array.from(Buffer.alloc(32, fill));

describe("privacy verifier boundary", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL.
  const mockVerifier: any = anchor.workspace.mockVerifier;
  const privacyApp: any = anchor.workspace.privacyApp;
  const authority = provider.wallet.publicKey;
  const systemProgram = anchor.web3.SystemProgram.programId;

  const domain = bytes(1);
  const root = bytes(2);
  const output = bytes(3);
});
```

`anchor test`: `0 passing`.

### 9b. Tạo state một lần trước mọi test

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  const [state] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), authority.toBuffer()],
    privacyApp.programId,
  );

  before(async () => {
    await privacyApp.methods
      .initializeState(domain, root)
      .accounts({ authority, state, systemProgram })
      .rpc();
  });
```

### 9c. Hai địa chỉ PDA theo nullifier

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  function verifiedContext(nf: number[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("verified"), authority.toBuffer(), Buffer.from(nf)],
      mockVerifier.programId,
    )[0];
  }

  function nullifierRecord(nf: number[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), state.toBuffer(), Buffer.from(nf)],
      privacyApp.programId,
    )[0];
  }
```

### 9d. Gọi verifier và gom account

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  function verify(nf: number[]) {
    return mockVerifier.methods
      .verifyFixture(root, nf, output, domain)
      .accounts({ authority, verifiedContext: verifiedContext(nf), systemProgram })
      .rpc();
  }

  function consumeAccounts(nf: number[]) {
    return {
      authority,
      state,
      nullifierRecord: nullifierRecord(nf),
      verifiedContext: verifiedContext(nf),
      verifierProgram: mockVerifier.programId,
      systemProgram,
    };
  }
```

### 9e. `expectFailure`

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  async function expectFailure(promise: Promise<unknown>, text: string) {
    try {
      await promise;
      expect.fail(`phải thất bại với: ${text}`);
    } catch (error) {
      expect(String(error)).to.contain(text);
    }
  }
```

### 9f. Consume hợp lệ

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  it("consumes a verified note exactly once", async () => {
    const nf = bytes(4);
    await verify(nf);
    await privacyApp.methods
      .consumeNote(root, nf, output, domain)
      .accounts(consumeAccounts(nf))
      .rpc();

    const stored = await privacyApp.account.privacyState.fetch(state);
    expect(stored.outputsCount.toNumber()).to.equal(1);
    expect(stored.latestOutputCommitment).to.deep.equal(output);
  });
```

`anchor test`: `1 passing`.

### 9g. Replay bị chặn

<!-- file: privacy-app/tests/privacy-app.ts; mode: after: expect(stored.latestOutputCommitment).to.deep.equal(output); +gap -->
```ts
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(consumeAccounts(nf)).rpc(),
      "already in use",
    );
```

`anchor test`: `1 passing`.

### 9h. Public input lệch thì rollback

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  it("rolls back when public inputs do not match the context", async () => {
    const nf = bytes(5);
    await verify(nf);
    await expectFailure(
      privacyApp.methods
        .consumeNote(root, nf, bytes(9), domain)
        .accounts(consumeAccounts(nf))
        .rpc(),
      "Verified context output commitment does not match",
    );
    expect(await provider.connection.getAccountInfo(nullifierRecord(nf))).to.equal(null);
  });
```

`anchor test`: `2 passing`.

### 9i. Root cũ và domain khác

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  it("rejects a stale root and a different domain", async () => {
    const nf = bytes(6);
    await verify(nf);
    await expectFailure(
      privacyApp.methods.consumeNote(bytes(8), nf, output, domain).accounts(consumeAccounts(nf)).rpc(),
      "Spend root is not the current root",
    );
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, bytes(8)).accounts(consumeAccounts(nf)).rpc(),
      "Spend domain does not match state",
    );
  });
```

`anchor test`: `3 passing`.

### 9j. Verifier giả và context giả

<!-- file: privacy-app/tests/privacy-app.ts; mode: before-last: }); +gap -->
```ts
  it("rejects a fake verifier and a fake context", async () => {
    const nf = bytes(7);
    await verify(nf);
    const fakeVerifier = { ...consumeAccounts(nf), verifierProgram: privacyApp.programId };
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(fakeVerifier).rpc(),
      "verifier_program",
    );
    const fakeContext = { ...consumeAccounts(nf), verifiedContext: state };
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(fakeContext).rpc(),
      "verified_context",
    );
  });
```

`anchor test`: `4 passing`. `tests/privacy-app.ts` giờ giống final.

## Sau code-along

- Điền [threat-model worksheet](./threat-model.md).
- Đối chiếu Token-2022 Confidential Transfers ở [lesson 12.9](./lessons.md#129-token-2022-confidential-transfers-không-phải-noir-verifier).
- Mock verifier **không** verify proof mật mã; không bao giờ deploy nó ngoài localnet.
