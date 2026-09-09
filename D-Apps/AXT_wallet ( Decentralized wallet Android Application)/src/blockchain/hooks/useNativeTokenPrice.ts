import { useState, useEffect, useCallback } from 'react';
import { NetworkConfig } from '../networks/network.types';
import { priceService } from '../prices/price.service';

export interface UseNativeTokenPriceResult {
  price: number | null;
  formattedPrice: string | null;
  isTestnet: boolean;
  loading: boolean;
  displayText: string;
  refresh: () => Promise<void>;
}

export function useNativeTokenPrice(network: NetworkConfig): UseNativeTokenPriceResult {
  const [price, setPrice] = useState<number | null>(null);
  const [formattedPrice, setFormattedPrice] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState<boolean>(network.isTestnet);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPrice = useCallback(async () => {
    if (network.isTestnet) {
      setIsTestnet(true);
      setPrice(null);
      setFormattedPrice(null);
      setLoading(false);
      return;
    }

    setIsTestnet(false);
    setLoading(true);

    try {
      const info = await priceService.getNativeTokenPrice(network);
      setPrice(info.priceUsd);
      setFormattedPrice(info.formattedPrice);
    } catch {
      // Ignore error gracefully
      setPrice(null);
      setFormattedPrice(null);
    } finally {
      setLoading(false);
    }
  }, [network.chainId, network.isTestnet, network.nativeCurrency?.symbol]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Construct display string:
  // For testnets: "Testnet"
  // For mainnet with price: "ETH • $4,250.32"
  // Fallback: "ETH"
  const symbol = network.nativeCurrency?.symbol || 'ETH';
  let displayText = symbol;

  if (isTestnet) {
    displayText = 'Testnet';
  } else if (formattedPrice) {
    displayText = `${symbol} • ${formattedPrice}`;
  }

  return {
    price,
    formattedPrice,
    isTestnet,
    loading,
    displayText,
    refresh: fetchPrice,
  };
}
