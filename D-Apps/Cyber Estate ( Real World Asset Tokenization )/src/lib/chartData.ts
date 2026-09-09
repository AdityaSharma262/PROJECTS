// Generate mock historical price data for each asset
export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
  invested: number;
  yield: number;
}

function generatePriceHistory(basePrice: number, months: number, volatility: number, trend: number): PricePoint[] {
  const data: PricePoint[] = [];
  let price = basePrice * (1 - trend * months * 0.008);

  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - months);

  for (let i = 0; i <= months * 4; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i * 7);
    if (date > now) break;

    const change = (Math.random() - 0.45) * volatility + trend * 0.002;
    price = Math.max(price * (1 + change), basePrice * 0.8);
    const volume = Math.floor(Math.random() * 50000 + 10000);

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: Math.round(price * 100) / 100,
      volume,
    });
  }

  return data;
}

export const assetPriceHistory: Record<string, PricePoint[]> = {
  "1": generatePriceHistory(50, 12, 0.03, 1.2),
  "2": generatePriceHistory(25, 10, 0.04, 1.5),
  "3": generatePriceHistory(100, 14, 0.015, 0.8),
  "4": generatePriceHistory(10, 11, 0.01, 0.5),
  "5": generatePriceHistory(75, 8, 0.035, 1.0),
  "6": generatePriceHistory(60, 2, 0.02, 0.3),
};

export function generatePortfolioHistory(): PortfolioSnapshot[] {
  const data: PortfolioSnapshot[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 12);

  let totalValue = 25000;
  let invested = 30000;
  let yieldAccum = 0;

  for (let i = 0; i <= 48; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i * 7);
    if (date > now) break;

    totalValue += (Math.random() - 0.35) * 400 + 80;
    yieldAccum += Math.random() * 60 + 20;

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      totalValue: Math.round(totalValue),
      invested,
      yield: Math.round(yieldAccum),
    });
  }

  return data;
}
