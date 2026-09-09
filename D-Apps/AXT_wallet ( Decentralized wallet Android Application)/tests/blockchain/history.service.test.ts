import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TransactionHistoryService } from '../../src/blockchain/history/history.service';
import { IHistoryProvider } from '../../src/blockchain/history/history.provider.interface';
import { UnifiedTransactionRecord, FetchHistoryResult } from '../../src/blockchain/history/history.types';
import { transactionStorage } from '../../src/storage/transaction-storage';
import { SEPOLIA } from '../../src/blockchain/networks/networks';
import { LocalTransactionRecord } from '../../src/blockchain/transactions/transaction.types';

// Mock appStorage
const mockStore = new Map<string, string>();
jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    }),
    getItem: jest.fn(async (key: string) => {
      return mockStore.get(key) || null;
    }),
    deleteItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
  },
}));

describe('TransactionHistoryService', () => {
  const myAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const otherAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  let mockProvider: IHistoryProvider;
  let service: TransactionHistoryService;

  beforeEach(() => {
    mockStore.clear();

    mockProvider = {
      name: 'MockHistoryProvider',
      fetchHistory: jest.fn<() => Promise<FetchHistoryResult>>().mockResolvedValue({
        records: [
          {
            id: '11155111_0xconfirmed111_native_0',
            hash: '0xconfirmed111',
            chainId: 11155111,
            timestamp: 1000,
            from: otherAddress,
            to: myAddress,
            direction: 'incoming',
            assetType: 'native',
            assetSymbol: 'ETH',
            amountRaw: '1000000000000000000',
            formattedAmount: '1.0',
            status: 'confirmed',
            explorerUrl: 'https://sepolia.etherscan.io/tx/0xconfirmed111',
          },
        ],
        hasMore: false,
      }),
    };

    service = new TransactionHistoryService(mockProvider);
  });

  it('fetches on-chain history and merges unconfirmed local pending transactions at top', async () => {
    // Save a pending local transaction
    const localPending: LocalTransactionRecord = {
      id: 'tx_pending_1',
      hash: '0xpending999',
      from: myAddress,
      to: otherAddress,
      amountWei: '500000000000000000',
      formattedAmount: '0.5 ETH',
      symbol: 'ETH',
      chainId: 11155111,
      timestamp: 2000,
      status: 'pending',
      feeWei: '420000000000000',
      formattedFee: '0.00042 ETH',
      nonce: 1,
      explorerUrl: 'https://sepolia.etherscan.io/tx/0xpending999',
    };

    await transactionStorage.saveTransaction(localPending);

    const result = await service.getUnifiedHistory(myAddress, SEPOLIA, 1, 20);

    expect(result.records).toHaveLength(2);
    // Pending transaction should be first
    expect(result.records[0].hash).toBe('0xpending999');
    expect(result.records[0].status).toBe('pending');
    expect(result.records[0].direction).toBe('outgoing');

    // Confirmed on-chain transaction should be second
    expect(result.records[1].hash).toBe('0xconfirmed111');
    expect(result.records[1].status).toBe('confirmed');
  });

  it('reconciles local pending status to confirmed when it appears in on-chain history', async () => {
    // Local storage has a pending record with hash '0xconfirmed111'
    const localPending: LocalTransactionRecord = {
      id: 'tx_reconciled_1',
      hash: '0xconfirmed111',
      from: myAddress,
      to: otherAddress,
      amountWei: '1000000000000000000',
      formattedAmount: '1.0 ETH',
      symbol: 'ETH',
      chainId: 11155111,
      timestamp: 1000,
      status: 'pending',
      feeWei: '420000000000000',
      formattedFee: '0.00042 ETH',
      nonce: 0,
      explorerUrl: '',
    };

    await transactionStorage.saveTransaction(localPending);

    const result = await service.getUnifiedHistory(myAddress, SEPOLIA, 1, 20);

    // Should not duplicate the transaction
    expect(result.records).toHaveLength(1);
    expect(result.records[0].hash).toBe('0xconfirmed111');
    expect(result.records[0].status).toBe('confirmed');

    // Stored transaction status should be updated to 'confirmed'
    const stored = await transactionStorage.getTransactions(myAddress, 11155111);
    expect(stored[0].status).toBe('confirmed');
  });

  it('allows swapping the underlying history provider adapter via setProvider', async () => {
    const customProvider: IHistoryProvider = {
      name: 'CustomIndexerProvider',
      fetchHistory: jest.fn<() => Promise<FetchHistoryResult>>().mockResolvedValue({
        records: [
          {
            id: '11155111_0xcustom_erc20_0',
            hash: '0xcustom',
            chainId: 11155111,
            timestamp: 5000,
            from: otherAddress,
            to: myAddress,
            direction: 'incoming',
            assetType: 'erc20',
            assetSymbol: 'USDC',
            amountRaw: '100000000',
            formattedAmount: '100.0',
            status: 'confirmed',
            explorerUrl: '',
          },
        ],
        hasMore: false,
      }),
    };

    service.setProvider(customProvider);
    expect(service.getProvider().name).toBe('CustomIndexerProvider');

    const result = await service.getUnifiedHistory(myAddress, SEPOLIA, 1, 20);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].assetSymbol).toBe('USDC');
  });

  it('displays confirmed local token transactions even when explorer indexer returns empty results', async () => {
    // Explorer returns empty records
    const emptyProvider: IHistoryProvider = {
      name: 'EmptyProvider',
      fetchHistory: jest.fn<() => Promise<FetchHistoryResult>>().mockResolvedValue({
        records: [],
        hasMore: false,
      }),
    };
    service.setProvider(emptyProvider);

    const localConfirmedToken: LocalTransactionRecord = {
      id: 'tx_confirmed_token_1',
      hash: '0xtokentx123',
      from: myAddress,
      to: otherAddress,
      amountWei: '100000000',
      formattedAmount: '100.0 USDT',
      symbol: 'USDT',
      chainId: 11155111,
      timestamp: 3000,
      status: 'confirmed',
      feeWei: '420000000000000',
      formattedFee: '0.00042 ETH',
      nonce: 2,
      explorerUrl: 'https://sepolia.etherscan.io/tx/0xtokentx123',
      assetType: 'erc20',
      tokenAddress: '0x1111111111111111111111111111111111111111',
      tokenDecimals: 6,
    };

    await transactionStorage.saveTransaction(localConfirmedToken);

    const result = await service.getUnifiedHistory(myAddress, SEPOLIA, 1, 20);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].hash).toBe('0xtokentx123');
    expect(result.records[0].assetType).toBe('erc20');
    expect(result.records[0].assetSymbol).toBe('USDT');
    expect(result.records[0].status).toBe('confirmed');
    expect(result.records[0].direction).toBe('outgoing');
  });
});
