export type TransactionDirection = 'incoming' | 'outgoing' | 'self';
export type TransactionAssetType = 'native' | 'erc20';
export type UnifiedTransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface UnifiedTransactionRecord {
  /** Unique deterministic identifier: e.g. `${chainId}_${hash}_${assetType}_${to}` */
  id: string;
  /** Blockchain transaction hash (0x...) */
  hash: string;
  /** Chain ID of the network */
  chainId: number;
  /** Epoch timestamp in milliseconds */
  timestamp: number;
  /** Sender address */
  from: string;
  /** Recipient address (or contract address if interacting with contracts) */
  to: string;
  /** Direction relative to the active user's wallet address */
  direction: TransactionDirection;
  /** Asset type transferred: native currency (ETH/tBNB) or ERC-20 token */
  assetType: TransactionAssetType;
  /** Ticker symbol of the asset (e.g. "ETH", "tBNB", "USDT", "DAI") */
  assetSymbol: string;
  /** Optional human-readable asset name */
  assetName?: string;
  /** Token smart contract address (present for ERC-20 tokens) */
  assetAddress?: string;
  /** Raw transfer amount in atomic units (BigInt as string) */
  amountRaw: string;
  /** Human-readable formatted amount (e.g. "0.05", "100.25") */
  formattedAmount: string;
  /** Execution status */
  status: UnifiedTransactionStatus;
  /** Block number if confirmed */
  blockNumber?: number;
  /** Index of the transaction in the block */
  transactionIndex?: number;
  /** Direct link to view on the active network block explorer */
  explorerUrl?: string;
  /** Transaction fee in atomic units (wei) */
  feeWei?: string;
  /** Human-readable fee string */
  formattedFee?: string;
}

export interface FetchHistoryResult {
  records: UnifiedTransactionRecord[];
  hasMore: boolean;
}
