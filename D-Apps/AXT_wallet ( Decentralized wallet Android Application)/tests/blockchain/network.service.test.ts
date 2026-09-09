import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { networkService } from '../../src/blockchain/networks/network.service';
import { JsonRpcProvider } from 'ethers';

// Mock ethers JsonRpcProvider
jest.mock('ethers', () => {
  const original = jest.requireActual<any>('ethers');
  return {
    ...original,
    JsonRpcProvider: jest.fn(),
  };
});

describe('NetworkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRpcAndChainId', () => {
    it('validates and succeeds when RPC reports the matching chain ID', async () => {
      (JsonRpcProvider as unknown as jest.Mock).mockImplementation(() => ({
        getNetwork: jest.fn<() => Promise<any>>().mockResolvedValue({
          chainId: 137n,
          name: 'polygon',
        }),
      }));

      const result = await networkService.validateRpcAndChainId(
        'https://polygon-rpc.com',
        137
      );

      expect(result.isValid).toBe(true);
      expect(result.actualChainId).toBe(137);
      expect(result.error).toBeUndefined();
    });

    it('rejects with error when RPC reports a mismatched chain ID', async () => {
      (JsonRpcProvider as unknown as jest.Mock).mockImplementation(() => ({
        getNetwork: jest.fn<() => Promise<any>>().mockResolvedValue({
          chainId: 1n, // Mainnet reported
          name: 'mainnet',
        }),
      }));

      const result = await networkService.validateRpcAndChainId(
        'https://rpc.example.com',
        137 // User entered 137
      );

      expect(result.isValid).toBe(false);
      expect(result.actualChainId).toBe(1);
      expect(result.error).toContain('Chain ID mismatch');
    });

    it('rejects invalid or non-http RPC URLs without connecting', async () => {
      const result1 = await networkService.validateRpcAndChainId('ws://invalid-rpc', 1);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('http');

      const result2 = await networkService.validateRpcAndChainId('', 1);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('required');
    });

    it('rejects invalid or non-positive chain IDs', async () => {
      const result = await networkService.validateRpcAndChainId(
        'https://rpc.example.com',
        -5
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('positive integer');
    });

    it('handles RPC connection errors gracefully', async () => {
      (JsonRpcProvider as unknown as jest.Mock).mockImplementation(() => ({
        getNetwork: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Connection refused')),
      }));

      const result = await networkService.validateRpcAndChainId(
        'https://broken-rpc.example.com',
        100
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Could not connect');
    });
  });

  describe('isDuplicateChainId', () => {
    it('detects duplicate chain IDs in default networks', async () => {
      // 1 is Ethereum, 11155111 is Sepolia
      expect(await networkService.isDuplicateChainId(1)).toBe(true);
      expect(await networkService.isDuplicateChainId(11155111)).toBe(true);
      expect(await networkService.isDuplicateChainId(9999999)).toBe(false);
    });
  });

  describe('buildCustomNetworkConfig', () => {
    it('builds a normalized NetworkConfig object with custom flags', () => {
      const config = networkService.buildCustomNetworkConfig({
        name: 'zkSync Era',
        rpcUrl: 'https://mainnet.era.zksync.io',
        chainId: 324,
        symbol: 'eth',
        explorerUrl: 'https://explorer.zksync.io',
      });

      expect(config.chainId).toBe(324);
      expect(config.name).toBe('zkSync Era');
      expect(config.shortName).toBe('ETH');
      expect(config.nativeCurrency.symbol).toBe('ETH');
      expect(config.nativeCurrency.decimals).toBe(18);
      expect(config.isCustom).toBe(true);
      expect(config.isDefault).toBe(false);
      expect(config.isTestnet).toBe(false);
      expect(config.explorerUrl).toBe('https://explorer.zksync.io');
    });
  });
});
