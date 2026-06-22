import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Gift, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortfolioItem } from "@/lib/mockData";

interface PortfolioCardProps {
  item: PortfolioItem;
  index?: number;
  onClaimYield?: (item: PortfolioItem) => void;
  onRedeem?: (item: PortfolioItem) => void;
  isClaiming?: boolean;
}

export default function PortfolioCard({ item, index = 0, onClaimYield, onRedeem, isClaiming }: PortfolioCardProps) {
  const pnl = item.currentValue - item.totalInvested;
  const pnlPercent = ((pnl / item.totalInvested) * 100).toFixed(1);
  const isPositive = pnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-gradient-card rounded-xl border border-border overflow-hidden hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-48 h-32 sm:h-auto">
          <img
            src={item.asset.image}
            alt={item.asset.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {item.asset.name}
              </h3>
              <p className="text-sm text-muted-foreground">{item.asset.location}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.tokensOwned.toLocaleString()} tokens owned
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Invested
                </p>
                <p className="font-semibold text-foreground">
                  ${item.totalInvested.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Current
                </p>
                <p className="font-semibold text-foreground">
                  ${item.currentValue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">P&L</p>
                <p className={`font-semibold ${isPositive ? "text-accent" : "text-destructive"}`}>
                  {isPositive ? "+" : ""}${pnl.toLocaleString()} ({pnlPercent}%)
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  Yield Earned
                </p>
                <p className="font-semibold text-accent">
                  ${item.yieldEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Yield */}
          {item.pendingYield > 0 && (
            <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Pending Yield</p>
                <p className="text-sm font-semibold text-primary">
                  ${item.pendingYield.toLocaleString()} available to claim
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => onClaimYield?.(item)}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                Claim
              </Button>
            </div>
          )}

          {/* Redeem */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRedeem?.(item)}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Redeem Tokens
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
