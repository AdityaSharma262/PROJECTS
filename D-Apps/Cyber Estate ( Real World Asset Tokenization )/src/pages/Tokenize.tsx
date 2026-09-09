import { useState } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ExternalLink,
  FileText,
  Upload,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useFactory } from "@/hooks/useFactory";
import { CHAIN_CONFIG } from "@/lib/contracts";

const assetClasses = [
  { value: 0, label: "Real Estate" },
  { value: 1, label: "Commodity" },
  { value: 2, label: "Treasury" },
  { value: 3, label: "Infrastructure" },
  { value: 4, label: "Private Credit" },
  { value: 5, label: "Art & Collectibles" },
  { value: 6, label: "Carbon Credit" },
  { value: 7, label: "Other" },
];

const steps = [
  { title: "Asset Details", description: "Basic information about the asset" },
  { title: "Tokenomics", description: "Token supply, pricing, and yield" },
  { title: "Documents", description: "Legal documents and metadata" },
  { title: "Review & Deploy", description: "Confirm and create on-chain" },
];

export default function Tokenize() {
  const { isConnected, connect } = useWallet();
  const { txState, resetTxState, createAsset } = useFactory();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Asset Details
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetClass, setAssetClass] = useState("0");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Tokenomics
  const [totalValue, setTotalValue] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [annualYield, setAnnualYield] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  // Step 3: Documents
  const [metadataURI, setMetadataURI] = useState("");
  const [documentHash, setDocumentHash] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  const canNext = () => {
    if (currentStep === 0) return name && symbol && location;
    if (currentStep === 1) return totalValue && tokenPrice && totalSupply;
    if (currentStep === 2) return true; // Documents optional
    return true;
  };

  const handleCreate = async () => {
    if (!name || !symbol || !totalValue || !tokenPrice || !totalSupply) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsCreating(true);
    try {
      const yieldBps = Math.round(parseFloat(annualYield || "0") * 100);
      const maturity = maturityDate ? Math.floor(new Date(maturityDate).getTime() / 1000) : 0;
      await createAsset({
        name,
        symbol,
        assetClass: parseInt(assetClass),
        location,
        totalValue,
        tokenPrice,
        totalSupply,
        annualYieldBps: yieldBps,
        maturityDate: maturity,
        metadataURI: metadataURI || "ipfs://placeholder",
        documentHash: documentHash || "",
      });
      toast.success("Asset created successfully! Pending admin review.");
    } catch {
      toast.error("Creation failed. Ensure contracts are deployed.");
    }
    setIsCreating(false);
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
            Connect your wallet to tokenize real-world assets on the blockchain.
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
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Tokenize <span className="text-gradient-gold">Asset</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Deploy a new tokenized real-world asset on the blockchain
          </p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-2 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  i < currentStep
                    ? "bg-accent text-accent-foreground"
                    : i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-bold">{i + 1}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </p>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-card border border-border rounded-xl p-6"
        >
          {/* Step 0: Asset Details */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                {steps[0].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{steps[0].description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Asset Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Manhattan Office Tower"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Symbol <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., MOT"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 5))}
                    className="bg-secondary border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Asset Class</Label>
                  <Select value={assetClass} onValueChange={setAssetClass}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assetClasses.map((c) => (
                        <SelectItem key={c.value} value={c.value.toString()}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., New York, USA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <Textarea
                  placeholder="Describe the asset, its features, and investment thesis..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-secondary border-border text-foreground min-h-[100px]"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 1: Tokenomics */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                {steps[1].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{steps[1].description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Total Value ($) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 25000000"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Token Price ($) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    value={tokenPrice}
                    onChange={(e) => setTokenPrice(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Total Supply <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500000"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Annual Yield (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 8.5"
                    value={annualYield}
                    onChange={(e) => setAnnualYield(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Maturity Date</Label>
                <Input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for open-ended assets
                </p>
              </div>

              {totalValue && tokenPrice && totalSupply && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Calculated Values</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Supply × Price:</span>
                    <span className="text-foreground font-semibold">
                      ${(parseInt(totalSupply || "0") * parseFloat(tokenPrice || "0")).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">Est. Annual Yield Pool:</span>
                    <span className="text-accent font-semibold">
                      ${((parseFloat(totalValue || "0") * parseFloat(annualYield || "0")) / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                {steps[2].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{steps[2].description}</p>

              <div className="space-y-2">
                <Label className="text-foreground">Metadata URI (IPFS)</Label>
                <Input
                  placeholder="ipfs://Qm..."
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                  className="bg-secondary border-border text-foreground font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  IPFS URI pointing to the full asset metadata JSON
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Legal Documents</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    Upload legal documents (title deeds, audits, prospectus)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF only, up to 25MB
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setDocumentHash(`ipfs://Qm${Array.from(e.target.files).map(f => f.name).join("_").slice(0, 20)}`);
                        toast.info(`${e.target.files.length} document(s) selected. Upload to IPFS in production.`);
                      }
                    }}
                  />
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => {
                    document.querySelectorAll('input[type="file"]')[0]?.click();
                  }}>
                    <FileText className="h-4 w-4" />
                    Upload Documents
                  </Button>
                </div>
                {documentHash && (
                  <p className="text-xs text-accent flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Document hash: {documentHash.slice(0, 40)}...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                {steps[3].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{steps[3].description}</p>

              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Asset Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="text-foreground font-medium">{name}</span>
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="text-foreground font-mono">{symbol}</span>
                    <span className="text-muted-foreground">Class:</span>
                    <span className="text-foreground">{assetClasses[parseInt(assetClass)]?.label}</span>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-foreground">{location}</span>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tokenomics</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="text-foreground font-medium">${parseFloat(totalValue || "0").toLocaleString()}</span>
                    <span className="text-muted-foreground">Token Price:</span>
                    <span className="text-foreground font-medium">${tokenPrice}</span>
                    <span className="text-muted-foreground">Total Supply:</span>
                    <span className="text-foreground font-medium">{parseInt(totalSupply || "0").toLocaleString()}</span>
                    <span className="text-muted-foreground">Annual Yield:</span>
                    <span className="text-accent font-medium">{annualYield || "0"}%</span>
                    <span className="text-muted-foreground">Maturity:</span>
                    <span className="text-foreground">{maturityDate || "Open-ended"}</span>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Documents</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Metadata:</span>
                    <span className="text-foreground font-mono text-xs">{metadataURI || "Not provided"}</span>
                    <span className="text-muted-foreground">Legal Docs:</span>
                    <span className="text-foreground font-mono text-xs">{documentHash || "Not provided"}</span>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> After creation, your asset will be in "Pending Review" status.
                    A platform admin must approve it before it goes live on the marketplace.
                    A creation fee of 0.5% of the total value is required.
                  </p>
                </div>
              </div>

              {txState.error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm text-destructive">{txState.error}</p>
                </div>
              )}

              {txState.txHash && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
                  <p className="text-sm text-accent font-medium mb-1">Asset Created!</p>
                  <a
                    href={`${CHAIN_CONFIG.blockExplorer}/tx/${txState.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent underline inline-flex items-center gap-1"
                  >
                    View Transaction <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {currentStep > 0 ? (
              <Button variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {currentStep < steps.length - 1 ? (
              <Button variant="gold" onClick={() => setCurrentStep(currentStep + 1)} disabled={!canNext()}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={handleCreate}
                disabled={isCreating || !!txState.txHash}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : txState.txHash ? (
                  "Created ✓"
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    Create Asset
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
