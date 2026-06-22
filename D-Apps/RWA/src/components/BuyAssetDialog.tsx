import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Asset } from "@/lib/mockData";

interface BuyAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
}

export default function BuyAssetDialog({ open, onOpenChange, asset }: BuyAssetDialogProps) {
  const [tokenAmount, setTokenAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!asset) return null;

  const totalCost = parseInt(tokenAmount || "0") * asset.tokenPrice;
  const remainingTokens = asset.totalTokens - asset.soldTokens;

  const handleBuy = async () => {
    if (!tokenAmount || parseInt(tokenAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseInt(tokenAmount) > remainingTokens) {
      toast.error("Not enough tokens available");
      return;
    }

    setIsProcessing(true);
    // Simulated transaction - would use contract interaction in production
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Successfully purchased ${tokenAmount} tokens of ${asset.name}!`);
      onOpenChange(false);
      setTokenAmount("");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Invest in {asset.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Purchase fractional ownership tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Asset Info */}
          <div className="flex gap-4 bg-secondary/50 rounded-lg p-4">
            <img
              src={asset.image}
              alt={asset.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{asset.name}</p>
              <p className="text-xs text-muted-foreground">{asset.location}</p>
              <p className="text-sm text-primary font-semibold mt-1">
                ${asset.tokenPrice} / token
              </p>
              <p className="text-xs text-muted-foreground">
                {remainingTokens.toLocaleString()} tokens available
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Number of Tokens</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              className="bg-secondary border-border text-foreground"
              min="1"
              max={remainingTokens}
            />
          </div>

          {/* Summary */}
          {parseInt(tokenAmount || "0") > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tokens</span>
                <span className="text-foreground">{parseInt(tokenAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price per token</span>
                <span className="text-foreground">${asset.tokenPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Annual Yield</span>
                <span className="text-accent">{asset.annualYield}%</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-sm font-semibold text-foreground">Total Cost</span>
                <span className="text-sm font-bold text-primary">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}

          <Button
            variant="gold"
            className="w-full"
            onClick={handleBuy}
            disabled={isProcessing || !tokenAmount}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Buy for $${totalCost.toLocaleString()}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
