import { NetworkConfig } from '../networks/network.types';
import { TokenConfig } from '../tokens/token.types';

export type TransactionKind =
  | 'native_transfer'
  | 'erc20_transfer'
  | 'erc20_approval'
  | 'erc20_transfer_from'
  | 'contract_interaction'
  | 'unknown';

export type TransactionRisk = 'low' | 'medium' | 'high';

export interface TokenSummary {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
}

export interface ApprovalSummary {
  spender: string;
  amountRaw: string;
  formattedAmount: string;
  unlimited: boolean;
}

export interface ContractSummary {
  address: string;
  selector?: string;
  calldata?: string;
}

export interface TransactionAnalysis {
  kind: TransactionKind;
  risk: TransactionRisk;

  title: string;
  summary: string;

  recipient?: string;

  token?: TokenSummary;

  amountRaw?: string;
  formattedAmount?: string;

  approval?: ApprovalSummary;

  contract?: ContractSummary;

  warnings: string[];
}

export interface RawTransactionInput {
  from?: string;
  to?: string;
  value?: bigint | string | number;
  data?: string;
  chainId?: number;
}

export type SignatureKind =
  | 'personal_message'
  | 'raw_message'
  | 'typed_data'
  | 'unknown';

export type SignatureRisk = 'low' | 'medium' | 'high';

export interface EIP712DomainSummary {
  name?: string;
  version?: string;
  chainId?: number | string;
  verifyingContract?: string;
  salt?: string;
  [key: string]: any;
}

export interface StructuredField {
  key: string;
  value: string;
  isNested?: boolean;
}

export interface SignatureAnalysis {
  kind: SignatureKind;
  risk: SignatureRisk;
  method: string;

  title: string;
  summary: string;

  accountAddress: string;

  decodedMessage?: string;

  typedDataDomain?: EIP712DomainSummary;
  primaryType?: string;
  structuredFields?: StructuredField[];

  rawPayload: string;

  warnings: string[];
}

