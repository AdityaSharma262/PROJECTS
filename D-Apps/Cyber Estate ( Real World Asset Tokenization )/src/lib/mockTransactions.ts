export type TxStatus = "confirmed" | "pending" | "failed";
export type TxType =
  | "purchase"
  | "yield_claim"
  | "transfer"
  | "mint"
  | "redeem"
  | "whitelist"
  | "trade"
  | "kyc_verify"
  | "kyc_revoke"
  | "order_cancel";

export interface Transaction {
  id: string;
  txHash: string;
  type: TxType;
  status: TxStatus;
  assetName: string;
  from: string;
  to: string;
  amount: number;
  tokenSymbol: string;
  timestamp: string;
  blockNumber: number | null;
  gasUsed: string | null;
}

export const mockTransactions: Transaction[] = [];
