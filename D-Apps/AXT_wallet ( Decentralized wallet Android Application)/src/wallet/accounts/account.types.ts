export type AccountType = 'hd' | 'imported';

export interface WalletAccount {
  /** Unique deterministic identifier: e.g. "account-0", "imported-0x1234..." */
  id: string;
  /** BIP-44 account derivation index (0, 1, 2...) — only for HD accounts */
  index?: number;
  /** User-friendly display name (e.g. "Account 1", "Imported Wallet") */
  name: string;
  /** Public EVM hex address (0x...) */
  address: string;
  /** Account source/type */
  type: AccountType;
  /** Creation timestamp in milliseconds */
  createdAt: number;
}

export interface AccountStorageData {
  accounts: WalletAccount[];
  activeAccountId: string;
}

