import { useState, useEffect, useCallback, useMemo } from 'react';
import { NFTItem } from '../nft/nft.types';
import { nftService } from '../nft/nft.service';
import { nftStorage } from '../../storage/nft-storage';
import { NetworkConfig } from '../networks/network.types';
import { evmProviderService } from '../providers/provider.service';

export interface UseWalletNftsResult {
  nfts: NFTItem[];
  ownedNfts: NFTItem[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  importNft: (nft: NFTItem) => Promise<void>;
  removeNft: (contractAddress: string, tokenId: string) => Promise<void>;
}

export function useWalletNfts(
  walletAddress: string | undefined,
  network: NetworkConfig | undefined
): UseWalletNftsResult {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const chainId = network?.chainId;

  const loadAndRefresh = useCallback(async () => {
    if (!walletAddress || !chainId || !network) {
      setNfts([]);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // 1. Load locally stored NFTs
      const stored = await nftStorage.getNfts(walletAddress, chainId);

      if (stored.length === 0) {
        setNfts([]);
        setStatus('success');
        return;
      }

      // 2. Ensure provider is connected
      if (!evmProviderService.isConnected() || evmProviderService.getActiveNetwork()?.chainId !== chainId) {
        await evmProviderService.initialize(network);
      }
      const provider = evmProviderService.getProvider();

      // 3. Dynamic ownership check (soft refresh)
      const refreshedList = await nftService.refreshNftOwnershipList(
        provider,
        stored,
        walletAddress
      );

      setNfts(refreshedList);
      setStatus('success');
    } catch (err: any) {
      setError(err?.message || 'Failed to load NFTs');
      setStatus('error');
    }
  }, [walletAddress, chainId, network]);

  useEffect(() => {
    loadAndRefresh();
  }, [loadAndRefresh]);

  const importNft = useCallback(
    async (nft: NFTItem) => {
      if (!walletAddress || !chainId) return;
      await nftStorage.saveNft(walletAddress, chainId, nft);
      await loadAndRefresh();
    },
    [walletAddress, chainId, loadAndRefresh]
  );

  const removeNft = useCallback(
    async (contractAddress: string, tokenId: string) => {
      if (!walletAddress || !chainId) return;
      await nftStorage.removeNft(walletAddress, chainId, contractAddress, tokenId);
      await loadAndRefresh();
    },
    [walletAddress, chainId, loadAndRefresh]
  );

  // Filter only NFTs the user currently owns for active gallery display
  const ownedNfts = useMemo(() => {
    return nfts.filter((nft) => nft.isOwned !== false);
  }, [nfts]);

  return {
    nfts,
    ownedNfts,
    status,
    error,
    refresh: loadAndRefresh,
    importNft,
    removeNft,
  };
}
