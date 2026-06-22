import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Shield,
  ExternalLink,
  Download,
  Clock,
  DollarSign,
  BarChart3,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuyAssetDialog from "@/components/BuyAssetDialog";
import AssetPriceChart from "@/components/AssetPriceChart";
import { mockAssets, type Asset } from "@/lib/mockData";
import { CHAIN_CONFIG } from "@/lib/contracts";

const typeLabels: Record<string, string> = {
  "real-estate": "Real Estate",
  commodity: "Commodity",
  treasury: "Treasury",
  infrastructure: "Infrastructure",
};

const statusColors: Record<string, string> = {
  active: "bg-accent/20 text-accent",
  upcoming: "bg-primary/20 text-primary",
  "sold-out": "bg-muted text-muted-foreground",
};

const docTypeIcons: Record<string, string> = {
  legal: "📄",
  financial: "📊",
  audit: "🔍",
  technical: "⚙️",
};

const eventTypeColors: Record<string, string> = {
  purchase: "bg-primary/20 text-primary",
  yield: "bg-accent/20 text-accent",
  redemption: "bg-destructive/20 text-destructive",
  listing: "bg-secondary text-secondary-foreground",
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  const asset = mockAssets.find((a) => a.id === id);

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-display text-foreground">Asset not found</p>
          <Button variant="gold" onClick={() => navigate("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const progress = (asset.soldTokens / asset.totalTokens) * 100;
  const remainingTokens = asset.totalTokens - asset.soldTokens;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Marketplace</span>
        </motion.button>

        {/* Hero section */}
        <div className="grid lg:grid-cols-5 gap-8 mb-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 relative rounded-2xl overflow-hidden aspect-[16/10]"
          >
            <img
              src={asset.image}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[asset.status]}`}>
                {asset.status === "sold-out" ? "Sold Out" : asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
              </span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full glass">
                {typeLabels[asset.type]}
              </span>
            </div>
          </motion.div>

          {/* Key info panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {asset.name}
              </h1>
              <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                {asset.location}
              </p>
            </div>

            {/* Price & yield */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Token Price
                </p>
                <p className="font-display text-xl font-bold text-foreground mt-1">${asset.tokenPrice}</p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Annual Yield
                </p>
                <p className="font-display text-xl font-bold text-accent mt-1">{asset.annualYield}%</p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Total Value
                </p>
                <p className="font-display text-lg font-bold text-foreground mt-1">
                  ${(asset.totalValue / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Available
                </p>
                <p className="font-display text-lg font-bold text-foreground mt-1">
                  {remainingTokens.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {asset.soldTokens.toLocaleString()} / {asset.totalTokens.toLocaleString()} tokens sold
                </span>
                <span className="font-semibold text-foreground">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-gold rounded-full"
                />
              </div>
            </div>

            {/* CTA */}
            <Button
              variant={asset.status === "sold-out" ? "secondary" : "gold"}
              className="w-full h-12 text-base"
              disabled={asset.status === "sold-out"}
              onClick={() => setBuyDialogOpen(true)}
            >
              {asset.status === "sold-out"
                ? "Sold Out"
                : asset.status === "upcoming"
                ? "Coming Soon"
                : `Invest from $${asset.tokenPrice}`}
            </Button>

            {/* Blockchain info */}
            {asset.contractAddress && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Contract:</span>
                <a
                  href={`${CHAIN_CONFIG.blockExplorer}/address/${asset.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  {asset.contractAddress.slice(0, 6)}...{asset.contractAddress.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </motion.div>
        </div>

        {/* Tabs section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-secondary/50 border border-border w-full sm:w-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Investment History
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <AssetPriceChart assetId={asset.id} tokenPrice={asset.tokenPrice} />
                  <div className="bg-gradient-card rounded-xl border border-border p-6">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4">About This Asset</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {asset.longDescription || asset.description}
                    </p>
                  </div>

                  {asset.highlights && asset.highlights.length > 0 && (
                    <div className="bg-gradient-card rounded-xl border border-border p-6">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Key Highlights</h3>
                      <ul className="space-y-3">
                        {asset.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-3 text-muted-foreground">
                            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sidebar details */}
                <div className="space-y-4">
                  <div className="bg-gradient-card rounded-xl border border-border p-6 space-y-4">
                    <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Asset Details</h3>
                    <DetailRow icon={<Layers className="h-4 w-4" />} label="Token Standard" value="ERC-1155" />
                    <DetailRow icon={<Shield className="h-4 w-4" />} label="Blockchain" value={asset.blockchain || "BNB Smart Chain (Testnet)"} />
                    <DetailRow icon={<Calendar className="h-4 w-4" />} label="Launch Date" value={asset.launchDate || "TBA"} />
                    <DetailRow icon={<Clock className="h-4 w-4" />} label="Maturity" value={asset.maturityDate || "Open-ended"} />
                    <DetailRow icon={<Users className="h-4 w-4" />} label="Min. Investment" value={`$${asset.tokenPrice}`} />
                    <DetailRow icon={<BarChart3 className="h-4 w-4" />} label="Yield Frequency" value="Quarterly" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Investment History tab */}
            <TabsContent value="history" className="mt-6">
              <div className="bg-gradient-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-6">Investment Timeline</h3>
                {asset.investmentHistory && asset.investmentHistory.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-6">
                      {asset.investmentHistory.map((event, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative flex items-start gap-4 pl-1"
                        >
                          <div className="relative z-10 h-[34px] w-[34px] rounded-full bg-card border-2 border-border flex items-center justify-center flex-shrink-0">
                            {event.type === "purchase" && <DollarSign className="h-4 w-4 text-primary" />}
                            {event.type === "yield" && <TrendingUp className="h-4 w-4 text-accent" />}
                            {event.type === "redemption" && <ArrowLeft className="h-4 w-4 text-destructive" />}
                            {event.type === "listing" && <Layers className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 bg-secondary/30 rounded-lg p-4 border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${eventTypeColors[event.type]}`}>
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">{event.date}</span>
                            </div>
                            <p className="text-sm text-foreground mt-1">{event.description}</p>
                            {event.amount && (
                              <p className="text-sm font-semibold text-primary mt-1">
                                ${event.amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium">No investment history yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Investment events will appear here once the asset is active
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Documents tab */}
            <TabsContent value="documents" className="mt-6">
              <div className="bg-gradient-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-6">Asset Documents</h3>
                {asset.documents && asset.documents.length > 0 ? (
                  <div className="space-y-3">
                    {asset.documents.map((doc, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{docTypeIcons[doc.type]}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} • {doc.date} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium">No documents available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Documents will be added once the asset listing is finalized
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <BuyAssetDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        asset={asset}
      />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
