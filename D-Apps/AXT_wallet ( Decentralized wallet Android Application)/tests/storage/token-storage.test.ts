import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { tokenStorage } from '../../src/storage/token-storage';
import { TokenConfig } from '../../src/blockchain/tokens/token.types';

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

describe('Token Storage', () => {
  const addressA = '0x1111111111111111111111111111111111111111';
  const addressB = '0x2222222222222222222222222222222222222222';
  const chainIdSepolia = 11155111;
  const chainIdBSC = 97;

  const mockCustomToken: TokenConfig = {
    chainId: chainIdSepolia,
    contractAddress: '0x3333333333333333333333333333333333333333',
    name: 'Custom Test Token',
    symbol: 'CTT',
    decimals: 18,
    isCustom: true,
  };

  beforeEach(() => {
    mockStore.clear();
  });

  it('saves and retrieves custom tokens scoped by wallet address and chainId', async () => {
    await tokenStorage.saveCustomToken(addressA, mockCustomToken);

    const tokensA_Sepolia = await tokenStorage.getCustomTokens(addressA, chainIdSepolia);
    expect(tokensA_Sepolia).toHaveLength(1);
    expect(tokensA_Sepolia[0].symbol).toBe('CTT');
    expect(tokensA_Sepolia[0].isCustom).toBe(true);

    // Should NOT bleed into addressB
    const tokensB_Sepolia = await tokenStorage.getCustomTokens(addressB, chainIdSepolia);
    expect(tokensB_Sepolia).toHaveLength(0);

    // Should NOT bleed into chainIdBSC
    const tokensA_BSC = await tokenStorage.getCustomTokens(addressA, chainIdBSC);
    expect(tokensA_BSC).toHaveLength(0);
  });

  it('removes a custom token by contract address', async () => {
    await tokenStorage.saveCustomToken(addressA, mockCustomToken);
    let tokens = await tokenStorage.getCustomTokens(addressA, chainIdSepolia);
    expect(tokens).toHaveLength(1);

    await tokenStorage.removeCustomToken(
      addressA,
      chainIdSepolia,
      mockCustomToken.contractAddress
    );
    tokens = await tokenStorage.getCustomTokens(addressA, chainIdSepolia);
    expect(tokens).toHaveLength(0);
  });

  it('returns custom tokens in getAllTokensForWallet when imported', async () => {
    const allTokensBefore = await tokenStorage.getAllTokensForWallet(addressA, chainIdSepolia);
    expect(allTokensBefore).toHaveLength(0);

    await tokenStorage.saveCustomToken(addressA, mockCustomToken);

    const allTokensAfter = await tokenStorage.getAllTokensForWallet(addressA, chainIdSepolia);
    expect(allTokensAfter).toHaveLength(1);

    const found = allTokensAfter.find(
      (t) => t.contractAddress.toLowerCase() === mockCustomToken.contractAddress.toLowerCase()
    );
    expect(found).toBeDefined();
    expect(found?.isCustom).toBe(true);
  });
});
