import { useState, useEffect, useCallback } from 'react';
import { evmProviderService } from '../providers/provider.service';
import { NativeBalanceService } from '../balances/balance.service';
import { tokenService } from '../tokens/token.service';
import { tokenStorage } from '../../storage/token-storage';
import { NetworkConfig } from '../networks/network.types';
import { TokenConfig, TokenMetadataResult, WalletAsset } from '../tokens/token.types';
import { trimDecimals } from '../balances/balance.utils';

export type AssetsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseWalletAssetsResult {
  assets: WalletAsset[];
  nativeAsset: WalletAsset | null;
  tokenAssets: WalletAsset[];
  tokens: TokenConfig[];
  status: AssetsStatus;
  error: string | null;
  refresh: () => void;
  importCustomToken: (contractAddress: string) => Promise<TokenMetadataResult>;
  removeCustomToken: (contractAddress: string) => Promise<void>;
}

const balanceService = new NativeBalanceService(evmProviderService);

export function useWalletAssets(
  address: string | undefined,
  network: NetworkConfig
): UseWalletAssetsResult {
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [nativeAsset, setNativeAsset] = useState<WalletAsset | null>(null);
  const [tokenAssets, setTokenAssets] = useState<WalletAsset[]>([]);
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [status, setStatus] = useState<AssetsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    const loadAllAssets = async () => {
      setStatus('loading');
      setError(null);

      try {
        // 1. Initialize / ensure provider is connected to active network
        const verify = await evmProviderService.initialize(network);
        if (cancelled) return;
        if (!verify.success) {
          setStatus('error');
          setError('Unable to connect to network.');
          return;
        }

        const provider = evmProviderService.getProvider();

        // 2. Fetch native asset balance
        const nativeResult = await balanceService.getBalance(address, network);
        if (cancelled) return;

        const nativeItem: WalletAsset = {
          type: 'native',
          name: network.nativeCurrency.name,
          symbol: network.nativeCurrency.symbol,
          decimals: network.nativeCurrency.decimals,
          rawBalance: nativeResult.balance?.rawWei || 0n,
          formattedBalance: nativeResult.balance
            ? trimDecimals(nativeResult.balance.formatted, 6)
            : '0.0',
          chainId: network.chainId,
        };

        // 3. Load all registered + custom tokens for this wallet and chain
        const allTokens = await tokenStorage.getAllTokensForWallet(address, network.chainId);
        if (cancelled) return;
        setTokens(allTokens);

        // 4. Fetch ERC-20 token balances in parallel
        const tokenBalances = await tokenService.getAllTokenBalances(
          provider,
          address,
          allTokens
        );
        if (cancelled) return;

        const tokenItems: WalletAsset[] = tokenBalances.map((tb) => ({
          type: 'erc20',
          name: tb.token.name,
          symbol: tb.token.symbol,
          decimals: tb.token.decimals,
          rawBalance: tb.rawBalance,
          formattedBalance: trimDecimals(tb.formatted, 6),
          chainId: network.chainId,
          tokenConfig: tb.token,
        }));

        setNativeAsset(nativeItem);
        setTokenAssets(tokenItems);
        setAssets([nativeItem, ...tokenItems]);
        setStatus('success');
      } catch (err: any) {
        if (__DEV__) console.warn('[useWalletAssets] Error loading assets:', err);
        if (!cancelled) {
          setStatus('error');
          setError('Failed to load wallet assets.');
        }
      }
    };

    loadAllAssets();
    return () => {
      cancelled = true;
    };
  }, [address, network.chainId, trigger]);

  const importCustomToken = useCallback(
    async (contractAddress: string): Promise<TokenMetadataResult> => {
      if (!address) {
        return { success: false, error: 'No wallet loaded.' };
      }

      try {
        const provider = evmProviderService.getProvider();
        const result = await tokenService.fetchTokenMetadata(
          provider,
          contractAddress,
          network.chainId
        );

        if (result.success && result.token) {
          await tokenStorage.saveCustomToken(address, result.token);
          refresh();
        }

        return result;
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to import token.',
        };
      }
    },
    [address, network.chainId, refresh]
  );

  const removeCustomToken = useCallback(
    async (contractAddress: string): Promise<void> => {
      if (!address) return;
      await tokenStorage.removeCustomToken(address, network.chainId, contractAddress);
      refresh();
    },
    [address, network.chainId, refresh]
  );

  return {
    assets,
    nativeAsset,
    tokenAssets,
    tokens,
    status,
    error,
    refresh,
    importCustomToken,
    removeCustomToken,
  };
}
