/**
 * Represents the configuration for a single EVM-compatible network.
 * RPC URLs are configured here and nowhere else in the application.
 */
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  nativeCurrency: NativeCurrency;
  /** Primary RPC endpoint (e.g. Alchemy) */
  rpcUrl: string;
  /** Automatic fallback public RPC endpoint */
  fallbackRpcUrl?: string;
  explorerUrl?: string;
  explorerApiUrl?: string;
  isTestnet: boolean;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface AddCustomNetworkInput {
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  decimals?: number;
  explorerUrl?: string;
}

export interface NetworkValidationResult {
  isValid: boolean;
  actualChainId?: number;
  error?: string;
}
