import { appStorage } from './app-storage';
import { LocalTransactionRecord, TransactionStatus } from '../blockchain/transactions/transaction.types';

function getStorageKey(address: string, chainId: number): string {
  return `AXT_TX_HISTORY_V1_${address.toLowerCase()}_${chainId}`;
}

export const transactionStorage = {
  /**
   * Saves a new or updated transaction record to local persistent storage.
   * Optionally saves under a specific owner address (e.g. for recipient accounts).
   */
  async saveTransaction(record: LocalTransactionRecord, ownerAddress?: string): Promise<void> {
    const targetAddress = ownerAddress || record.from;
    const key = getStorageKey(targetAddress, record.chainId);
    const existingJson = await appStorage.getItem(key);
    let list: LocalTransactionRecord[] = existingJson ? JSON.parse(existingJson) : [];

    // Replace if existing with same hash or id, otherwise prepend
    const index = list.findIndex(
      (tx) => tx.hash.toLowerCase() === record.hash.toLowerCase() || tx.id === record.id
    );

    if (index >= 0) {
      list[index] = { ...list[index], ...record };
    } else {
      list.unshift(record);
    }

    // Sort descending by timestamp
    list.sort((a, b) => b.timestamp - a.timestamp);

    await appStorage.setItem(key, JSON.stringify(list));
  },

  /**
   * Retrieves all stored transaction records for a given address and network chain ID.
   */
  async getTransactions(address: string, chainId: number): Promise<LocalTransactionRecord[]> {
    if (!address) return [];
    const key = getStorageKey(address, chainId);
    const json = await appStorage.getItem(key);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Retrieves only pending transactions for a given address and network chain ID.
   */
  async getPendingTransactions(address: string, chainId: number): Promise<LocalTransactionRecord[]> {
    const all = await this.getTransactions(address, chainId);
    return all.filter((tx) => tx.status === 'pending');
  },

  /**
   * Updates the status and optional receipt details of an existing transaction record.
   */
  async updateTransactionStatus(
    hash: string,
    address: string,
    chainId: number,
    status: TransactionStatus,
    extra?: { blockNumber?: number; gasUsed?: string }
  ): Promise<void> {
    const key = getStorageKey(address, chainId);
    const existingJson = await appStorage.getItem(key);
    if (!existingJson) return;

    try {
      const list: LocalTransactionRecord[] = JSON.parse(existingJson);
      let updated = false;

      for (let i = 0; i < list.length; i++) {
        if (list[i].hash.toLowerCase() === hash.toLowerCase()) {
          list[i].status = status;
          if (extra?.blockNumber) list[i].blockNumber = extra.blockNumber;
          if (extra?.gasUsed) list[i].gasUsed = extra.gasUsed;
          updated = true;
          break;
        }
      }

      if (updated) {
        await appStorage.setItem(key, JSON.stringify(list));
      }
    } catch {
      // Ignore JSON parse errors
    }
  },
};
