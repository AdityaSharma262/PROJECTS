import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { transactionStorage } from '../../src/storage/transaction-storage';
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

describe('TransactionStorage', () => {
  const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const CHAIN_ID = 11155111;

  beforeEach(() => {
    mockStore.clear();
  });

  it('saves and retrieves transactions sorted by timestamp descending', async () => {
    const tx1: LocalTransactionRecord = {
      id: 'tx1',
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      from: TEST_ADDRESS,
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      amountWei: '100000000000000000',
      formattedAmount: '0.1 ETH',
      symbol: 'ETH',
      chainId: CHAIN_ID,
      timestamp: 1000,
      status: 'confirmed',
      feeWei: '420000000000000',
      formattedFee: '0.00042 ETH',
      nonce: 0,
      explorerUrl: 'https://sepolia.etherscan.io/tx/0x111',
    };

    const tx2: LocalTransactionRecord = {
      ...tx1,
      id: 'tx2',
      hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      timestamp: 2000,
      status: 'pending',
      nonce: 1,
    };

    await transactionStorage.saveTransaction(tx1);
    await transactionStorage.saveTransaction(tx2);

    const records = await transactionStorage.getTransactions(TEST_ADDRESS, CHAIN_ID);
    expect(records.length).toBe(2);
    // tx2 is newer (timestamp 2000 > 1000), so it should be first
    expect(records[0].hash).toBe(tx2.hash);
    expect(records[1].hash).toBe(tx1.hash);
  });

  it('filters pending transactions correctly', async () => {
    const tx1: LocalTransactionRecord = {
      id: 'tx1',
      hash: '0x111',
      from: TEST_ADDRESS,
      to: '0x709',
      amountWei: '100',
      formattedAmount: '0.1 ETH',
      symbol: 'ETH',
      chainId: CHAIN_ID,
      timestamp: 1000,
      status: 'confirmed',
      feeWei: '42',
      formattedFee: '0.00042 ETH',
      nonce: 0,
      explorerUrl: '',
    };

    const tx2: LocalTransactionRecord = {
      ...tx1,
      id: 'tx2',
      hash: '0x222',
      status: 'pending',
    };

    await transactionStorage.saveTransaction(tx1);
    await transactionStorage.saveTransaction(tx2);

    const pending = await transactionStorage.getPendingTransactions(TEST_ADDRESS, CHAIN_ID);
    expect(pending.length).toBe(1);
    expect(pending[0].hash).toBe('0x222');
  });

  it('updates transaction status and receipt details', async () => {
    const tx: LocalTransactionRecord = {
      id: 'tx1',
      hash: '0xabc123',
      from: TEST_ADDRESS,
      to: '0x709',
      amountWei: '100',
      formattedAmount: '0.1 ETH',
      symbol: 'ETH',
      chainId: CHAIN_ID,
      timestamp: 1000,
      status: 'pending',
      feeWei: '42',
      formattedFee: '0.00042 ETH',
      nonce: 0,
      explorerUrl: '',
    };

    await transactionStorage.saveTransaction(tx);

    await transactionStorage.updateTransactionStatus(
      '0xabc123',
      TEST_ADDRESS,
      CHAIN_ID,
      'confirmed',
      { blockNumber: 1234567, gasUsed: '21000' }
    );

    const records = await transactionStorage.getTransactions(TEST_ADDRESS, CHAIN_ID);
    expect(records[0].status).toBe('confirmed');
    expect(records[0].blockNumber).toBe(1234567);
    expect(records[0].gasUsed).toBe('21000');
  });
});
