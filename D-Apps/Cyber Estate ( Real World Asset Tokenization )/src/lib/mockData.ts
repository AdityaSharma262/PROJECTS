export interface AssetDocument {
  name: string;
  type: "legal" | "financial" | "audit" | "technical";
  date: string;
  size: string;
}

export interface InvestmentEvent {
  date: string;
  type: "purchase" | "yield" | "redemption" | "listing";
  description: string;
  amount?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: "real-estate" | "commodity" | "treasury" | "infrastructure";
  location: string;
  totalValue: number;
  tokenPrice: number;
  totalTokens: number;
  soldTokens: number;
  annualYield: number;
  image: string;
  status: "active" | "upcoming" | "sold-out";
  description: string;
  longDescription?: string;
  highlights?: string[];
  documents?: AssetDocument[];
  investmentHistory?: InvestmentEvent[];
  contractAddress?: string;
  blockchain?: string;
  launchDate?: string;
  maturityDate?: string;
}

export interface PortfolioItem {
  asset: Asset;
  tokensOwned: number;
  totalInvested: number;
  currentValue: number;
  yieldEarned: number;
  pendingYield: number;
}

export const mockAssets: Asset[] = [];

export const mockPortfolio: PortfolioItem[] = [];

export const platformStats = {
  totalValueLocked: 0,
  totalAssets: 0,
  totalInvestors: 0,
  avgYield: 0,
};
