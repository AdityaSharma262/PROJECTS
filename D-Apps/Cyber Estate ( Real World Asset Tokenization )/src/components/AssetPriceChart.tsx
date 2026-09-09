import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { assetPriceHistory, type PricePoint } from "@/lib/chartData";

const timeRanges = ["1M", "3M", "6M", "1Y", "All"] as const;
type TimeRange = (typeof timeRanges)[number];

function filterByRange(data: PricePoint[], range: TimeRange): PricePoint[] {
  const counts: Record<TimeRange, number> = { "1M": 4, "3M": 13, "6M": 26, "1Y": 52, All: data.length };
  return data.slice(-counts[range]);
}

interface Props {
  assetId: string;
  tokenPrice: number;
}

export default function AssetPriceChart({ assetId, tokenPrice }: Props) {
  const [range, setRange] = useState<TimeRange>("6M");
  const [showVolume, setShowVolume] = useState(false);
  const rawData = assetPriceHistory[assetId] || [];
  const data = filterByRange(rawData, range);

  if (data.length === 0) return null;

  const currentPrice = data[data.length - 1].price;
  const startPrice = data[0].price;
  const change = currentPrice - startPrice;
  const changePct = ((change / startPrice) * 100).toFixed(2);
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-card rounded-xl border border-border p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Token Price History
          </h3>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-display text-2xl font-bold text-foreground">
              ${currentPrice.toFixed(2)}
            </span>
            <span className={`text-sm font-semibold ${isPositive ? "text-accent" : "text-destructive"}`}>
              {isPositive ? "+" : ""}
              {changePct}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`p-2 rounded-lg transition-colors ${showVolume ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <div className="flex bg-secondary/50 rounded-lg p-0.5 border border-border">
            {timeRanges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showVolume && (
        <div className="h-[100px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [value.toLocaleString(), "Volume"]}
              />
              <Bar dataKey="volume" fill="hsl(var(--primary))" opacity={0.4} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
