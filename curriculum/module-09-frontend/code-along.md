# Voting Frontend — Code-along từng bước

Bài này viết [Voting Frontend](../../projects/voting-app/frontend/README.md) từ một thư mục trống, theo đúng thứ tự video Module 9. Mỗi bước gõ một đoạn ngắn rồi build, test hoặc mở trình duyệt ngay. Bước cuối ra đúng code `final` (trừ `name` trong `package.json`, `pnpm-lock.yaml` và `src/idl/README.md` của repo); `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần làm xong [Voting App Module 6](../module-06-voting/code-along.md), có program đã deploy Devnet tại `~/code/bootcamp-labs/voting`. Node 24 và pnpm theo [docs/setup.md](../../docs/setup.md). Ví Phantom bật Testnet Mode, chọn Devnet, có Devnet SOL.

<a id="fe-0"></a>
## Bước 0 — Tạo project

**Khái niệm:** [TypeScript client](./lessons.md#92-typescript-client)

### 0a. Thư mục và `package.json`

Tạo project ngoài repo khóa học, cạnh `voting` của Module 6. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`. Nếu ở Module 6 bạn đã chép bản chạy thử vào `~/code/bootcamp-labs/voting-frontend`, đổi tên nó trước (ví dụ `mv voting-frontend voting-frontend-m6`).

```bash
mkdir -p ~/code/bootcamp-labs/voting-frontend
cd ~/code/bootcamp-labs/voting-frontend
```

Tạo `package.json`:

<!-- file: package.json; mode: create -->
```json
{
  "name": "voting-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  }
}
```

### 0b. Cài React, Vite, TypeScript, Vitest

```bash
pnpm add -E react@19.2.7 react-dom@19.2.7
pnpm add -D -E vite@8.1.5 @vitejs/plugin-react@6.0.4
pnpm add -D typescript@^5.7.3 @types/react@^19.0.0 @types/react-dom@^19.0.0 vitest@^3.0.0
```

`-E` ghi đúng phiên bản (không có `^`). `package.json` giờ có `dependencies` và `devDependencies` giống `final`.

### 0c. Cấu hình TypeScript

<!-- file: tsconfig.json; mode: create -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

### 0d. Vite, trang HTML và React đầu tiên

<!-- file: vite.config.ts; mode: create -->
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });
```

<!-- file: index.html; mode: create -->
```html
<div id="root"></div><script type="module" src="/src/main.tsx"></script>
```

<!-- file: src/main.tsx; mode: create -->
```tsx
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(<h1>Voting App</h1>);
```

```bash
pnpm build
pnpm dev
```

`pnpm build` chạy `tsc` rồi `vite build`, kết thúc bằng `✓ built in …`. `pnpm dev` in địa chỉ `http://localhost:5173/`; mở ra thấy chữ **Voting App**. Dừng bằng `Ctrl+C` khi cần chạy lệnh khác.

<a id="fe-1"></a>
## Bước 1 — Kiểu dữ liệu chung

