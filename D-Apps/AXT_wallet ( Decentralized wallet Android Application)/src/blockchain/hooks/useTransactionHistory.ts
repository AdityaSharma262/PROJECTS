import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { transactionHistoryService } from '../history/history.service';
import { UnifiedTransactionRecord } from '../history/history.types';
import { NetworkConfig } from '../networks/network.types';

export type HistoryFilter = 'all' | 'incoming' | 'outgoing' | 'tokens';

export interface UseTransactionHistoryResult {
  transactions: UnifiedTransactionRecord[];
  filteredTransactions: UnifiedTransactionRecord[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  filter: HistoryFilter;
  setFilter: (filter: HistoryFilter) => void;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

const PAGE_SIZE = 20;

export function useTransactionHistory(
  address: string | undefined,
  network: NetworkConfig
): UseTransactionHistoryResult {
  const [transactions, setTransactions] = useState<UnifiedTransactionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<number>(0);

  const loadedContextRef = useRef<{ address: string; chainId: number } | null>(null);

  // Initial load or network/address switch
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    let isCurrent = true;

    const loadInitial = async () => {
      const isSameContext =
        loadedContextRef.current?.address === address &&
        loadedContextRef.current?.chainId === network.chainId;

      // Only show full loading spinner if we don't have cached data for this context
      if (!isSameContext) {
        setTransactions([]);
        setLoading(true);
      }

      setError(null);
      setPage(1);

      try {
        const result = await transactionHistoryService.getUnifiedHistory(
          address,
          network,
          1,
          PAGE_SIZE
        );

        if (isCurrent) {
          setTransactions(result.records);
          setHasMore(result.hasMore);
          setLoading(false);
          loadedContextRef.current = { address, chainId: network.chainId };
        }
      } catch (err: any) {
        if (isCurrent) {
          if (__DEV__) console.warn('[useTransactionHistory] Error fetching history:', err);
          setError('Unable to load transaction history.');
          setLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      isCurrent = false;
    };
  }, [address, network.chainId, trigger]);

  // Pull to refresh
  const refresh = useCallback(async () => {
    if (!address) return;
    setRefreshing(true);
    setError(null);

    try {
      const result = await transactionHistoryService.getUnifiedHistory(
        address,
        network,
        1,
        PAGE_SIZE
      );
      setTransactions(result.records);
      setHasMore(result.hasMore);
      setPage(1);
    } catch {
      setError('Unable to refresh history.');
    } finally {
      setRefreshing(false);
    }
  }, [address, network]);

  // Load more (next page)
  const loadMore = useCallback(async () => {
    if (!address || loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await transactionHistoryService.getUnifiedHistory(
        address,
        network,
        nextPage,
        PAGE_SIZE
      );

      if (result.records.length > 0) {
        // Append new items deduplicating by id
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = result.records.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
      }

      setHasMore(result.hasMore);
    } catch {
      // Ignore load more failure
    } finally {
      setLoadingMore(false);
    }
  }, [address, network, page, loadingMore, hasMore, loading]);

  // Filtered transactions for UI presentation
  const filteredTransactions = useMemo(() => {
    if (filter === 'incoming') {
      return transactions.filter((t) => t.direction === 'incoming');
    }
    if (filter === 'outgoing') {
      return transactions.filter((t) => t.direction === 'outgoing' || t.direction === 'self');
    }
    if (filter === 'tokens') {
      return transactions.filter((t) => t.assetType === 'erc20');
    }
    return transactions;
  }, [transactions, filter]);

  return {
    transactions,
    filteredTransactions,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    filter,
    setFilter,
    error,
    refresh,
    loadMore,
  };
}
