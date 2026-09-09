import { appStorage } from './app-storage';
import { NFTItem } from '../blockchain/nft/nft.types';

function getStorageKey(walletAddress: string, chainId: number): string {
  return `AXT_IMPORTED_NFTS_${walletAddress.toLowerCase()}_${chainId}`;
}

export function getNftCompositeId(chainId: number, contractAddress: string, tokenId: string): string {
  return `${chainId}_${contractAddress.toLowerCase()}_${tokenId}`;
}

export const nftStorage = {
  /**
   * Saves or updates an imported NFT item for a specific wallet address and chain.
   */
  async saveNft(walletAddress: string, chainId: number, nft: NFTItem): Promise<void> {
    if (!walletAddress) return;

    const key = getStorageKey(walletAddress, chainId);
    const existingJson = await appStorage.getItem(key);
    let list: NFTItem[] = existingJson ? JSON.parse(existingJson) : [];

    const targetId = getNftCompositeId(chainId, nft.contractAddress, nft.tokenId);
    const updatedNft: NFTItem = {
      ...nft,
      id: targetId,
      chainId,
      contractAddress: nft.contractAddress.toLowerCase(),
      importedAt: nft.importedAt || Date.now(),
    };

    const idx = list.findIndex(
      (item) => item.id.toLowerCase() === targetId.toLowerCase()
    );

    if (idx >= 0) {
      list[idx] = updatedNft;
    } else {
      list.push(updatedNft);
    }

    await appStorage.setItem(key, JSON.stringify(list));
  },

  /**
   * Retrieves all user-imported NFTs for a specific wallet address and chain.
   */
  async getNfts(walletAddress: string, chainId: number): Promise<NFTItem[]> {
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
   * Removes an imported NFT reference from local storage.
   */
  async removeNft(
    walletAddress: string,
    chainId: number,
    contractAddress: string,
    tokenId: string
  ): Promise<void> {
    if (!walletAddress) return;

    const key = getStorageKey(walletAddress, chainId);
    const existingJson = await appStorage.getItem(key);
    if (!existingJson) return;

    try {
      const targetId = getNftCompositeId(chainId, contractAddress, tokenId);
      const list: NFTItem[] = JSON.parse(existingJson);
      const filtered = list.filter(
        (item) => item.id.toLowerCase() !== targetId.toLowerCase()
      );
      await appStorage.setItem(key, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  },

  /**
   * Clears all imported NFTs for a wallet and chain.
   */
  async clearNftsForChain(walletAddress: string, chainId: number): Promise<void> {
    if (!walletAddress) return;
    const key = getStorageKey(walletAddress, chainId);
    await appStorage.deleteItem(key);
  },
};
