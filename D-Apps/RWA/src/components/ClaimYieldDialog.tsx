import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useContract } from "@/hooks/useContract";
import { CHAIN_CONFIG } from "@/lib/contracts";

interface ClaimYieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAmount: number;
  assetName: string;
}

export default function ClaimYieldDialog({
  open,
  onOpenChange,
  pendingAmount,
  assetName,
}: ClaimYieldDialogProps) {
  const { txState, claimYield, resetTxState } = useContract();

  const handleClaim = async () => {
    try {
      await claimYield();
      toast.success(`Successfully claimed $${pendingAmount} yield!`);
    } catch (err: any) {
      toast.error(err?.reason || "Claim failed. Please try again.");
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) resetTxState();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Claim Yield
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Claim your pending yield from {assetName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Available to Claim</p>
            <p className="font-display text-3xl font-bold text-primary">
              ${pendingAmount.toLocaleString()}
            </p>
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
              <p className="text-sm text-accent font-medium mb-1">Yield Claimed! 🎉</p>
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
            onClick={handleClaim}
            disabled={txState.isLoading || !!txState.txHash}
          >
            {txState.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : txState.txHash ? (
              "Claimed ✓"
            ) : (
              <>
                <Gift className="h-4 w-4" />
                Claim ${pendingAmount}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
