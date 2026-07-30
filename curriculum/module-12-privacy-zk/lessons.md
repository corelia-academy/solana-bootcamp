# Nội dung bài học — Module 12

Module dùng duy nhất một ví dụ: Alice tiêu private note 10 đơn vị và tạo note mới 10 đơn vị.
Mỗi phần trả lời bốn câu: vấn đề là gì, dữ liệu nào public/private, invariant nào được kiểm tra,
và chuyện gì xảy ra nếu bỏ invariant.

## 12.1 Public ledger và privacy goal

Một transfer thông thường để lộ address, amount, thời gian và interaction graph. Đổi wallet chỉ
tạo pseudonym; funding source, timing và hành vi vẫn có thể nối các address với nhau.

Mục tiêu của demo không phải “ẩn mọi thứ”. Onchain vẫn thấy Merkle root, nullifier, output
commitment, program được gọi, fee payer và thời điểm. Demo chỉ giấu preimage của note:
`secret`, `salt` và `amount`.

- **Public:** program/domain, root, nullifier, output commitment, transaction metadata.
- **Private:** secret, salt, amount, leaf index và Merkle siblings.
- **Invariant:** một spend hợp lệ phải gắn với đúng network, program và state.
- **Nếu bỏ:** proof có thể replay sang application, deployment hoặc cluster khác.

## 12.2 Note và commitment

Private note trong demo là:

```text
note = { secret, salt, amount }
commitment = H("note", secret, salt, amount)
```

Commitment cần **hiding**: nhìn commitment không đoán được note; và **binding**: người tạo không
thể mở cùng commitment thành hai note khác nhau. Salt phải đủ ngẫu nhiên. Prefix `"note"` là
domain separation để cùng input không bị hiểu nhầm thành nullifier hay Merkle node.

- **Public:** commitment.
- **Private:** secret, salt, amount.
- **Invariant:** commitment được derive từ đúng ba field và đúng domain tag.
- **Nếu bỏ:** amount không được bind có thể bị đổi khi spend; salt yếu cho phép brute-force.

TypeScript lab dùng SHA-256 để nhìn rõ data flow. Noir circuit dùng Pedersen hash phù hợp với
backend của circuit. Hai tầng biểu diễn cùng relation nhưng không chia sẻ hash artifact.

## 12.3 Merkle membership bằng tree bốn leaves

Giả sử bốn commitments là `C0..C3`:

```text
                 root
              /        \
          H(C0,C1)    H(C2,C3)
           /   \        /   \
          C0   C1      C2   C3
```

Để chứng minh `C2` thuộc tree, prover cung cấp private path `[C3, H(C0,C1)]` và index `2`.
Circuit hash `C2` bên trái `C3`, sau đó hash kết quả bên phải `H(C0,C1)`, rồi so với public
root. Thứ tự left/right là một phần của statement, không phải chi tiết implementation.

- **Public:** current root.
- **Private:** leaf, index, siblings.
- **Invariant:** recomputed root bằng current root và index nằm trong tree.
- **Nếu bỏ:** prover có thể “chứng minh” một note chưa từng được commitment vào state.

Production system thường giữ root history có giới hạn để proof đang tạo không lập tức stale.
Demo chỉ chấp nhận current root nhằm làm state transition dễ quan sát.

## 12.4 Nullifier và replay protection

Commitment không thể bị xóa công khai mà không lộ leaf nào vừa được tiêu. Thay vào đó prover
công bố:

```text
nullifier = H("nullifier", secret, note_index, program_id, domain)
```

Nullifier deterministic cho cùng note và context, nhưng không tiết lộ commitment nếu secret đủ
mạnh. Application tạo một PDA theo nullifier; PDA đã tồn tại nghĩa là note đã được tiêu.

- **Public:** nullifier.
- **Private:** secret và note index.
- **Invariant:** circuit derive nullifier từ cùng secret dùng trong input commitment.
- **Nếu bỏ:** prover có thể chọn nullifier mới cho mỗi lần và double-spend cùng note.

`program_id + domain` ngăn cross-program/cross-cluster replay. Domain có thể biểu diễn deployment
version hoặc application scope; nó không thay thế kiểm tra program ID.

## 12.5 Statement, witness và public inputs

Verifier phải biết chính xác câu được chứng minh:

> Tôi biết một note và Merkle path sao cho commitment của note thuộc current root; nullifier
> được derive từ cùng secret, note index và domain; output note có cùng amount.

