import { NetworkConfig } from './network.types';

/**
 * Sepolia — Ethereum testnet (chainId: 11155111)
 * The reference testnet for Ethereum.
 */
export const SEPOLIA: NetworkConfig = {
  chainId: 11155111,
  name: 'Sepolia Testnet',
  shortName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/alch_yk332E5GU-1Xh7LfQ077w',
  explorerUrl: 'https://sepolia.etherscan.io',
  isTestnet: true,
};

/**
 * BSC Testnet — BNB Smart Chain testnet (chainId: 97)
 * The official Binance Smart Chain testnet, using tBNB as the native token.
 */
export const BSC_TESTNET: NetworkConfig = {
  chainId: 97,
  name: 'BSC Testnet',
  shortName: 'tBNB',
  nativeCurrency: {
    name: 'Test BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrl: 'https://bnb-testnet.g.alchemy.com/v2/alch_yk332E5GU-1Xh7LfQ077w',
  explorerUrl: 'https://testnet.bscscan.com',
  isTestnet: true,
};

/**
 * All supported networks in the application.
 * Add new NetworkConfig entries here to support additional networks.
 * Business logic must not need to change to support new entries.
 */
export const SUPPORTED_NETWORKS: NetworkConfig[] = [SEPOLIA, BSC_TESTNET];

/**
 * The default active network.
 * Phase 4A: Start with Sepolia. Can be made configurable via user preference later.
 */
export const DEFAULT_NETWORK: NetworkConfig = SEPOLIA;
