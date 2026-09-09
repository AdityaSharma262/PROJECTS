import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ExplorerHistoryProvider } from '../../src/blockchain/history/explorer.history.provider';
import { SEPOLIA } from '../../src/blockchain/networks/networks';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

describe('ExplorerHistoryProvider — All Chains & Custom Networks', () => {
  const provider = new ExplorerHistoryProvider();
  const myAddress = '0x1111111111111111111111111111111111111111';
  const otherAddress = '0x2222222222222222222222222222222222222222';
  const tokenContract = '0x3333333333333333333333333333333333333333';

  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('queries and normalizes Alchemy Asset Transfers when on Alchemy RPC', async () => {
    const mockAlchemyData = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        transfers: [
          {
            blockNum: '0x4c4b40',
            hash: '0xalchemy111',
            from: otherAddress,
            to: myAddress,
            value: 2.5,
            asset: 'ETH',
            category: 'external',
            rawContract: {
              value: '0x22b1c8c1227a0000',
              address: null,
              decimal: '0x12',
            },
            metadata: {
              blockTimestamp: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            blockNum: '0x4c4b41',
            hash: '0xalchemy222',
            from: myAddress,
            to: otherAddress,
            value: 50.0,
            asset: 'USDC',
            category: 'erc20',
            rawContract: {
              value: '0x2faf080',
              address: tokenContract,
              decimal: '0x6',
            },
            metadata: {
              blockTimestamp: '2024-01-01T01:00:00.000Z',
            },
          },
        ],
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockAlchemyData,
      } as Response)
    );

    const result = await provider.fetchHistory(myAddress, SEPOLIA, 1, 20);

    expect(result.records).toHaveLength(2);

    const nativeTx = result.records.find((r) => r.hash === '0xalchemy111');
    expect(nativeTx?.direction).toBe('incoming');
    expect(nativeTx?.formattedAmount).toBe('2.5');
    expect(nativeTx?.assetSymbol).toBe('ETH');
    expect(nativeTx?.assetType).toBe('native');

    const tokenTx = result.records.find((r) => r.hash === '0xalchemy222');
    expect(tokenTx?.direction).toBe('outgoing');
    expect(tokenTx?.formattedAmount).toBe('50');
    expect(tokenTx?.assetSymbol).toBe('USDC');
    expect(tokenTx?.assetType).toBe('erc20');
  });

  it('queries Etherscan explorer API when on non-Alchemy network with explorerApiUrl', async () => {
    const mockCustomWithExplorer: NetworkConfig = {
      chainId: 534352,
      name: 'Scroll',
      shortName: 'Scroll',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrl: 'https://rpc.scroll.io',
      explorerUrl: 'https://scrollscan.com',
      explorerApiUrl: 'https://api.scrollscan.com/api',
      isTestnet: false,
    };

    const mockNativeData = {
      status: '1',
      result: [
        {
          hash: '0xscroll111',
          from: otherAddress,
          to: myAddress,
          value: '1000000000000000000',
          isError: '0',
          timeStamp: '1700000000',
        },
      ],
    };

    global.fetch = jest.fn((url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('action=txlist')) {
        return Promise.resolve({ ok: true, json: async () => mockNativeData } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ status: '1', result: [] }) } as Response);
    });

    const result = await provider.fetchHistory(myAddress, mockCustomWithExplorer, 1, 20);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].hash).toBe('0xscroll111');
    expect(result.records[0].direction).toBe('incoming');
  });

  it('returns empty list gracefully for custom networks without any explorer API', async () => {
    const mockCustomLocal: NetworkConfig = {
      chainId: 1337,
      name: 'Local Hardhat Node',
      shortName: 'Local',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrl: 'http://127.0.0.1:8545',
      isTestnet: true,
      isCustom: true,
    };

    const result = await provider.fetchHistory(myAddress, mockCustomLocal, 1, 20);
    expect(result.records).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});
