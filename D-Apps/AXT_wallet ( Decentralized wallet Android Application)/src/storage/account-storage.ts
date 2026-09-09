import { appStorage } from './app-storage';
import { WalletAccount, AccountStorageData } from '../wallet/accounts/account.types';

export const ACCOUNT_STORAGE_KEY = 'AXT_WALLET_ACCOUNTS_V1';

function normalizeAccount(raw: any): WalletAccount {
  return {
    id: raw.id,
    index: raw.index,
    name: raw.name,
    address: raw.address,
    type: raw.type || 'hd',
    createdAt: raw.createdAt || Date.now(),
  };
}

function sortAccounts(accounts: WalletAccount[]): WalletAccount[] {
  const hdAccounts = accounts
    .filter((a) => a.type === 'hd')
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const importedAccounts = accounts
    .filter((a) => a.type === 'imported')
    .sort((a, b) => a.createdAt - b.createdAt);
  return [...hdAccounts, ...importedAccounts];
}

/**
 * Storage layer for public multi-account metadata.
 * SECURITY INVARIANT:
 * - Contains only non-sensitive public metadata (account names, derivation indices, public addresses).
 * - Never stores mnemonics, private keys, signers, or PINs.
 * - Persists activeAccountId across locks/restarts.
 */
export const accountStorage = {
  /**
   * Retrieves the full account storage payload.
   */
  async getStorageData(): Promise<AccountStorageData> {
    try {
      const raw = await appStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (!raw) {
        return { accounts: [], activeAccountId: '' };
      }
      const data = JSON.parse(raw);
      const accounts = Array.isArray(data.accounts)
        ? data.accounts.map(normalizeAccount)
        : [];
      return {
        accounts: sortAccounts(accounts),
        activeAccountId: data.activeAccountId || '',
      };
    } catch {
      return { accounts: [], activeAccountId: '' };
    }
  },

  /**
   * Retrieves all accounts (HD and imported).
   */
  async getAccounts(): Promise<WalletAccount[]> {
    const data = await this.getStorageData();
    return data.accounts || [];
  },

  /**
   * Saves the entire list of accounts, ensuring accounts are uniquely sorted.
   */
  async saveAccounts(accounts: WalletAccount[]): Promise<void> {
    const data = await this.getStorageData();
    const normalized = accounts.map(normalizeAccount);
    const sorted = sortAccounts(normalized);
    const activeAccountId = data.activeAccountId || (sorted.length > 0 ? sorted[0].id : '');

    await appStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify({
        accounts: sorted,
        activeAccountId,
      })
    );
  },

  /**
   * Returns the ID of the currently active account.
   */
  async getActiveAccountId(): Promise<string | null> {
    const data = await this.getStorageData();
    if (data.activeAccountId) return data.activeAccountId;
    if (data.accounts && data.accounts.length > 0) {
      return data.accounts[0].id;
    }
    return null;
  },

  /**
   * Sets the currently active account ID.
   */
  async setActiveAccountId(id: string): Promise<void> {
    const data = await this.getStorageData();
    data.activeAccountId = id;
    await appStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * Retrieves the currently active WalletAccount object.
   */
  async getActiveAccount(): Promise<WalletAccount | null> {
    const data = await this.getStorageData();
    if (!data.accounts || data.accounts.length === 0) return null;

    const found = data.accounts.find((a) => a.id === data.activeAccountId);
    return found || data.accounts[0];
  },

  /**
   * Adds a new account (HD or imported) and saves to storage.
   */
  async addAccount(account: WalletAccount): Promise<void> {
    const data = await this.getStorageData();
    const normalized = normalizeAccount(account);
    const exists = data.accounts.some(
      (a) =>
        a.id === normalized.id ||
        a.address.toLowerCase() === normalized.address.toLowerCase() ||
        (normalized.type === 'hd' && a.type === 'hd' && a.index === normalized.index)
    );

    if (!exists) {
      data.accounts.push(normalized);
      const sorted = sortAccounts(data.accounts);
      await appStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify({
          accounts: sorted,
          activeAccountId: data.activeAccountId || normalized.id,
        })
      );
    }
  },

  /**
   * Updates the user-friendly display name of an account.
   */
  async updateAccountName(id: string, name: string): Promise<void> {
    const data = await this.getStorageData();
    const account = data.accounts.find((a) => a.id === id);
    if (account && name.trim()) {
      account.name = name.trim();
      await appStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
    }
  },

  /**
   * Deletes an account by ID from storage.
   * If the active account was deleted, falls back to the first available account.
   */
  async deleteAccount(id: string): Promise<void> {
    const data = await this.getStorageData();
    const account = data.accounts.find((a) => a.id === id);
    if (!account) return;

    if (account.type === 'hd') {
      const hdCount = data.accounts.filter((a) => a.type === 'hd').length;
      if (hdCount <= 1) {
        throw new Error('Cannot remove the primary HD account.');
      }
    }

    data.accounts = data.accounts.filter((a) => a.id !== id);
    if (data.activeAccountId === id) {
      data.activeAccountId = data.accounts[0]?.id || '';
    }

    await appStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * Clears account storage (e.g. on full wallet wipe).
   */
  async clear(): Promise<void> {
    await appStorage.deleteItem(ACCOUNT_STORAGE_KEY);
  },
};
