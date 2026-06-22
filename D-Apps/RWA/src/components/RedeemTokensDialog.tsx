import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Loader2, ExternalLink, AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRedemption } from "@/hooks/useRedemption";
import { CHAIN_CONFIG } from "@/lib/contracts";

interface RedeemTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetName: string;
  tokenAddress: string;
  maxAmount: number;
}

export default function RedeemTokensDialog({
  open,
  onOpenChange,
  assetName,
  tokenAddress,
  maxAmount,
}: RedeemTokensDialogProps) {
  const { txState, resetTxState, requestRedemption } = useRedemption();
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("0");

  const handleRedeem = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (parseFloat(amount) > maxAmount) {
      toast.error("Exceeds your holdings");
      return;
    }
    try {
      await requestRedemption(
        tokenAddress,
        amount,
        parseInt(payoutMethod),
        "0x0000000000000000000000000000000000000000" // Native token payout
      );
      toast.success(`Redemption request submitted for ${amount} tokens!`);
      onOpenChange(false);
      setAmount("");
    } catch {
      toast.error("Redemption failed. Ensure contracts are deployed.");
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetTxState();
      setAmount("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Redeem Tokens
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Redeem your {assetName} tokens for base currency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Your Holdings</p>
            <p className="font-display text-2xl font-bold text-primary">
              {maxAmount.toLocaleString()} tokens
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Amount to Redeem</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              className="bg-secondary border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Max: {maxAmount.toLocaleString()} tokens
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Payout Method</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">tBNB (Native Token)</SelectItem>
                <SelectItem value="1">Stablecoin (USDC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Redemption Process</p>
                <p className="text-xs mt-1">
                  Your tokens will be escrowed upon request. An admin will review and process
                  the redemption within 7 days. A 1% redemption fee applies.
                  Cooldown period: 7 days between redemptions.
                </p>
              </div>
            </div>
          </div>

          {txState.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-destructive/10 border border-destructive/30 rounded-lg p-3"
            >
              <p className="text-sm text-destructive">{txState.error}</p>
            </motion.div>
          )}

          {txState.txHash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center"
            >
              <p className="text-sm text-accent font-medium mb-1">Redemption Submitted!</p>
              <a
                href={`${CHAIN_CONFIG.blockExplorer}/tx/${txState.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent underline inline-flex items-center gap-1"
              >
                View Transaction <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>
          )}

          <Button
            variant="gold"
            className="w-full"
            onClick={handleRedeem}
            disabled={txState.isLoading || !!txState.txHash || !amount}
          >
            {txState.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : txState.txHash ? (
              "Submitted ✓"
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Request Redemption
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
