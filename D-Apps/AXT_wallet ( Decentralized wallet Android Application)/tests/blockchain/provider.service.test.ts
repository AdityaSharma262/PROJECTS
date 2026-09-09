import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EVMProviderService } from '../../src/blockchain/providers/provider.service';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';
import { JsonRpcProvider } from 'ethers';

// Mock ethers JsonRpcProvider
jest.mock('ethers', () => {
  const original = jest.requireActual<any>('ethers');
  return {
    ...original,
    JsonRpcProvider: jest.fn(),
  };
});

describe('EVMProviderService — Automatic Fallback & Primary Failover', () => {
  let service: EVMProviderService;

  const mockNetworkWithFallback: NetworkConfig = {
    chainId: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/mock_key',
    fallbackRpcUrl: 'https://eth.llamarpc.com',
    isTestnet: false,
    isDefault: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EVMProviderService();
  });

  it('connects to primary Alchemy RPC when reachable', async () => {
    (JsonRpcProvider as unknown as jest.Mock).mockImplementation((url: any) => ({
      getNetwork: jest.fn<() => Promise<any>>().mockResolvedValue({
        chainId: 1n,
        name: 'mainnet',
      }),
      destroy: jest.fn(),
    }));

    const result = await service.initialize(mockNetworkWithFallback);

    expect(result.success).toBe(true);
    expect(result.isFallback).toBe(false);
    expect(result.rpcUrl).toBe(mockNetworkWithFallback.rpcUrl);
    expect(service.getCurrentRpcUrl()).toBe(mockNetworkWithFallback.rpcUrl);
    expect(service.isUsingFallback()).toBe(false);
  });

  it('automatically falls back to public RPC when primary Alchemy RPC fails', async () => {
    (JsonRpcProvider as unknown as jest.Mock).mockImplementation((url: any) => {
      // Primary Alchemy fails
      if (url.includes('alchemy.com')) {
        return {
          getNetwork: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Alchemy 429 Too Many Requests')),
          destroy: jest.fn(),
        };
      }
      // Fallback public succeeds
      return {
        getNetwork: jest.fn<() => Promise<any>>().mockResolvedValue({
          chainId: 1n,
          name: 'mainnet',
        }),
        destroy: jest.fn(),
      };
    });

    const result = await service.initialize(mockNetworkWithFallback);

    expect(result.success).toBe(true);
    expect(result.isFallback).toBe(true);
    expect(result.rpcUrl).toBe(mockNetworkWithFallback.fallbackRpcUrl);
    expect(service.getCurrentRpcUrl()).toBe(mockNetworkWithFallback.fallbackRpcUrl);
    expect(service.isUsingFallback()).toBe(true);
  });

  it('returns failure when both primary and fallback RPCs are unreachable', async () => {
    (JsonRpcProvider as unknown as jest.Mock).mockImplementation(() => ({
      getNetwork: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Network down')),
      destroy: jest.fn(),
    }));

    const result = await service.initialize(mockNetworkWithFallback);

    expect(result.success).toBe(false);
    expect(service.isConnected()).toBe(false);
  });

  it('triggers runtime failoverToFallback smoothly', async () => {
    let activeUrl = mockNetworkWithFallback.rpcUrl;

    (JsonRpcProvider as unknown as jest.Mock).mockImplementation((url: any) => ({
      getNetwork: jest.fn<() => Promise<any>>().mockResolvedValue({
        chainId: 1n,
        name: 'mainnet',
      }),
      destroy: jest.fn(),
    }));

    // Initially on primary
    await service.initialize(mockNetworkWithFallback);
    expect(service.isUsingFallback()).toBe(false);

    // Failover
    const switched = await service.failoverToFallback();
    expect(switched).toBe(true);
    expect(service.isUsingFallback()).toBe(true);
    expect(service.getCurrentRpcUrl()).toBe(mockNetworkWithFallback.fallbackRpcUrl);
  });
});
