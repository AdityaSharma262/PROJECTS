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
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}
