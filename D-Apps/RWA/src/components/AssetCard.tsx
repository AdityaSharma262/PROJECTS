import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/lib/mockData";

interface AssetCardProps {
  asset: Asset;
  index?: number;
  onBuy?: (asset: Asset) => void;
}

export default function AssetCard({ asset, index = 0, onBuy }: AssetCardProps) {
  const navigate = useNavigate();
  const progress = (asset.soldTokens / asset.totalTokens) * 100;

  const statusColors = {
    active: "bg-accent/20 text-accent",
    upcoming: "bg-primary/20 text-primary",
    "sold-out": "bg-muted text-muted-foreground",
  };

  const typeLabels = {
    "real-estate": "Real Estate",
    commodity: "Commodity",
    treasury: "Treasury",
    infrastructure: "Infrastructure",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group bg-gradient-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-gold/10 cursor-pointer"
      onClick={() => navigate(`/asset/${asset.id}`)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={asset.image}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[asset.status]}`}>
            {asset.status === "sold-out" ? "Sold Out" : asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground">
            {typeLabels[asset.type]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {asset.name}
          </h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {asset.location}
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Token Price</p>
            <p className="text-sm font-semibold text-foreground">${asset.tokenPrice}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Annual Yield
            </p>
            <p className="text-sm font-semibold text-accent">{asset.annualYield}%</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {asset.soldTokens.toLocaleString()} / {asset.totalTokens.toLocaleString()} tokens
            </span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.3 + index * 0.1, duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-gold rounded-full"
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          variant={asset.status === "sold-out" ? "secondary" : "gold"}
          className="w-full"
          disabled={asset.status === "sold-out"}
          onClick={(e) => {
            e.stopPropagation();
            onBuy?.(asset);
          }}
        >
          {asset.status === "sold-out"
            ? "Sold Out"
            : asset.status === "upcoming"
            ? "Coming Soon"
            : `Invest from $${asset.tokenPrice}`}
        </Button>
      </div>
    </motion.div>
  );
}
