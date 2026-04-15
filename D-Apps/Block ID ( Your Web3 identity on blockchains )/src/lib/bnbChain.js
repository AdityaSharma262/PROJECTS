import { defineChain } from "viem";

const BNB = defineChain({
  id: 97,
  name: "BNB Testnet",
  network: "bnbt",
  rpcUrls: {
    default: {
      http: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    },
  },
  nativeCurrency: {
    name: "BNB",
    symbol: "tBNB",
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: "BNBScan",
      url: "https://testnet.bscscan.com",
    },
  },
  iconUrl: "/chain/bnb.png",
});

export { BNB };