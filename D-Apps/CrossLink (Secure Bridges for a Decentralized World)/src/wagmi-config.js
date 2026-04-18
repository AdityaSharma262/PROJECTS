// wagmi-config.js
import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { bsc, mainnet, polygon, arbitrum, optimism, avalanche, fantom } from 'wagmi/chains';

// Note: Your extension announces via EIP-6963 in inject.js. RainbowKit's injectedWallet
// will surface it automatically in the Connect modal.

// --------------------
// Create RainbowKit connectors
// --------------------
export const connectors = connectorsForWallets(
  [
    {
      groupName: 'Supported Wallets',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'CROSSLINK Bridge',
    projectId: 'cb89c1bb598946bc64d57672ff09d76e',
  }
);

// --------------------
// Create Wagmi config
// --------------------
export const config = createConfig({
  autoConnect: true,
  connectors,
  chains: [bsc, mainnet, polygon, arbitrum, optimism, avalanche, fantom],
  transports: {
    [mainnet.id]: http('https://ethereum.publicnode.com'),
    [bsc.id]: http('https://bsc-rpc.publicnode.com'),
    [polygon.id]: http('https://polygon-pokt.nodies.app'),
    [arbitrum.id]: http('https://arbitrum-one.publicnode.com'),
    [optimism.id]: http('https://optimism.publicnode.com'),
    [avalanche.id]: http('https://avalanche-c-chain.publicnode.com'),
    [fantom.id]: http('https://fantom.publicnode.com'),
  },
  ssr: false,
});
