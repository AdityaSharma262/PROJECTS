import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { walletConnectService } from '../../src/blockchain/walletconnect/walletconnect.service';

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

describe('WalletConnectService', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe('normalizeProposal', () => {
    it('normalizes a raw WalletConnect proposal with required and optional namespaces', () => {
      const rawProposal = {
        id: 123456,
        params: {
          proposer: {
            metadata: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              icons: ['https://app.uniswap.org/icon.png'],
              description: 'Decentralized Exchange',
            },
          },
          requiredNamespaces: {
            eip155: {
              chains: ['eip155:1', 'eip155:8453'],
              methods: ['eth_sendTransaction', 'personal_sign'],
              events: ['chainChanged', 'accountsChanged'],
            },
          },
          optionalNamespaces: {
            eip155: {
              chains: ['eip155:137', 'eip155:11155111'],
              methods: ['eth_signTypedData_v4'],
              events: [],
            },
          },
        },
      };

      const normalized = walletConnectService.normalizeProposal(rawProposal);

      expect(normalized.id).toBe(123456);
      expect(normalized.dApp.name).toBe('Uniswap V3');
      expect(normalized.dApp.url).toBe('https://app.uniswap.org');
      expect(normalized.requestedChains).toEqual([1, 8453, 137, 11155111]);
      expect(normalized.requestedMethods).toContain('eth_sendTransaction');
      expect(normalized.requestedMethods).toContain('personal_sign');
      expect(normalized.requestedMethods).toContain('eth_signTypedData_v4');
    });
  });

  describe('normalizeRequest', () => {
    it('normalizes raw session request parameters', () => {
      const rawRequest = {
        id: 7890,
        topic: 'mock-topic-123',
        params: {
          chainId: 'eip155:1',
          request: {
            method: 'eth_sendTransaction',
            params: [
              {
                from: '0x1111111111111111111111111111111111111111',
                to: '0x2222222222222222222222222222222222222222',
                value: '0xde0b6b3a7640000',
              },
            ],
          },
        },
      };

      const normalized = walletConnectService.normalizeRequest(rawRequest);

      expect(normalized.id).toBe(7890);
      expect(normalized.topic).toBe('mock-topic-123');
      expect(normalized.chainId).toBe(1);
      expect(normalized.method).toBe('eth_sendTransaction');
      expect(normalized.params).toHaveLength(1);
    });
  });

  describe('Session Bindings Persistence', () => {
    it('persists and retrieves account and chain bindings per session topic', async () => {
      await walletConnectService.saveSessionBinding({
        topic: 'topic-alpha',
        approvedAccount: '0x1111111111111111111111111111111111111111',
        approvedAccountIndex: 0,
        approvedAccountName: 'Account 1',
        approvedChainIds: [1, 8453],
      });

      const bindings = await walletConnectService.getSessionBindings();
      expect(bindings).toHaveLength(1);
      expect(bindings[0].topic).toBe('topic-alpha');
      expect(bindings[0].approvedAccountName).toBe('Account 1');
      expect(bindings[0].approvedChainIds).toEqual([1, 8453]);

      await walletConnectService.removeSessionBinding('topic-alpha');
      const afterDelete = await walletConnectService.getSessionBindings();
      expect(afterDelete).toHaveLength(0);
    });
  });
});
