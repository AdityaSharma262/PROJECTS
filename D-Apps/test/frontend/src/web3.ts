import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bscTestnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Match Prediction App',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLET_CONNECT_PROJECT_ID',
  chains: [bscTestnet],
  ssr: true,
});

export const chains = [bscTestnet];