import { isAddress, formatUnits, formatEther } from 'ethers';
import { IHistoryProvider } from './history.provider.interface';
import {
  FetchHistoryResult,
  UnifiedTransactionRecord,
  TransactionDirection,
} from './history.types';
import { NetworkConfig } from '../networks/network.types';
import { trimDecimals } from '../balances/balance.utils';

export class ExplorerHistoryProvider implements IHistoryProvider {
  public readonly name = 'ExplorerHistoryProvider';

  /**
   * Fetches on-chain transaction history using Alchemy Asset Transfers API (if Alchemy RPC)
   * or Etherscan/BscScan-compatible API endpoints, falling back gracefully for custom networks.
   */
  async fetchHistory(
    address: string,
    network: NetworkConfig,
    page: number = 1,
    pageSize: number = 20
  ): Promise<FetchHistoryResult> {
    if (!address || !isAddress(address)) {
      return { records: [], hasMore: false };
    }

    const normalizedAddress = address.toLowerCase();

    // 1. If Network uses Alchemy RPC, use the unified Alchemy Asset Transfers API
    if (network.rpcUrl && network.rpcUrl.includes('alchemy.com')) {
      try {
        const alchemyResult = await this.fetchAlchemyTransfers(
          address,
          network,
          normalizedAddress,
          pageSize
        );
        if (alchemyResult.records.length > 0) {
          return alchemyResult;
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[ExplorerHistoryProvider] Alchemy transfers query failed, trying explorer API fallback:', err);
        }
      }
    }

    // 2. If network has explorerApiUrl, query standard Etherscan/BscScan endpoints
    if (network.explorerApiUrl) {
      try {
        return await this.fetchExplorerApiTransfers(
          address,
          network,
          normalizedAddress,
          page,
          pageSize
        );
      } catch (err) {
        if (__DEV__) {
          console.warn('[ExplorerHistoryProvider] Explorer API query failed:', err);
        }
      }
    }

    // 3. For custom chains or offline nodes without indexer APIs, return empty on-chain list
    // (TransactionHistoryService will merge all local transactions recorded for this chain)
    return { records: [], hasMore: false };
  }

  /**
   * Queries Alchemy's alchemy_getAssetTransfers endpoint for native and ERC-20 transfers.
   */
  private async fetchAlchemyTransfers(
    address: string,
    network: NetworkConfig,
    normalizedAddress: string,
    pageSize: number
  ): Promise<FetchHistoryResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const makeParams = (directionFilter: { fromAddress?: string; toAddress?: string }) => ({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [
        {
          fromBlock: '0x0',
          toBlock: 'latest',
          ...directionFilter,
          category: ['external', 'erc20'],
          withMetadata: true,
          excludeZeroValue: false,
          maxCount: `0x${pageSize.toString(16)}`,
          order: 'desc',
        },
      ],
    });

