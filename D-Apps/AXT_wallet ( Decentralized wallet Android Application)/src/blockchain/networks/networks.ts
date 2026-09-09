import { NetworkConfig } from './network.types';

export const ALCHEMY_API_KEY = 'alch_yk332E5GU-1Xh7LfQ077w';

/* ==========================================================================
   DEFAULT MAINNETS (Alchemy Primary + Public Fallback)
   ========================================================================== */

/** Ethereum Mainnet (Chain ID: 1) */
export const ETHEREUM: NetworkConfig = {
  chainId: 1,
  name: 'Ethereum',
  shortName: 'ETH',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://eth.llamarpc.com',
  explorerUrl: 'https://etherscan.io',
  explorerApiUrl: 'https://api.etherscan.io/api',
  isTestnet: false,
  isDefault: true,
  isCustom: false,
};

/** Base Mainnet (Chain ID: 8453) */
export const BASE: NetworkConfig = {
  chainId: 8453,
  name: 'Base',
  shortName: 'Base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org',
  explorerApiUrl: 'https://api.basescan.org/api',
  isTestnet: false,
  isDefault: true,
  isCustom: false,
};

/** BNB Smart Chain Mainnet (Chain ID: 56) */
export const BSC: NetworkConfig = {
  chainId: 56,
  name: 'BNB Smart Chain',
  shortName: 'BNB',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrl: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://bsc-dataseed.binance.org',
  explorerUrl: 'https://bscscan.com',
  explorerApiUrl: 'https://api.bscscan.com/api',
  isTestnet: false,
  isDefault: true,
  isCustom: false,
};

/** Polygon Mainnet (Chain ID: 137) */
export const POLYGON: NetworkConfig = {
  chainId: 137,
  name: 'Polygon',
  shortName: 'Polygon',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  explorerApiUrl: 'https://api.polygonscan.com/api',
  isTestnet: false,
  isDefault: true,
  isCustom: false,
};

/** Optimism Mainnet (Chain ID: 10) */
export const OPTIMISM: NetworkConfig = {
  chainId: 10,
  name: 'Optimism',
  shortName: 'Optimism',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://mainnet.optimism.io',
  explorerUrl: 'https://optimistic.etherscan.io',
  explorerApiUrl: 'https://api-optimistic.etherscan.io/api',
  isTestnet: false,
  isDefault: true,
  isCustom: false,
};

/** Arbitrum One Mainnet (Chain ID: 42161) */
export const ARBITRUM: NetworkConfig = {
  chainId: 42161,
  name: 'Arbitrum One',
  shortName: 'Arbitrum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://arb1.arbitrum.io/rpc',
  explorerUrl: 'https://arbiscan.io',
  explorerApiUrl: 'https://api.arbiscan.io/api',
  isTestnet: false,
  isDefault: true,
  isCustom: false,
};

export const DEFAULT_MAINNETS: NetworkConfig[] = [
  ETHEREUM,
  BASE,
  BSC,
  POLYGON,
  OPTIMISM,
  ARBITRUM,
];

/* ==========================================================================
   DEFAULT TESTNETS (Alchemy Primary + Public Fallback)
   ========================================================================== */

/** Sepolia — Ethereum Testnet (Chain ID: 11155111) */
export const SEPOLIA: NetworkConfig = {
  chainId: 11155111,
  name: 'Sepolia',
  shortName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://rpc.sepolia.org',
  explorerUrl: 'https://sepolia.etherscan.io',
  explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
  isTestnet: true,
  isDefault: true,
  isCustom: false,
};

/** BSC Testnet — BNB Smart Chain Testnet (Chain ID: 97) */
export const BSC_TESTNET: NetworkConfig = {
  chainId: 97,
  name: 'BSC Testnet',
  shortName: 'tBNB',
  nativeCurrency: {
    name: 'Test BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrl: `https://bnb-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  explorerUrl: 'https://testnet.bscscan.com',
  explorerApiUrl: 'https://api-testnet.bscscan.com/api',
  isTestnet: true,
  isDefault: true,
  isCustom: false,
};

/** Base Sepolia Testnet (Chain ID: 84532) */
export const BASE_SEPOLIA: NetworkConfig = {
  chainId: 84532,
  name: 'Base Sepolia',
  shortName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Base Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
  explorerApiUrl: 'https://api-sepolia.basescan.org/api',
  isTestnet: true,
  isDefault: true,
  isCustom: false,
};

/** Arbitrum Sepolia Testnet (Chain ID: 421614) */
export const ARBITRUM_SEPOLIA: NetworkConfig = {
  chainId: 421614,
  name: 'Arbitrum Sepolia',
  shortName: 'Arb Sepolia',
  nativeCurrency: {
    name: 'Arbitrum Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  explorerUrl: 'https://sepolia.arbiscan.io',
  explorerApiUrl: 'https://api-sepolia.arbiscan.io/api',
  isTestnet: true,
  isDefault: true,
  isCustom: false,
};

/** Optimism Sepolia Testnet (Chain ID: 11155420) */
export const OPTIMISM_SEPOLIA: NetworkConfig = {
  chainId: 11155420,
  name: 'Optimism Sepolia',
  shortName: 'OP Sepolia',
  nativeCurrency: {
    name: 'Optimism Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  fallbackRpcUrl: 'https://sepolia.optimism.io',
  explorerUrl: 'https://sepolia-optimism.etherscan.io',
  explorerApiUrl: 'https://api-sepolia-optimistic.etherscan.io/api',
  isTestnet: true,
  isDefault: true,
  isCustom: false,
};

export const DEFAULT_TESTNETS: NetworkConfig[] = [
  SEPOLIA,
  BSC_TESTNET,
  BASE_SEPOLIA,
  ARBITRUM_SEPOLIA,
  OPTIMISM_SEPOLIA,
];

/**
 * All default built-in networks (Mainnets + Testnets).
 */
export const DEFAULT_NETWORKS: NetworkConfig[] = [
  ...DEFAULT_MAINNETS,
  ...DEFAULT_TESTNETS,
];

/**
 * Backward compatibility alias for DEFAULT_NETWORKS.
 */
export const SUPPORTED_NETWORKS: NetworkConfig[] = DEFAULT_NETWORKS;

/**
 * The initial default active network.
 */
export const DEFAULT_NETWORK: NetworkConfig = SEPOLIA;
