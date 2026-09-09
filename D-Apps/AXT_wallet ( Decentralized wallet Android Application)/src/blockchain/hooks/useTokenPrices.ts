import { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkConfig } from '../networks/network.types';
import { TokenConfig } from '../tokens/token.types';
import { priceService } from '../prices/price.service';

export interface UseTokenPricesResult {
  /** Map of lowercase token contract address / symbol to USD unit price */
  prices: Record<string, number | null>;
  loading: boolean;
  refresh: () => Promise<void>;
  getTokenUsdValue: (token: TokenConfig, formattedBalance: string) => number | null;
  getFormattedHoldingUsd: (token: TokenConfig, formattedBalance: string) => string;
}

export function useTokenPrices(
  tokens: TokenConfig[],
  network: NetworkConfig
): UseTokenPricesResult {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Create a stable string key for the tokens array to prevent unnecessary re-fetches
  // when the tokens array reference changes but the actual tokens haven't.
  const tokensKey = tokens
    .map((t) => (t.contractAddress ? t.contractAddress.toLowerCase() : t.symbol.toLowerCase()))
    .sort()
    .join(',');

  // Keep a ref to the latest tokens array so fetchPrices always uses the latest data
  // without needing to include `tokens` in its dependency array.
  const tokensRef = useRef(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const fetchPrices = useCallback(async () => {
    const currentTokens = tokensRef.current;
    if (!currentTokens || currentTokens.length === 0 || network.isTestnet) {
      setPrices({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const newPrices: Record<string, number | null> = {};

    try {
      await Promise.all(
        currentTokens.map(async (token) => {
          const key = token.contractAddress
            ? token.contractAddress.toLowerCase()
            : token.symbol.toLowerCase();
          try {
            const price = await priceService.getTokenPrice(token, network);
            newPrices[key] = price;
          } catch {
            newPrices[key] = null;
          }
        })
      );
      setPrices(newPrices);
    } finally {
      setLoading(false);
    }
  }, [tokensKey, network.chainId, network.isTestnet]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const getTokenUsdValue = useCallback(
    (token: TokenConfig, formattedBalance: string): number | null => {
      if (network.isTestnet) return null;
      const key = token.contractAddress
        ? token.contractAddress.toLowerCase()
        : token.symbol.toLowerCase();
      const unitPrice = prices[key] ?? null;
      return priceService.calculateHoldingUsdValue(formattedBalance, unitPrice);
    },
    [prices, network.isTestnet]
  );

  const getFormattedHoldingUsd = useCallback(
    (token: TokenConfig, formattedBalance: string): string => {
      const val = getTokenUsdValue(token, formattedBalance);
      return priceService.formatUsdValue(val);
    },
    [getTokenUsdValue]
  );

  return {
    prices,
    loading,
    refresh: fetchPrices,
    getTokenUsdValue,
    getFormattedHoldingUsd,
  };
}
