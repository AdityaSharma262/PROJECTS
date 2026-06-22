import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Gift,
  PieChart,
} from "lucide-react";
import PortfolioCard from "@/components/PortfolioCard";
import ClaimYieldDialog from "@/components/ClaimYieldDialog";
import RedeemTokensDialog from "@/components/RedeemTokensDialog";
import KYCBadge from "@/components/KYCBadge";
import { mockPortfolio, type PortfolioItem } from "@/lib/mockData";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import PortfolioCharts from "@/components/PortfolioCharts";

export default function Portfolio() {
  const { isConnected, connect } = useWallet();
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimItem, setClaimItem] = useState<PortfolioItem | null>(null);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [redeemItem, setRedeemItem] = useState<PortfolioItem | null>(null);

  const totalInvested = mockPortfolio.reduce((sum, item) => sum + item.totalInvested, 0);
  const totalValue = mockPortfolio.reduce((sum, item) => sum + item.currentValue, 0);
  const totalYield = mockPortfolio.reduce((sum, item) => sum + item.yieldEarned, 0);
  const totalPending = mockPortfolio.reduce((sum, item) => sum + item.pendingYield, 0);
  const pnl = totalValue - totalInvested;
  const pnlPercent = ((pnl / totalInvested) * 100).toFixed(1);

  const handleClaimYield = (item: PortfolioItem) => {
    setClaimItem(item);
    setClaimDialogOpen(true);
  };

  const handleRedeem = (item: PortfolioItem) => {
    setRedeemItem(item);
    setRedeemDialogOpen(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect your MetaMask wallet to view your portfolio and claim yields.
          </p>
          <Button variant="gold" size="lg" onClick={connect}>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              My <span className="text-gradient-gold">Portfolio</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your investments and claim yields
            </p>
          </div>
          <KYCBadge status="verified" />
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Total Value",
              value: `$${totalValue.toLocaleString()}`,
              icon: DollarSign,
              sub: `Invested: $${totalInvested.toLocaleString()}`,
            },
            {
              label: "P&L",
              value: `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString()}`,
              icon: TrendingUp,
              sub: `${pnlPercent}% all-time`,
              highlight: pnl >= 0,
            },
            {
              label: "Yield Earned",
              value: `$${totalYield.toLocaleString()}`,
              icon: Gift,
              sub: "Lifetime earnings",
            },
            {
              label: "Pending Yield",
              value: `$${totalPending.toLocaleString()}`,
              icon: PieChart,
              sub: "Available to claim",
              highlight: true,
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <p
                className={`font-display text-xl sm:text-2xl font-bold ${
                  card.highlight ? "text-primary" : "text-foreground"
                }`}
              >
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <PortfolioCharts portfolio={mockPortfolio} />

        {/* Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Your Holdings
          </h2>
          <div className="space-y-4">
            {mockPortfolio.map((item, i) => (
              <PortfolioCard
                key={item.asset.id}
                item={item}
                index={i}
                onClaimYield={handleClaimYield}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {claimItem && (
        <ClaimYieldDialog
          open={claimDialogOpen}
          onOpenChange={setClaimDialogOpen}
          pendingAmount={claimItem.pendingYield}
          assetName={claimItem.asset.name}
        />
      )}

      {redeemItem && (
        <RedeemTokensDialog
          open={redeemDialogOpen}
          onOpenChange={setRedeemDialogOpen}
          assetName={redeemItem.asset.name}
          tokenAddress={redeemItem.asset.contractAddress || "0x0000000000000000000000000000000000000000"}
          maxAmount={redeemItem.tokensOwned}
        />
      )}
    </div>
  );
}
