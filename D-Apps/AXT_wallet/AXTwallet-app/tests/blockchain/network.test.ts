import { describe, it, expect } from '@jest/globals';
import { SEPOLIA, BSC_TESTNET, SUPPORTED_NETWORKS, DEFAULT_NETWORK } from '../../src/blockchain/networks/networks';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

describe('Network Configuration', () => {
  it('SEPOLIA has correct chainId', () => {
    expect(SEPOLIA.chainId).toBe(11155111);
  });

  it('SEPOLIA is a testnet', () => {
    expect(SEPOLIA.isTestnet).toBe(true);
  });

  it('SEPOLIA native currency has 18 decimals', () => {
    expect(SEPOLIA.nativeCurrency.decimals).toBe(18);
  });

  it('BSC_TESTNET has correct chainId', () => {
    expect(BSC_TESTNET.chainId).toBe(97);
  });

  it('BSC_TESTNET native currency symbol is tBNB', () => {
    expect(BSC_TESTNET.nativeCurrency.symbol).toBe('tBNB');
  });

  it('BSC_TESTNET is a testnet', () => {
    expect(BSC_TESTNET.isTestnet).toBe(true);
  });

  it('SUPPORTED_NETWORKS contains both networks', () => {
    const chainIds = SUPPORTED_NETWORKS.map((n: NetworkConfig) => n.chainId);
    expect(chainIds).toContain(SEPOLIA.chainId);
    expect(chainIds).toContain(BSC_TESTNET.chainId);
  });

  it('all networks have an rpcUrl', () => {
    SUPPORTED_NETWORKS.forEach((n: NetworkConfig) => {
      expect(n.rpcUrl.startsWith('http')).toBe(true);
    });
  });

  it('all networks have an explorerUrl', () => {
    SUPPORTED_NETWORKS.forEach((n: NetworkConfig) => {
      expect(n.explorerUrl.startsWith('http')).toBe(true);
    });
  });

  it('no two networks share the same chainId', () => {
    const chainIds = SUPPORTED_NETWORKS.map((n: NetworkConfig) => n.chainId);
    const unique = new Set(chainIds);
    expect(unique.size).toBe(chainIds.length);
  });

  it('DEFAULT_NETWORK is Sepolia', () => {
    expect(DEFAULT_NETWORK.chainId).toBe(SEPOLIA.chainId);
  });
});