**Khái niệm:** [IDL contract](./lessons.md#91-idl-contract) · [UI states](./lessons.md#97-ui-states)

<!-- file: src/domain.ts; mode: create -->
```ts
export type Cluster = "localnet" | "devnet" | "mainnet-beta";
export type Candidate = { id: number; name: string; votes: number };
export type Poll = { id: string; title: string; startsAt: number; endsAt: number; candidates: Candidate[] };
export type WalletPort = { connected: boolean; publicKey?: string };
export type VotingClient = {
  listPolls(): Promise<Poll[]>;
  vote(input: { pollId: string; candidateId: number; voter: string }): Promise<string>;
  confirm(signature: string): Promise<void>;
};
export type VotePhase = "idle" | "awaiting-signature" | "confirming" | "success" | "error";
export type VoteState = { phase: VotePhase; signature?: string; message?: string };
```

`pnpm build` không lỗi. Giao diện chỉ làm việc với `VotingClient`; sau này mock và Anchor là hai bản cài đặt của cùng kiểu này.

<a id="fe-2"></a>
## Bước 2 — Controller vote và test

**Khái niệm:** [send/confirm](./lessons.md#95-sendconfirm) · [UI states](./lessons.md#97-ui-states) · [failed transaction UX](./lessons.md#910-failed-transaction-ux) · [Explorer links](./lessons.md#98-explorer-links)

### 2a. Chặn khi chưa kết nối ví

<!-- file: src/controller.ts; mode: create -->
```ts
import type { Poll, VoteState, VotingClient, WalletPort } from "./domain";

export async function voteAndRefresh(input: {
  wallet: WalletPort; client: VotingClient; pollId: string; candidateId: number;
  setState(state: VoteState): void; setPolls(polls: Poll[]): void;
}): Promise<void> {
  if (!input.wallet.connected || !input.wallet.publicKey) {
    input.setState({ phase: "error", message: "Hãy kết nối wallet trước khi vote" });
    return;
  }
}
```

`pnpm build` không lỗi.

### 2b. Client giả cho test

<!-- file: tests/controller.test.ts; mode: create -->
```ts
import { describe, expect, it, vi } from "vitest";
import { voteAndRefresh } from "../src/controller";
import type { VoteState, VotingClient, WalletPort } from "../src/domain";

const client = (overrides: Partial<VotingClient> = {}): VotingClient => ({
  listPolls: vi.fn().mockResolvedValue([]),
  vote: vi.fn().mockResolvedValue("sig-1"),
  confirm: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});
```

`pnpm build` không lỗi (chưa có test nào để chạy).

### 2c. Hàm `run` gom các state

Thêm vào cuối `tests/controller.test.ts`:

<!-- file: tests/controller.test.ts; mode: append -->
```ts
const connected: WalletPort = { connected: true, publicKey: "voter" };

async function run(c: VotingClient, wallet: WalletPort = connected): Promise<VoteState[]> {
  const states: VoteState[] = [];
  await voteAndRefresh({
    wallet,
    client: c,
    pollId: "1",
    candidateId: 0,
    setState: (s) => states.push(s),
    setPolls: () => {},
  });
  return states;
}
```

### 2d. Test ví chưa kết nối

Thêm vào cuối file test:

<!-- file: tests/controller.test.ts; mode: append -->
```ts

describe("voting frontend controller", () => {
  it("reject wallet disconnected", async () => {
    const c = client();
    const states = await run(c, { connected: false });
    expect(c.vote).not.toHaveBeenCalled();
    expect(states.at(-1)?.phase).toBe("error");
  });
});
```

```bash
pnpm test
```

Cần thấy `Tests  1 passed (1)`.

### 2e. Test các phase của một lần vote (chưa qua)

Chèn **trước dòng `});` cuối file test**:

<!-- file: tests/controller.test.ts; mode: insert-before-last-line -->
```ts
  it("đi qua awaiting-signature, confirming rồi success", async () => {
    const states = await run(client());
    expect(states.map((s) => s.phase)).toEqual(["awaiting-signature", "confirming", "success"]);
    expect(states.at(-1)?.signature).toBe("sig-1");
  });
```

`pnpm test` ra `Tests  1 failed | 1 passed (2)` với `expected [] to deeply equal [ 'awaiting-signature', …(2) ]`: controller chưa làm gì khi ví đã kết nối.

### 2f. Ký, xác nhận rồi mới tải lại

Trong `src/controller.ts`, chèn **sau dấu `}` đóng khối `if`**, trước `}` cuối hàm:

<!-- file: src/controller.ts; mode: insert-before-last-line -->
```ts
  try {
    input.setState({ phase: "awaiting-signature", message: "Đang chờ wallet ký" });
    const signature = await input.client.vote({ pollId: input.pollId, candidateId: input.candidateId, voter: input.wallet.publicKey });
    input.setState({ phase: "confirming", signature, message: "Đang xác nhận transaction" });
    await input.client.confirm(signature);
    input.setPolls(await input.client.listPolls());
    input.setState({ phase: "success", signature, message: "Vote đã được xác nhận" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction thất bại";
    input.setState({ phase: "error", message });
  }
```

`pnpm test` ra `Tests  2 passed (2)`. `src/controller.ts` giờ giống `final`.

### 2g. Test thứ tự vote → confirm → refetch

Chèn trước dòng `});` cuối file test:

<!-- file: tests/controller.test.ts; mode: insert-before-last-line -->
```ts
  it("confirm rồi mới refetch, refetch đúng một lần", async () => {
    const calls: string[] = [];
    const c = client({
      vote: vi.fn(async () => {
        calls.push("vote");
        return "sig";
      }),
      confirm: vi.fn(async () => {
        calls.push("confirm");
      }),
      listPolls: vi.fn(async () => {
        calls.push("refetch");
        return [];
      }),
    });
    await run(c);
    expect(calls).toEqual(["vote", "confirm", "refetch"]);
  });
```

`pnpm test` ra `Tests  3 passed (3)`.

### 2h. Test ký bị từ chối và xác nhận thất bại

Chèn trước dòng `});` cuối file test:

<!-- file: tests/controller.test.ts; mode: insert-before-last-line -->
```ts
  it("chữ ký bị từ chối: báo lỗi và không refetch", async () => {
    const c = client({ vote: vi.fn().mockRejectedValue(new Error("User rejected")) });
    const states = await run(c);
    expect(states.at(-1)).toMatchObject({ phase: "error", message: "User rejected" });
    expect(c.listPolls).not.toHaveBeenCalled();
  });
  it("confirmation thất bại: báo lỗi và không refetch", async () => {
    const c = client({ confirm: vi.fn().mockRejectedValue(new Error("Transaction lỗi")) });
    const states = await run(c);
    expect(states.at(-1)).toMatchObject({ phase: "error", message: "Transaction lỗi" });
    expect(c.listPolls).not.toHaveBeenCalled();
  });
```

`pnpm test` ra `Tests  5 passed (5)`.

### 2i. Link Explorer theo cluster

<!-- file: src/explorer.ts; mode: create -->
```ts
import type { Cluster } from "./domain";
export function explorerTransactionUrl(signature: string, cluster: Cluster): string {
  if (!signature) throw new Error("signature không được rỗng");
  const base = `https://explorer.solana.com/tx/${encodeURIComponent(signature)}`;
  return cluster === "mainnet-beta" ? base : `${base}?cluster=${cluster === "localnet" ? "custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899" : "devnet"}`;
}
```

Trong `tests/controller.test.ts`, chèn sau dòng `import { voteAndRefresh } from "../src/controller";`:

```ts
import { explorerTransactionUrl } from "../src/explorer";
```

Rồi chèn trước dòng `});` cuối file:

<!-- file: tests/controller.test.ts; mode: insert-before-last-line -->
```ts
  it("tạo Explorer URL theo cluster", () => {
    expect(explorerTransactionUrl("sig", "devnet")).toContain("cluster=devnet");
    expect(explorerTransactionUrl("sig", "localnet")).toContain("customUrl=http%3A%2F%2F127.0.0.1%3A8899");
    expect(explorerTransactionUrl("sig", "mainnet-beta")).not.toContain("cluster=");
  });