| Nhóm | Dữ liệu |
| --- | --- |
| Private witness | input secret/salt/amount, leaf index, siblings, output secret/salt |
| Public inputs | root, nullifier, output commitment, domain |
| Constraints | commitment, membership, nullifier binding, value conservation |

Proof không phải chữ ký hay hash của public inputs. Nếu proof tạo được chỉ từ public inputs thì
nó không chứng minh knowledge của witness.

- **Invariant:** mọi public output đều được constrain với witness liên quan.
- **Nếu bỏ:** underconstrained circuit có thể tạo proof cho state transition giả.

## 12.6 Từ TypeScript relation sang Noir circuit

TypeScript verifier nhận witness nên **không zero-knowledge**; nó chỉ là executable specification.
Noir đánh dấu witness private mặc định và đánh dấu root/nullifier/output/domain là `pub`. Circuit
dùng `std::hash::pedersen_hash`, recompute tree hai tầng và assert mọi invariant.

Workflow:

```text
Nargo compile/execute → ACIR + witness → bb prove → proof + verification key → bb verify
```

`nargo test` kiểm tra constraints với valid và `should_fail` fixtures. `bb verify` mới kiểm tra
proof artifact. Không commit `Prover.toml` chứa secret, witness, proof hoặc generated key.

- **Invariant:** circuit artifact, backend và verification key phải được version/pin cùng nhau.
- **Nếu bỏ:** verifier có thể kiểm tra proof bằng circuit/key khác với circuit đã audit.

## 12.7 Solana verification boundary

Solana application không nên tự tin vào một boolean `verified` do client truyền vào. Một verifier
program phải xác thực proof hoặc fixture và tạo context account do chính verifier sở hữu:

```text
VerifiedContext { root, nullifier, output_commitment, domain }
```

Application program kiểm tra verifier program ID cố định, owner/discriminator của context và mọi
field trước khi tạo nullifier PDA/cập nhật state. Lab dùng mock verifier để học account boundary;
mock verifier không cung cấp soundness hay zero knowledge.

- **Public:** verified context và application state.
- **Invariant:** context owner, verifier ID và tất cả public inputs phải khớp.
- **Nếu bỏ:** attacker tạo account giả ghi `verified = true` hoặc gọi verifier tùy ý.

## 12.8 Atomic consume và CPI

Một transaction hợp lệ thực hiện verifier CPI/context validation và state transition nguyên tử:

```text
verify → consume nullifier → append output commitment/update root
```

Nếu verification hoặc account validation lỗi, Solana rollback toàn transaction. Nullifier PDA
dùng `init` khiến lần consume thứ hai thất bại ngay cả khi hai request cạnh tranh.

- **Invariant:** không mutate root/output trước khi verification hoàn tất.
- **Nếu bỏ:** proof lỗi vẫn có thể để lại partial state hoặc race condition double-spend.

## 12.9 Token-2022 Confidential Transfers không phải Noir verifier

Token-2022 Confidential Transfer extension dùng encrypted balances và các proof type cụ thể được
ZK ElGamal Proof Program của Solana hỗ trợ. Proof có thể được verify thành proof-context account,
sau đó Token-2022 instruction tham chiếu context đó.

Đây không phải một generic entrypoint nhận arbitrary Noir/Barretenberg proof. Muốn verify backend
khác onchain cần verifier implementation, serialization, verification-key policy, compute analysis
và audit riêng. Module chỉ đối chiếu hai kiến trúc, không giả vờ nối chúng với nhau.

Tài liệu:

- [Solana confidential transfers](https://solana.com/docs/tokens/extensions/confidential-transfer/create-token-account)
- [Noir local proving workflow](https://noir-lang.org/docs/getting_started_manually)

## 12.10 Threat model và giới hạn

ZK proof chỉ bảo vệ witness trong statement đã constrain. Nó không tự che:

- fee payer, IP/RPC, timing, transaction size và program interaction;
- correlation giữa deposit/spend nếu anonymity set nhỏ;
- secret trong application log, analytics, crash dump hoặc frontend state;
- key loss, malicious circuit distribution hay compromised proving machine.

Production design cần relayer hoặc fee abstraction, root-history policy, key recovery strategy,
circuit/VK versioning, proof-size/compute measurement và independent audit. Trusted setup phụ
thuộc proving scheme; không được viết chung rằng mọi ZK system đều hoặc không cần trusted setup.

Hoàn thành module khi học viên có thể chỉ vào từng public input và giải thích nó chặn attack nào,
chạy được ba lớp test, và ghi rõ metadata nào vẫn public.
