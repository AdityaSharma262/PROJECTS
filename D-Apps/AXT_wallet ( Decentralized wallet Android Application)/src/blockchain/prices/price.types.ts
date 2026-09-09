export interface TokenPriceInfo {
  priceUsd: number | null;
  formattedPrice: string | null;
  isTestnet: boolean;
  lastUpdated: number;
}