    const [inRes, outRes] = await Promise.allSettled([
      fetch(network.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeParams({ toAddress: address })),
        signal: controller.signal,
      }),
      fetch(network.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeParams({ fromAddress: address })),
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeoutId);

    const records: UnifiedTransactionRecord[] = [];
    const seenHashes = new Set<string>();

    const processTransfers = (transfers: any[]) => {
      if (!Array.isArray(transfers)) return;

      for (const tx of transfers) {
        const hash = tx.hash || '';
        const txFrom = (tx.from || '').toLowerCase();
        const txTo = (tx.to || '').toLowerCase();
        const isSelf = txFrom === normalizedAddress && txTo === normalizedAddress;
        const isOutgoing = txFrom === normalizedAddress && !isSelf;
        const direction: TransactionDirection = isSelf
          ? 'self'
          : isOutgoing
          ? 'outgoing'
          : 'incoming';

        const isErc20 = tx.category === 'erc20';
        const rawDecimals = tx.rawContract?.decimal;
        const decimals = rawDecimals
          ? typeof rawDecimals === 'string' && rawDecimals.startsWith('0x')
            ? parseInt(rawDecimals, 16)
            : parseInt(rawDecimals, 10) || 18
          : 18;

        const rawValue = tx.rawContract?.value;
        const rawAmount = rawValue
          ? typeof rawValue === 'string' && rawValue.startsWith('0x')
            ? BigInt(rawValue).toString()
            : rawValue.toString()
          : '0';

        const symbol = tx.asset || (isErc20 ? 'TOKEN' : network.nativeCurrency.symbol);
        const formattedAmount =
          tx.value != null
            ? trimDecimals(tx.value.toString(), 6)
            : trimDecimals(formatUnits(rawAmount, decimals), 6);

        const timestamp = tx.metadata?.blockTimestamp
          ? new Date(tx.metadata.blockTimestamp).getTime()
          : Date.now();

        const blockNum = tx.blockNum
          ? parseInt(tx.blockNum, 16) || parseInt(tx.blockNum, 10) || undefined
          : undefined;

        const recordId = `${network.chainId}_${hash}_${isErc20 ? 'erc20' : 'native'}_${txTo}`;

        if (!seenHashes.has(recordId)) {
          seenHashes.add(recordId);
          records.push({
            id: recordId,
            hash,
            chainId: network.chainId,
            timestamp,
            from: tx.from,
            to: tx.to,
            direction,
            assetType: isErc20 ? 'erc20' : 'native',
            assetSymbol: symbol,
            assetName: symbol,
            assetAddress: isErc20 ? tx.rawContract?.address || undefined : undefined,
            amountRaw: rawAmount,
            formattedAmount,
            status: 'confirmed',
            blockNumber: blockNum,
            explorerUrl: network.explorerUrl ? `${network.explorerUrl}/tx/${hash}` : undefined,
          });
        }
      }
    };

    if (inRes.status === 'fulfilled' && inRes.value.ok) {
      try {
        const inJson = await inRes.value.json();
        processTransfers(inJson?.result?.transfers);
      } catch {}
    }

    if (outRes.status === 'fulfilled' && outRes.value.ok) {
      try {
        const outJson = await outRes.value.json();
        processTransfers(outJson?.result?.transfers);
      } catch {}
    }

    records.sort((a, b) => b.timestamp - a.timestamp);
    return { records: records.slice(0, pageSize), hasMore: records.length >= pageSize };
  }

  /**
   * Queries standard Etherscan/BscScan explorer endpoints.
   */
  private async fetchExplorerApiTransfers(
    address: string,
    network: NetworkConfig,
    normalizedAddress: string,
    page: number,
    pageSize: number
  ): Promise<FetchHistoryResult> {
    const records: UnifiedTransactionRecord[] = [];
    let hasMore = false;

    const nativeUrl = `${network.explorerApiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc`;
    const tokenUrl = `${network.explorerApiUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const [nativeRes, tokenRes] = await Promise.allSettled([
      fetch(nativeUrl, { signal: controller.signal }),
      fetch(tokenUrl, { signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    // 1. Process Native Transactions
    if (nativeRes.status === 'fulfilled' && nativeRes.value.ok) {
      try {
        const nativeData = await nativeRes.value.json();
        if (Array.isArray(nativeData?.result)) {
          const rawList: any[] = nativeData.result;
          if (rawList.length === pageSize) hasMore = true;

          for (const tx of rawList) {
            const txFrom = (tx.from || '').toLowerCase();
            const txTo = (tx.to || '').toLowerCase();
            const isSelf = txFrom === normalizedAddress && txTo === normalizedAddress;
            const isOutgoing = txFrom === normalizedAddress && !isSelf;
            const direction: TransactionDirection = isSelf
              ? 'self'
              : isOutgoing
              ? 'outgoing'
              : 'incoming';

            const isFailed = tx.isError === '1' || tx.txreceipt_status === '0';
            const rawAmount = BigInt(tx.value || '0');
            const formattedAmount = trimDecimals(
              formatUnits(rawAmount, network.nativeCurrency.decimals),
              6
            );

            let feeWei = '0';
            let formattedFee = undefined;
            if (tx.gasUsed && tx.gasPrice) {
              const calculatedFee = BigInt(tx.gasUsed) * BigInt(tx.gasPrice);
              feeWei = calculatedFee.toString();
              formattedFee = `${trimDecimals(formatEther(calculatedFee), 6)} ${network.nativeCurrency.symbol}`;
            }

            const timestamp = parseInt(tx.timeStamp || '0', 10) * 1000 || Date.now();

            records.push({
              id: `${network.chainId}_${tx.hash}_native_${tx.transactionIndex ?? '0'}`,
              hash: tx.hash,
              chainId: network.chainId,
              timestamp,
              from: tx.from,
              to: tx.to,
              direction,
              assetType: 'native',
              assetSymbol: network.nativeCurrency.symbol,
              assetName: network.nativeCurrency.name,
              amountRaw: rawAmount.toString(),
              formattedAmount,
              status: isFailed ? 'failed' : 'confirmed',
              blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 10) : undefined,
              transactionIndex: tx.transactionIndex ? parseInt(tx.transactionIndex, 10) : undefined,
              explorerUrl: network.explorerUrl ? `${network.explorerUrl}/tx/${tx.hash}` : undefined,
              feeWei,
              formattedFee,
            });
          }
        }
      } catch {}
    }

    // 2. Process ERC-20 Token Transactions
    if (tokenRes.status === 'fulfilled' && tokenRes.value.ok) {
      try {
        const tokenData = await tokenRes.value.json();
        if (Array.isArray(tokenData?.result)) {
          const rawList: any[] = tokenData.result;
          if (rawList.length === pageSize) hasMore = true;

          for (const tx of rawList) {
            const txFrom = (tx.from || '').toLowerCase();
            const txTo = (tx.to || '').toLowerCase();
            const isSelf = txFrom === normalizedAddress && txTo === normalizedAddress;
            const isOutgoing = txFrom === normalizedAddress && !isSelf;
            const direction: TransactionDirection = isSelf
              ? 'self'
              : isOutgoing
              ? 'outgoing'
              : 'incoming';

            const decimals = parseInt(tx.tokenDecimal || '18', 10) || 18;
            const rawAmount = BigInt(tx.value || '0');
            const formattedAmount = trimDecimals(
              formatUnits(rawAmount, decimals),
              6
            );

            const timestamp = parseInt(tx.timeStamp || '0', 10) * 1000 || Date.now();
            const symbol = tx.tokenSymbol || 'TOKEN';
            const name = tx.tokenName || symbol;

            records.push({
              id: `${network.chainId}_${tx.hash}_erc20_${tx.contractAddress}_${tx.transactionIndex ?? '0'}`,
              hash: tx.hash,
              chainId: network.chainId,
              timestamp,
              from: tx.from,
              to: tx.to,
              direction,
              assetType: 'erc20',
              assetSymbol: symbol,
              assetName: name,
              assetAddress: tx.contractAddress,
              amountRaw: rawAmount.toString(),
              formattedAmount,
              status: 'confirmed',
              blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 10) : undefined,
              transactionIndex: tx.transactionIndex ? parseInt(tx.transactionIndex, 10) : undefined,
              explorerUrl: network.explorerUrl ? `${network.explorerUrl}/tx/${tx.hash}` : undefined,
            });
          }
        }
      } catch {}
    }

    records.sort((a, b) => b.timestamp - a.timestamp);
    return { records, hasMore };
  }
}

export const defaultExplorerHistoryProvider = new ExplorerHistoryProvider();
