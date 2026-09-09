export type FeeModel = 'eip1559' | 'legacy';

export interface FeeEstimate {
  feeModel: FeeModel;
  /** Max fee per gas in wei (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Max priority fee per gas (miner tip) in wei (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Gas price in wei (Legacy) */
  gasPrice?: bigint;
  /** Estimated gas limit including safety buffer */
  gasLimit: bigint;
  /** Worst-case maximum possible fee: gasLimit * (maxFeePerGas || gasPrice) */
  maxPossibleFeeWei: bigint;
  /** Expected standard fee: gasLimit * (estimatedBaseFee + maxPriorityFee || gasPrice) */
  estimatedFeeWei: bigint;
  /** Human readable expected fee e.g. "0.000042 ETH" */
  formattedFee: string;
  /** Human readable maximum fee e.g. "0.000050 ETH" */
  formattedMaxFee: string;
}

export interface PopulatedTxRequest {
  to: string;
  from: string;
  value: bigint;
  nonce: number;
  gasLimit: bigint;
  chainId: number;
  type: number; // 2 = EIP-1559, 0 = Legacy
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasPrice?: bigint;
  data?: string;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export type AssetType = 'native' | 'erc20';

export interface LocalTransactionRecord {
  id: string;
  hash: string;
  from: string;
  to: string;
  amountWei: string;
  formattedAmount: string;
  symbol: string;
  chainId: number;
  timestamp: number;
  status: TransactionStatus;
  feeWei: string;
  formattedFee: string;
  nonce: number;
  explorerUrl: string;
  blockNumber?: number;
  gasUsed?: string;
  assetType?: AssetType;
  tokenAddress?: string;
  tokenDecimals?: number;
}

export type SendTxStatus =
  | 'idle'
  | 'preparing'
  | 'reviewing'
  | 'revalidating'
  | 'signing'
  | 'broadcasting'
  | 'success'
  | 'error';
