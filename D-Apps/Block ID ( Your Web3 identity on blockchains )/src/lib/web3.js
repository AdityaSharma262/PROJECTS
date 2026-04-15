import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { BNB } from "./bnbChain.js";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// Debug: Log the project ID to verify it's loaded
globalThis.projectId = projectId;
console.log('WalletConnect Project ID:', projectId);

export const config = getDefaultConfig({
  appName: "BitEthWorks",
  projectId,
  chains: [BNB],
  transports: {
    [BNB.id]: http("https://data-seed-prebsc-1-s1.binance.org:8545"),
  },
});