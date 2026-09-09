import { IHistoryProvider } from './history.provider.interface';
import { defaultExplorerHistoryProvider } from './explorer.history.provider';
import {
  UnifiedTransactionRecord,
  FetchHistoryResult,
  TransactionDirection,
} from './history.types';
import { NetworkConfig } from '../networks/network.types';
import { transactionStorage } from '../../storage/transaction-storage';

export class TransactionHistoryService {
  private provider: IHistoryProvider;

  constructor(provider: IHistoryProvider = defaultExplorerHistoryProvider) {
    this.provider = provider;
  }

  /**
   * Allows replacing or reconfiguring the underlying history provider adapter.
   */
  setProvider(provider: IHistoryProvider): void {
    this.provider = provider;
  }

  /**
   * Returns the currently active history provider adapter.
   */
  getProvider(): IHistoryProvider {
    return this.provider;
  }

  /**
   * Fetches unified, on-chain discovered transaction history merged with
   * local pending transactions, reconciling confirmations and deduplicating records.
   *
   * @param address - User's active wallet address
   * @param network - Active network configuration
   * @param page - 1-based pagination page
   * @param pageSize - Items per page
   */
  async getUnifiedHistory(
    address: string,
    network: NetworkConfig,
    page: number = 1,
    pageSize: number = 20
  ): Promise<FetchHistoryResult> {
    if (!address) {
      return { records: [], hasMore: false };
    }

    const normalizedAddress = address.toLowerCase();

    // 1. Fetch on-chain discovered history from the configured provider
    const onChainResult = await this.provider.fetchHistory(
      address,
      network,
      page,
      pageSize
    );

    // 2. If beyond page 1, return the paginated on-chain slice directly
    if (page > 1) {
      return onChainResult;
    }

    // 3. Page 1: Load locally recorded transactions from storage
    const localRecords = await transactionStorage.getTransactions(
      address,
      network.chainId
    );

    const onChainHashMap = new Set(
      onChainResult.records.map((r) => r.hash.toLowerCase())
    );

    // 4. Merge and deduplicate
    const recordMap = new Map<string, UnifiedTransactionRecord>();

    // A. Add all on-chain discovered records first (they have verified block numbers and receipts)
    for (const rec of onChainResult.records) {
      const key = `${rec.hash.toLowerCase()}_${(rec.assetType || 'native').toLowerCase()}`;
      recordMap.set(key, rec);
    }

    // B. Reconcile and add all local records (both pending and confirmed)
    for (const localTx of localRecords) {
      const localHash = localTx.hash.toLowerCase();

      // If pending locally but confirmed on-chain, update storage status
      if (localTx.status === 'pending' && onChainHashMap.has(localHash)) {
        await transactionStorage.updateTransactionStatus(
          localTx.hash,
          address,
          network.chainId,
          'confirmed'
        );
      }

      const key = `${localHash}_${(localTx.assetType || 'native').toLowerCase()}`;

      // If on-chain explorer didn't find this record (e.g. rate limit, indexer delay, or local pending),
      // include the locally tracked record so it is ALWAYS visible to the user!
      if (!recordMap.has(key)) {
        const isSelf =
          localTx.from.toLowerCase() === normalizedAddress &&
          localTx.to.toLowerCase() === normalizedAddress;
        const isOutgoing =
          localTx.from.toLowerCase() === normalizedAddress && !isSelf;
        const direction: TransactionDirection = isSelf
          ? 'self'
          : isOutgoing
          ? 'outgoing'
          : 'incoming';

        recordMap.set(key, {
          id: localTx.id || `${network.chainId}_${localTx.hash}`,
          hash: localTx.hash,
          chainId: network.chainId,
          timestamp: localTx.timestamp,
          from: localTx.from,
          to: localTx.to,
          direction,
          assetType: localTx.assetType || 'native',
          assetSymbol: localTx.symbol,
          assetAddress: localTx.tokenAddress,
          amountRaw: localTx.amountWei,
          formattedAmount: localTx.formattedAmount,
          status: localTx.status,
          blockNumber: localTx.blockNumber,
          explorerUrl: localTx.explorerUrl,
          feeWei: localTx.feeWei,
          formattedFee: localTx.formattedFee,
        });
      }
    }

    const allRecords = Array.from(recordMap.values());

    // 5. Sort: Pending first, then chronologically descending
    allRecords.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return b.timestamp - a.timestamp;
    });

    return {
      records: allRecords,
      hasMore: onChainResult.hasMore,
    };
  }
}

export const transactionHistoryService = new TransactionHistoryService();
