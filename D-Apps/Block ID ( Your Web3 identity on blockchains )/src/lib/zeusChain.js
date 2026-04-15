import { defineChain } from 'viem';

const Zeus = defineChain({
  id: 34504,
  name: 'Custom Chain',
  network: 'Custom',
  rpcUrls: {
    default: {
      http: ['https://mainnet-rpc.zeuschainscan.io'],
    },
  },
  nativeCurrency: {
    name: 'Custom',
    symbol: 'CUSTOM',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Custom Explorer',
      url: 'https://zeuschainscan.io',
    },
  },
  iconUrl: '/custom-chain.png',
});

export { Zeus };