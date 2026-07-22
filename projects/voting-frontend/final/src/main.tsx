import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { MockVotingClient } from "./mock-client";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./styles.css";
const client = new MockVotingClient();

function WalletApp() {
  const wallet = useWallet();
  return <><WalletMultiButton/><App client={client} wallet={{ connected: wallet.connected, publicKey: wallet.publicKey?.toBase58() }} cluster="devnet" /></>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><ConnectionProvider endpoint="https://api.devnet.solana.com"><WalletProvider wallets={[]} autoConnect><WalletModalProvider><WalletApp/></WalletModalProvider></WalletProvider></ConnectionProvider></StrictMode>,
);
