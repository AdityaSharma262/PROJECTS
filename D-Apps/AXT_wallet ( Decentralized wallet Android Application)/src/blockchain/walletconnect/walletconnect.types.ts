import { NetworkConfig } from '../networks/network.types';
import { TransactionAnalysis, SignatureAnalysis } from '../security/security.types';

export interface WCDAppMetadata {
  name: string;
  url: string;
  icons: string[];
  description?: string;
  redirect?: {
    native?: string;
    universal?: string;
  };
}

export interface WCSession {
  topic: string;
  peer: WCDAppMetadata;
  approvedAccount: string;
  approvedAccountIndex?: number;
  approvedAccountName: string;
  approvedChainIds: number[];
  expiry: number;
}

export interface WCProposal {
  id: number;
  params: any;
  dApp: WCDAppMetadata;
  requestedChains: number[];
  requestedMethods: string[];
  requiredNamespaces: any;
  optionalNamespaces: any;
}

export interface WCRequest {
  id: number;
  topic: string;
  chainId: number;
  method: string;
  params: any;
  dApp?: WCDAppMetadata;
  account: string;
}

export interface WCTxReviewData {
  requestId: number;
  topic: string;
  dApp: WCDAppMetadata;
  from: string;
  to?: string;
  valueWei: bigint;
  formattedValue: string;
  symbol: string;
  data?: string;
  isContractInteraction: boolean;
  network: NetworkConfig;
  accountName: string;
  accountIndex?: number;
  gasLimit?: bigint;
  analysis: TransactionAnalysis;
}

export interface WCMsgReviewData {
  requestId: number;
  topic: string;
  dApp: WCDAppMetadata;
  method: 'personal_sign' | 'eth_sign' | 'eth_signTypedData_v4';
  from: string;
  rawMessage: any;
  displayMessage: string;
  typedDataDomain?: any;
  typedDataTypes?: any;
  typedDataValue?: any;
  network: NetworkConfig;
  accountName: string;
  accountIndex?: number;
  analysis: SignatureAnalysis;
}
