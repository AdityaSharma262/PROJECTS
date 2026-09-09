export interface TokenConfig {
  /** Chain ID the token contract is deployed on */
  chainId: number;
  /** Checksummed EVM contract address */
  contractAddress: string;
  /** Human-readable token name e.g. "USD Coin" */
  name: string;
  /** Token ticker symbol e.g. "USDC" */
  symbol: string;
  /** Decimals for unit conversion e.g. 6 or 18 */
  decimals: number;
  /** Whether the token was imported by the user (true) or is a default preset (false) */
  isCustom?: boolean;
  /** Optional token logo/icon image URL (HTTPS or IPFS) */
  logoUrl?: string;
}

export interface TokenMetadataResult {
  success: boolean;
  token?: TokenConfig;
  error?: string;
}

export interface TokenBalanceModel {
  token: TokenConfig;
  /** Raw balance in base units (as BigInt to avoid float precision bugs) */
  rawBalance: bigint;
  /** Human-readable formatted balance string */
  formatted: string;
  /** ISO timestamp of when the balance was fetched */
  lastUpdatedAt: string;
}

export type AssetType = 'native' | 'erc20';

export interface WalletAsset {
  type: AssetType;
  name: string;
  symbol: string;
  decimals: number;
  rawBalance: bigint;
  formattedBalance: string;
  chainId: number;
  tokenConfig?: TokenConfig;
  logoUrl?: string;
}
