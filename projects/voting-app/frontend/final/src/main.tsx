import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { AnchorProvider, Program, type Idl } from "@anchor-lang/core";
import { ConnectionProvider, WalletProvider, useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { App } from "./App";
import { createAnchorVotingClient } from "./anchor-client";
import type { Cluster, VotingClient } from "./domain";
import { MockVotingClient } from "./mock-client";
import "./styles.css";

const endpoint = import.meta.env.VITE_RPC_URL ?? "https://api.devnet.solana.com";
const cluster: Cluster = endpoint.includes("127.0.0.1") || endpoint.includes("localhost") ? "localnet" : "devnet";

// Copy `target/idl/voting.json` từ Module 6 vào `src/idl/voting.json` để bật Anchor mode.
// Chưa có file thì glob trả object rỗng và app chạy mock mode.
const idlModules = import.meta.glob<Idl>("./idl/voting.json", { eager: true, import: "default" });
const idl = Object.values(idlModules)[0];
const useMock = import.meta.env.VITE_USE_MOCK === "true" || !idl;
const mockClient = new MockVotingClient();

function WalletApp() {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const client: VotingClient | undefined = useMemo(() => {
    if (useMock) return mockClient;
    if (!anchorWallet) return undefined;
    const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
    return createAnchorVotingClient(new Program(idl!, provider), connection);
  }, [anchorWallet, connection]);

  return (
    <>
      <WalletMultiButton />
      <p>{useMock ? "Mock mode: chưa có src/idl/voting.json" : `Anchor mode: ${cluster} (${endpoint})`}</p>
      {client ? (
        <App client={client} wallet={{ connected: wallet.connected, publicKey: wallet.publicKey?.toBase58() }} cluster={cluster} />
      ) : (
        <main>
          <p>Kết nối wallet để đọc và vote trên program Module 6.</p>
        </main>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      {/* wallets={[]}: Wallet Standard tự phát hiện Phantom, Solflare, Backpack... */}
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <WalletApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
);
