import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import AssetCard from "@/components/AssetCard";
import BuyAssetDialog from "@/components/BuyAssetDialog";
import { mockAssets, type Asset } from "@/lib/mockData";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  const featuredAssets = mockAssets.filter((a) => a.status === "active").slice(0, 3);

  const handleBuy = (asset: Asset) => {
    setSelectedAsset(asset);
    setBuyDialogOpen(true);
  };

  return (
    <div>
      <HeroSection />
      <StatsSection />

      {/* Featured Assets */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10"
          >
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">
                Featured <span className="text-gradient-gold">Assets</span>
              </h2>
              <p className="text-muted-foreground mt-2">
                Top-performing tokenized assets available now
              </p>
            </div>
            <Link to="/marketplace">
              <Button variant="gold-outline" size="sm">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAssets.map((asset, i) => (
              <AssetCard key={asset.id} asset={asset} index={i} onBuy={handleBuy} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-foreground">
              How It <span className="text-gradient-gold">Works</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Start investing in tokenized real-world assets in three simple steps
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your MetaMask wallet and complete KYC verification to get started.",
              },
              {
                step: "02",
                title: "Choose Assets",
                description: "Browse our marketplace of tokenized real-world assets with verified yields.",
              },
              {
                step: "03",
                title: "Earn Yield",
                description: "Hold tokens and claim your share of yields distributed on-chain automatically.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl font-display font-bold text-gradient-gold mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BuyAssetDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        asset={selectedAsset}
      />
    </div>
  );
};

export default Index;
