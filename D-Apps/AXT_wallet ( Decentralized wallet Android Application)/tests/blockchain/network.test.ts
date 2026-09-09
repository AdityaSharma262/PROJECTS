import { describe, it, expect } from '@jest/globals';
import {
  DEFAULT_MAINNETS,
  DEFAULT_TESTNETS,
  DEFAULT_NETWORKS,
  DEFAULT_NETWORK,
  ETHEREUM,
  BASE,
  BSC,
  POLYGON,
  OPTIMISM,
  ARBITRUM,
  SEPOLIA,
  BSC_TESTNET,
  BASE_SEPOLIA,
  ARBITRUM_SEPOLIA,
  OPTIMISM_SEPOLIA,
  ALCHEMY_API_KEY,
} from '../../src/blockchain/networks/networks';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

describe('Network Configuration — Alchemy Primary & Public Fallback', () => {
  it('contains all 6 required default mainnets', () => {
    const mainnetChainIds = DEFAULT_MAINNETS.map((n) => n.chainId);
    expect(mainnetChainIds).toEqual([
      ETHEREUM.chainId,
      BASE.chainId,
      BSC.chainId,
      POLYGON.chainId,
      OPTIMISM.chainId,
      ARBITRUM.chainId,
    ]);
    expect(DEFAULT_MAINNETS.every((n) => !n.isTestnet)).toBe(true);
    expect(DEFAULT_MAINNETS.every((n) => n.isDefault)).toBe(true);
    expect(DEFAULT_MAINNETS.every((n) => !n.isCustom)).toBe(true);
  });

  it('contains all 5 required default testnets', () => {
    const testnetChainIds = DEFAULT_TESTNETS.map((n) => n.chainId);
    expect(testnetChainIds).toEqual([
      SEPOLIA.chainId,
      BSC_TESTNET.chainId,
      BASE_SEPOLIA.chainId,
      ARBITRUM_SEPOLIA.chainId,
      OPTIMISM_SEPOLIA.chainId,
    ]);
    expect(DEFAULT_TESTNETS.every((n) => n.isTestnet)).toBe(true);
    expect(DEFAULT_TESTNETS.every((n) => n.isDefault)).toBe(true);
    expect(DEFAULT_TESTNETS.every((n) => !n.isCustom)).toBe(true);
  });

  it('configures all default networks with Alchemy as primary RPC', () => {
    DEFAULT_NETWORKS.forEach((n: NetworkConfig) => {
      expect(n.rpcUrl).toContain('alchemy.com');
      expect(n.rpcUrl).toContain(ALCHEMY_API_KEY);
      expect(n.nativeCurrency.decimals).toBe(18);
      expect(n.nativeCurrency.symbol.length).toBeGreaterThan(0);
    });
  });

  it('configures all default networks with a reliable fallback public RPC', () => {
    DEFAULT_NETWORKS.forEach((n: NetworkConfig) => {
      expect(n.fallbackRpcUrl).toBeDefined();
      expect(n.fallbackRpcUrl?.startsWith('http')).toBe(true);
      expect(n.fallbackRpcUrl).not.toContain(ALCHEMY_API_KEY); // Must be a separate public endpoint
    });
  });

  it('no two default networks share the same chainId', () => {
    const chainIds = DEFAULT_NETWORKS.map((n: NetworkConfig) => n.chainId);
    const unique = new Set(chainIds);
    expect(unique.size).toBe(chainIds.length);
  });

  it('DEFAULT_NETWORK is Sepolia testnet', () => {
    expect(DEFAULT_NETWORK.chainId).toBe(SEPOLIA.chainId);
  });
});
