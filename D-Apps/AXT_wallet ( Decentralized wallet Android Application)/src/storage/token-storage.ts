import { appStorage } from './app-storage';
import { TokenConfig } from '../blockchain/tokens/token.types';
import { getDefaultTokensForChain } from '../blockchain/tokens/token.registry';

function getStorageKey(walletAddress: string, chainId: number): string {
  return `AXT_IMPORTED_TOKENS_${walletAddress.toLowerCase()}_${chainId}`;
}

export const tokenStorage = {
  /**
   * Saves an imported custom token for a specific wallet address and chain.
   */
  async saveCustomToken(walletAddress: string, token: TokenConfig): Promise<void> {
    if (!walletAddress) return;

    const key = getStorageKey(walletAddress, token.chainId);
    const existingJson = await appStorage.getItem(key);
    let list: TokenConfig[] = existingJson ? JSON.parse(existingJson) : [];

    // Replace if exists, else append
    const idx = list.findIndex(
      (t) => t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase()
    );

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...token, isCustom: true };
    } else {
      list.push({ ...token, isCustom: true });
    }

    await appStorage.setItem(key, JSON.stringify(list));
  },

  /**
   * Retrieves only user-imported custom tokens for a specific wallet address and chain.
   */
  async getCustomTokens(walletAddress: string, chainId: number): Promise<TokenConfig[]> {
    if (!walletAddress) return [];

    const key = getStorageKey(walletAddress, chainId);
    const json = await appStorage.getItem(key);
    if (!json) return [];

    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Removes a user-imported custom token from storage.
   */
  async removeCustomToken(
    walletAddress: string,
    chainId: number,
    contractAddress: string
  ): Promise<void> {
    if (!walletAddress) return;

    const key = getStorageKey(walletAddress, chainId);
    const existingJson = await appStorage.getItem(key);
    if (!existingJson) return;

    try {
      const list: TokenConfig[] = JSON.parse(existingJson);
      const filtered = list.filter(
        (t) => t.contractAddress.toLowerCase() !== contractAddress.toLowerCase()
      );
      await appStorage.setItem(key, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  },

  /**
   * Returns all available tokens (default presets + custom imported) for the wallet and chain,
   * deduplicated by contract address.
   */
  async getAllTokensForWallet(
    walletAddress: string,
    chainId: number
  ): Promise<TokenConfig[]> {
    const defaults = getDefaultTokensForChain(chainId);
    const custom = walletAddress ? await this.getCustomTokens(walletAddress, chainId) : [];

    const tokenMap = new Map<string, TokenConfig>();

    // 1. Add defaults
    for (const def of defaults) {
      tokenMap.set(def.contractAddress.toLowerCase(), def);
    }

    // 2. Add or override with custom
    for (const cust of custom) {
      tokenMap.set(cust.contractAddress.toLowerCase(), cust);
    }

    return Array.from(tokenMap.values());
  },
};
