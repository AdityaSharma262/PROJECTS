import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { customNetworkStorage } from '../../src/storage/custom-network-storage';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

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

describe('CustomNetworkStorage', () => {
  const mockNetwork1: NetworkConfig = {
    chainId: 1101,
    name: 'Polygon zkEVM',
    shortName: 'ETH',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://zkevm-rpc.com',
    isTestnet: false,
    isCustom: true,
    isDefault: false,
  };

  const mockNetwork2: NetworkConfig = {
    chainId: 534352,
    name: 'Scroll Mainnet',
    shortName: 'ETH',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://rpc.scroll.io',
    isTestnet: false,
    isCustom: true,
    isDefault: false,
  };

  beforeEach(() => {
    mockStore.clear();
  });

  it('saves and retrieves custom networks', async () => {
    await customNetworkStorage.saveCustomNetworks([mockNetwork1, mockNetwork2]);

    const networks = await customNetworkStorage.getCustomNetworks();
    expect(networks).toHaveLength(2);
    expect(networks[0].chainId).toBe(1101);
    expect(networks[1].chainId).toBe(534352);
  });

  it('adds a new custom network without duplicating chain ID', async () => {
    await customNetworkStorage.addCustomNetwork(mockNetwork1);
    await customNetworkStorage.addCustomNetwork(mockNetwork1); // Duplicate call

    const networks = await customNetworkStorage.getCustomNetworks();
    expect(networks).toHaveLength(1);

    await customNetworkStorage.addCustomNetwork(mockNetwork2);
    const networksAfter = await customNetworkStorage.getCustomNetworks();
    expect(networksAfter).toHaveLength(2);
  });

  it('updates an existing custom network', async () => {
    await customNetworkStorage.addCustomNetwork(mockNetwork1);

    const updated = await customNetworkStorage.updateCustomNetwork(1101, {
      name: 'Polygon zkEVM Updated',
      rpcUrl: 'https://new-zkevm-rpc.com',
    });

    expect(updated.name).toBe('Polygon zkEVM Updated');
    expect(updated.rpcUrl).toBe('https://new-zkevm-rpc.com');
    expect(updated.chainId).toBe(1101);

    const stored = await customNetworkStorage.getCustomNetworks();
    expect(stored[0].name).toBe('Polygon zkEVM Updated');
  });

  it('deletes a custom network by chain ID', async () => {
    await customNetworkStorage.saveCustomNetworks([mockNetwork1, mockNetwork2]);

    await customNetworkStorage.deleteCustomNetwork(1101);

    const stored = await customNetworkStorage.getCustomNetworks();
    expect(stored).toHaveLength(1);
    expect(stored[0].chainId).toBe(534352);
  });
});