```

`pnpm test` ra `Tests  6 passed (6)`. `tests/controller.test.ts` giờ giống `final`.

<a id="fe-3"></a>
## Bước 3 — Mock client và giao diện

**Khái niệm:** [UI states](./lessons.md#97-ui-states) · [freshness](./lessons.md#99-freshness)

### 3a. Mock client đọc poll

<!-- file: src/mock-client.ts; mode: create -->
```ts
import type { Poll, VotingClient } from "./domain";

export class MockVotingClient {
  #polls: Poll[] = [
    {
      id: "1",
      title: "Workshop tiếp theo?",
      startsAt: 0,
      endsAt: 4_102_444_800,
      candidates: [
        { id: 0, name: "Security", votes: 2 },
        { id: 1, name: "DeFi", votes: 1 },
      ],
    },
  ];
  async listPolls(): Promise<Poll[]> {
    return structuredClone(this.#polls);
  }
}
```

`pnpm build` không lỗi.

### 3b. Mock client vote

Đổi dòng `export class MockVotingClient {` thành:

```ts
export class MockVotingClient implements VotingClient {
```

Rồi chèn trước dấu `}` cuối file:

<!-- file: src/mock-client.ts; mode: insert-before-last-line -->
```ts
  async vote({ pollId, candidateId }: { pollId: string; candidateId: number; voter: string }): Promise<string> {
    const poll = this.#polls.find((item) => item.id === pollId);
    const candidate = poll?.candidates.find((item) => item.id === candidateId);
    if (!candidate) throw new Error("Poll hoặc candidate không tồn tại");
    candidate.votes += 1;
    return `mock-${pollId}-${candidateId}`;
  }
  async confirm(): Promise<void> {}
```

`pnpm build` không lỗi. `src/mock-client.ts` giờ giống `final`.

### 3c. Khung `App`

<!-- file: src/App.tsx; mode: create -->
```tsx
import { useEffect, useState } from "react";
import type { Cluster, Poll, VoteState, VotingClient, WalletPort } from "./domain";

export function App({
  client,
  wallet,
  cluster = "devnet",
}: {
  client: VotingClient;
  wallet: WalletPort;
  cluster?: Cluster;
}) {
  return (
    <main>
      <header>
        <h1>Voting App</h1>
        <span>{wallet.connected ? wallet.publicKey : "Wallet chưa kết nối"}</span>
      </header>
    </main>
  );
}
```

**Thay toàn bộ `src/main.tsx`:**

<!-- file: src/main.tsx; mode: replace -->
```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { MockVotingClient } from "./mock-client";

const mockClient = new MockVotingClient();

createRoot(document.getElementById("root")!).render(<App client={mockClient} wallet={{ connected: false }} />);
```

`pnpm dev`: trang có tiêu đề **Voting App** và chữ **Wallet chưa kết nối**.

### 3d. CSS, phần 1

<!-- file: src/styles.css; mode: create -->
```css
:root {
  font-family: Inter, system-ui, sans-serif;
  color: #ffffff;
  background: #000000;
}
body {
  margin: 0;
}
#root {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1, h2 {
  font-weight: 500;
  letter-spacing: -0.04em;
}
```

Trong `src/main.tsx`, chèn sau dòng `import { MockVotingClient } from "./mock-client";`:

```tsx
import "./styles.css";
```

Trang chuyển nền đen, nội dung ở giữa trang, tiêu đề và trạng thái ví nằm hai đầu một hàng.

### 3e. CSS, phần 2

Thêm vào cuối `src/styles.css`:

<!-- file: src/styles.css; mode: append -->
```css
section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(236, 228, 253, 0.12);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1rem 0;
}
button {
  margin: 0.25rem;
  padding: 0.65rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(236, 228, 253, 0.2);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
}
[role="alert"] {
  color: #ff5c7a;
}
a {
  color: #14f195;
}
```

`src/styles.css` có đủ kiểu cho trang; bước 4d thêm kiểu cho nút ví.

### 3f. Tải poll và màn hình đang tải

Trong `src/App.tsx`, chèn ngay sau dòng `}) {` (trước `return (`):

<!-- file: src/App.tsx; mode: insert -->
```tsx
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setPolls(await client.listPolls());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [client]);
  if (loading)
    return (
      <main>
        <p>Đang tải polls…</p>
      </main>
    );
```

`pnpm build` không lỗi; trang vẫn như cũ (mock trả dữ liệu ngay).

### 3g. Danh sách poll và candidate

Trong `src/App.tsx`, chèn sau dòng `</header>`:

<!-- file: src/App.tsx; mode: insert -->
```tsx
      {polls.length === 0 ? (
        <p>Chưa có poll.</p>
      ) : (
        polls.map((poll) => (
          <section key={poll.id}>
            <h2>{poll.title}</h2>
            {poll.candidates.map((candidate) => (
              <button key={candidate.id}>
                {candidate.name}: {candidate.votes}
              </button>
            ))}
          </section>
        ))
      )}
```

Trang hiện poll **Workshop tiếp theo?** với hai nút `Security: 2` và `DeFi: 1`.

### 3h. Lỗi khi tải và nút thử lại

Trong `src/App.tsx`:

1. Chèn sau dòng `const [loading, setLoading] = useState(true);`:

   ```tsx
     const [loadError, setLoadError] = useState<string>();
   ```

2. Chèn sau dòng `setLoading(true);` trong `load`:

   ```tsx
       setLoadError(undefined);
   ```

3. Chèn sau dòng `setPolls(await client.listPolls());`:

   ```tsx
       } catch (e) {
         setLoadError(e instanceof Error ? e.message : "Không tải được polls");
   ```

4. Chèn sau khối `if (loading) return (…);`, trước `return (` chính:

   ```tsx
     if (loadError)
       return (
         <main>
           <p role="alert">{loadError}</p>
           <button onClick={() => void load()}>Thử lại</button>
         </main>
       );
   ```

`pnpm build` không lỗi.

### 3i. Nút vote gọi controller

Trong `src/App.tsx`:

1. Chèn sau dòng `import type { … } from "./domain";`:

   ```tsx
   import { voteAndRefresh } from "./controller";
   import { explorerTransactionUrl } from "./explorer";
   ```

2. Chèn sau dòng `const [loadError, setLoadError] = useState<string>();`:

   ```tsx
     const [voteState, setVoteState] = useState<VoteState>({ phase: "idle" });
   ```

3. Thay dòng `<button key={candidate.id}>` bằng:

   ```tsx
                 <button
                   key={candidate.id}
                   disabled={voteState.phase === "awaiting-signature" || voteState.phase === "confirming"}
                   onClick={() =>
                     void voteAndRefresh({
                       wallet,
                       client,
                       pollId: poll.id,
                       candidateId: candidate.id,
                       setState: setVoteState,
                       setPolls,
                     })
                   }
                 >
   ```

`pnpm build` không lỗi.

### 3j. Thông báo và link Explorer

Trong `src/App.tsx`, chèn ngay trước dòng `</main>` cuối cùng:

<!-- file: src/App.tsx; mode: insert -->
```tsx
      {voteState.message && <p role={voteState.phase === "error" ? "alert" : "status"}>{voteState.message}</p>}
      {voteState.signature && <a href={explorerTransactionUrl(voteState.signature, cluster)}>Xem transaction</a>}
```

`src/App.tsx` giờ giống `final`. Bấm `Security: 2`: hiện **Hãy kết nối wallet trước khi vote**, số phiếu giữ nguyên.

### 3k. Thử với ví giả đã kết nối

Trong `src/main.tsx`, đổi `wallet={{ connected: false }}` thành:

```tsx
wallet={{ connected: true, publicKey: "mock-voter" }}
```

Bấm `Security: 2`: thành `Security: 3`, hiện **Vote đã được xác nhận** và link **Xem transaction** (`https://explorer.solana.com/tx/mock-1-0?cluster=devnet`, không mở vì là chữ ký giả). Bước 4 thay ví giả bằng ví thật.

<a id="fe-4"></a>
## Bước 4 — Kết nối ví

**Khái niệm:** [wallet connection](./lessons.md#93-wallet-connection)

### 4a. Cài Wallet Adapter, Anchor và web3.js

Thêm khối `pnpm` vào `package.json`, ngay sau `devDependencies` (nhớ dấu `,` sau `}` của `devDependencies`):

```json
  "pnpm": {
    "overrides": {
      "@solana/wallet-adapter-base-ui": "0.1.6"
    }
  }
```

`@solana/wallet-adapter-react-ui@0.9.39` kéo theo `@solana/wallet-adapter-base-ui`. Bản mới 0.1.7 lại kéo `@solana/wallet-adapter-react@0.15.40`, thành hai bản React context: nút ví không thấy `WalletProvider` và console báo `You have tried to read "publicKey" on a WalletContext without providing one`. Ghim 0.1.6 để chỉ còn một bản 0.15.39.

```bash
pnpm add -E @anchor-lang/core@1.2.1 @solana/web3.js@1.98.4 @solana/wallet-adapter-react@0.15.39 @solana/wallet-adapter-react-ui@0.9.39
pnpm why @solana/wallet-adapter-react
```

`pnpm add` có in vài cảnh báo `unmet peer` (ví dụ `bs58@^6.0.0: found 4.0.1`); app vẫn build và chạy. `pnpm why` chỉ được có `@solana/wallet-adapter-react 0.15.39`.

### 4b. Kiểu cho biến môi trường Vite

<!-- file: src/vite-env.d.ts; mode: create -->
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_USE_MOCK?: string;
}
```

### 4c. Bọc app trong các provider

**Thay toàn bộ `src/main.tsx`:**

<!-- file: src/main.tsx; mode: replace -->
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { App } from "./App";
import { MockVotingClient } from "./mock-client";
import "./styles.css";

const endpoint = import.meta.env.VITE_RPC_URL ?? "https://api.devnet.solana.com";
const mockClient = new MockVotingClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      {/* wallets={[]}: Wallet Standard tự phát hiện Phantom, Solflare, Backpack... */}
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <App client={mockClient} wallet={{ connected: true, publicKey: "mock-voter" }} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
);
```

`pnpm build` không lỗi; trang như bước 3k.

### 4d. Nút ví và ví thật

Trong `src/main.tsx`:

1. Đổi hai dòng import của Wallet Adapter thành:

   ```tsx
   import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
   import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
   ```

2. Chèn sau dòng `const mockClient = new MockVotingClient();`:

   ```tsx

   function WalletApp() {
     const wallet = useWallet();

     return (
       <>
         <WalletMultiButton />
         <App client={mockClient} wallet={{ connected: wallet.connected, publicKey: wallet.publicKey?.toBase58() }} />
       </>
     );
   }
   ```

3. Thay dòng `<App client={mockClient} wallet={{ connected: true, publicKey: "mock-voter" }} />` trong `render` bằng `<WalletApp />`.

4. Thêm vào cuối `src/styles.css` để nút ví cùng màu tím Solana và cùng dáng pill với các nút khác:

<!-- file: src/styles.css; mode: append -->
```css
.wallet-adapter-button-trigger {
  background: #9945ff;
  border-radius: 999px;
}
```

`src/styles.css` giờ giống `final`.

`pnpm dev`: góc trên có nút **Select Wallet** màu tím. Bấm, chọn Phantom, duyệt kết nối: nút đổi thành địa chỉ ví rút gọn, header hiện địa chỉ đầy đủ. Vote ở mock mode giờ dùng public key của Phantom, không cần ký.

<a id="fe-5"></a>
## Bước 5 — IDL và đọc account từ Devnet

**Khái niệm:** [IDL contract](./lessons.md#91-idl-contract) · [TypeScript client](./lessons.md#92-typescript-client) · [read account data](./lessons.md#96-read-account-data)

### 5a. Khung Anchor client

<!-- file: src/anchor-client.ts; mode: create -->
```ts
import { BN, type Program } from "@anchor-lang/core";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, type Connection } from "@solana/web3.js";
import type { Poll, VotingClient } from "./domain";

export function createAnchorVotingClient(program: Program<any>, connection: Connection): VotingClient {
  const accounts = program.account as any;

  return {
    async listPolls(): Promise<Poll[]> {
      return [];
    },

    async vote() {
      throw new Error("Chưa viết vote");
    },

    async confirm() {
      throw new Error("Chưa viết confirm");
    },
  };
}
```

Hai `throw` là chỗ tạm, bước 6 thay bằng code thật. `pnpm build` không lỗi.

### 5b. Đọc mọi Poll

Thay thân `listPolls` (dòng `return [];`) bằng:

<!-- file: src/anchor-client.ts; mode: replace-body listPolls -->
```ts
      const pollRows = await accounts.poll.all();
      return pollRows.map((row: any) => {
        const pollKey = row.publicKey as PublicKey;
        return {
          id: pollKey.toBase58(),
          title: row.account.title as string,
          startsAt: Number(row.account.startTime.toString()),
          endsAt: Number(row.account.endTime.toString()),
          candidates: [],
        };
      });
```

### 5c. Ghép Candidate vào Poll

1. Đổi dòng `const pollRows = await accounts.poll.all();` thành:

   ```ts
         const [pollRows, candidateRows] = await Promise.all([accounts.poll.all(), accounts.candidate.all()]);
   ```

2. Chèn sau dòng `const pollKey = row.publicKey as PublicKey;`:

   ```ts
           const candidates = candidateRows
             .filter((item: any) => item.account.poll.equals(pollKey))
             .map((item: any) => ({
               id: item.account.candidateId as number,
               name: item.account.name as string,
               votes: Number(item.account.votes.toString()),
             }));
   ```

3. Đổi dòng `candidates: [],` thành `candidates,`.

`pnpm build` không lỗi.

### 5d. Ghi chú cho người đọc sau

Chèn ngay trên dòng `export function createAnchorVotingClient`:

<!-- file: src/anchor-client.ts; mode: insert -->
```ts
/**
 * Adapter Devnet cho Voting App Module 6.
 *
 * `program` là Anchor Program tạo từ IDL (`src/idl/voting.json`) với provider có wallet.
 * Dùng `Program<any>` để file build được trước khi IDL được copy vào frontend.
 *
 * `Poll.id` ở adapter này là ĐỊA CHỈ Poll account (base58), vì Poll PDA gồm cả authority:
 * hai authority khác nhau có thể dùng cùng `poll_id`.
 */
```

### 5e. Chọn mock hay Anchor theo IDL

Trong `src/main.tsx`:

1. Sửa và thêm import cho đủ các dòng sau (giữ nguyên các import khác):

   ```tsx
   import { StrictMode, useMemo } from "react";
   import { createRoot } from "react-dom/client";
   import { AnchorProvider, Program, type Idl } from "@anchor-lang/core";
   import { ConnectionProvider, WalletProvider, useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
   ```

   và sau dòng `import { App } from "./App";`:

   ```tsx
   import { createAnchorVotingClient } from "./anchor-client";
   import type { Cluster, VotingClient } from "./domain";
   ```

2. Chèn sau dòng `const endpoint = …;`:

   ```tsx
   const cluster: Cluster = endpoint.includes("127.0.0.1") || endpoint.includes("localhost") ? "localnet" : "devnet";

   // Copy `target/idl/voting.json` từ Module 6 vào `src/idl/voting.json` để bật Anchor mode.
   // Chưa có file thì glob trả object rỗng và app chạy mock mode.
   const idlModules = import.meta.glob<Idl>("./idl/voting.json", { eager: true, import: "default" });
   const idl = Object.values(idlModules)[0];
   const useMock = import.meta.env.VITE_USE_MOCK === "true" || !idl;
   ```

`pnpm build` không lỗi.

### 5f. Tạo client theo chế độ

Trong `WalletApp`, chèn sau dòng `const wallet = useWallet();`:

<!-- file: src/main.tsx; mode: insert -->
```tsx
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const client: VotingClient | undefined = useMemo(() => {
    if (useMock) return mockClient;
    if (!anchorWallet) return undefined;
    const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
    return createAnchorVotingClient(new Program(idl!, provider), connection);
  }, [anchorWallet, connection]);
```

(Giữ dòng trống có sẵn sau đoạn này, trước `return (`.) `pnpm build` không lỗi.

### 5g. Hiện chế độ và dùng client

Trong `WalletApp`, thay dòng `<App client={mockClient} … />` bằng:

<!-- file: src/main.tsx; mode: replace-line -->
```tsx
      <p>{useMock ? "Mock mode: chưa có src/idl/voting.json" : `Anchor mode: ${cluster} (${endpoint})`}</p>
      {client ? (
        <App client={client} wallet={{ connected: wallet.connected, publicKey: wallet.publicKey?.toBase58() }} cluster={cluster} />
      ) : (
        <main>
          <p>Kết nối wallet để đọc và vote trên program Module 6.</p>
        </main>
      )}
```

`src/main.tsx` giờ giống `final`. `pnpm dev`: dưới nút ví hiện **Mock mode: chưa có src/idl/voting.json**.

### 5h. Đưa IDL vào và đọc Devnet

Dừng `pnpm dev`, rồi:

```bash
mkdir -p src/idl
cp ../voting/target/idl/voting.json src/idl/voting.json
VITE_RPC_URL=https://api.devnet.solana.com pnpm dev
```

Trang hiện **Anchor mode: devnet (https://api.devnet.solana.com)** và **Kết nối wallet để đọc và vote trên program Module 6.** Kết nối Phantom: danh sách poll của program trên Devnet hiện ra (các poll `Solana Bootcamp`, `Poll khác` do bộ test Module 6 tạo). Bấm vote lúc này hiện **Chưa viết vote**.

`src/idl/voting.json` chứa Program ID của riêng bạn; nếu đưa project lên Git thì bỏ file này ra (repo khóa học có dòng `.gitignore` cho nó).

<a id="fe-6"></a>
## Bước 6 — Gửi vote lên Devnet

**Khái niệm:** [build transaction](./lessons.md#94-build-transaction) · [send/confirm](./lessons.md#95-sendconfirm) · [failed transaction UX](./lessons.md#910-failed-transaction-ux)

### 6a. Tính địa chỉ Candidate và VoteReceipt

1. Chèn sau dòng `import type { Poll, VotingClient } from "./domain";`:

   ```ts

   const bytes = (value: string) => new TextEncoder().encode(value);
   const u16le = (value: number) => Uint8Array.from(new BN(value).toArray("le", 2));
   ```

2. Thay cả khối `async vote() { throw new Error("Chưa viết vote"); },` bằng:

   ```ts
       async vote({ pollId, candidateId, voter }) {
         const poll = new PublicKey(pollId);
         const voterKey = new PublicKey(voter);
         // Đọc poll_id (u64) từ chain thay vì tin client truyền.
         const state = await accounts.poll.fetch(poll);
         const [candidate] = PublicKey.findProgramAddressSync(
           [bytes("candidate"), poll.toBytes(), u16le(candidateId)],
           program.programId,
         );
         const [voteReceipt] = PublicKey.findProgramAddressSync(
           [bytes("vote"), poll.toBytes(), voterKey.toBytes()],
           program.programId,
         );
         throw new Error("Chưa gửi transaction");
       },
   ```

`pnpm build` không lỗi. Dòng `throw` là chỗ tạm, bước 6b xóa.

### 6b. Gửi instruction `vote`

Thay dòng `throw new Error("Chưa gửi transaction");` bằng:

<!-- file: src/anchor-client.ts; mode: replace-line -->
```ts
      return program.methods
        .vote(state.pollId as BN, candidateId)
        .accountsPartial({
          poll,
          candidate,
          voteReceipt,
          voter: voterKey,
          clock: SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
```

### 6c. Chờ xác nhận

Thay cả khối `async confirm() { throw new Error("Chưa viết confirm"); },` bằng:

<!-- file: src/anchor-client.ts; mode: replace-block confirm -->
```ts
    async confirm(signature) {
      const latest = await connection.getLatestBlockhash("confirmed");
      const result = await connection.confirmTransaction({ signature, ...latest }, "confirmed");
      if (result.value.err) throw new Error(`Transaction lỗi: ${JSON.stringify(result.value.err)}`);
    },
```

`src/anchor-client.ts` giờ giống `final`.

```bash
pnpm test
pnpm build
```

Cần thấy `Tests  6 passed (6)` và `✓ built in …` (có cảnh báo chunk lớn hơn 500 kB, bỏ qua được).

### 6d. Vote thật trên Devnet

Poll `Solana Bootcamp` do bộ test Module 6 tạo chỉ mở 10 phút. Mở terminal thứ hai, tạo poll mới:

```bash
cd ~/code/bootcamp-labs/voting
anchor test --provider.cluster devnet --skip-deploy
```

Cần thấy `8 passing`. Quay lại trình duyệt, tải lại trang, kết nối Phantom. Ở poll `Solana Bootcamp` mới nhất, bấm `Candidate A: 1`, duyệt giao dịch trong Phantom:

- trong lúc chờ ký và chờ xác nhận, mọi nút vote bị mờ và hiện **Đang chờ wallet ký** rồi **Đang xác nhận transaction**;
- xác nhận xong, nút thành `Candidate A: 2`, hiện **Vote đã được xác nhận** và link **Xem transaction** mở Explorer ở `cluster=devnet`;
- tải lại trang, số phiếu vẫn là 2 vì được đọc lại từ chain.

### 6e. Các đường lỗi

- Bấm `Candidate A: 2` lần nữa: giao dịch bị từ chối vì VoteReceipt của ví này đã tồn tại; trang hiện lỗi, số phiếu giữ nguyên.
- Ở poll `Poll khác` (chưa tới giờ mở), bấm `Candidate B: 0`: trang hiện lỗi chứa `Poll chưa bắt đầu`.
- Bấm vote ở một poll khác rồi bấm **Từ chối** trong Phantom: trang hiện lỗi từ chối ký, không tải lại danh sách.

Không bấm lại tự động khi lỗi: chỉ bấm lại khi biết giao dịch chưa được thực thi ([lesson 9.10](./lessons.md#910-failed-transaction-ux)).
