import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AssetCard from "@/components/AssetCard";
import BuyAssetDialog from "@/components/BuyAssetDialog";
import { mockAssets, type Asset } from "@/lib/mockData";

const assetTypes = ["All", "Real Estate", "Commodity", "Treasury", "Infrastructure"];
const typeMap: Record<string, string> = {
  "Real Estate": "real-estate",
  Commodity: "commodity",
  Treasury: "treasury",
  Infrastructure: "infrastructure",
};

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.location.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      activeType === "All" || asset.type === typeMap[activeType];
    return matchesSearch && matchesType;
  });

  const handleBuy = (asset: Asset) => {
    setSelectedAsset(asset);
    setBuyDialogOpen(true);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Asset <span className="text-gradient-gold">Marketplace</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover and invest in tokenized real-world assets
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {assetTypes.map((type) => (
              <Button
                key={type}
                variant={activeType === type ? "gold" : "secondary"}
                size="sm"
                onClick={() => setActiveType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {filteredAssets.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset, i) => (
              <AssetCard key={asset.id} asset={asset} index={i} onBuy={handleBuy} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-foreground font-medium">No assets found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      <BuyAssetDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        asset={selectedAsset}
      />
    </div>
  );
}
