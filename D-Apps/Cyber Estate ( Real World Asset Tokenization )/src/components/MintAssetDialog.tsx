import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useContract } from "@/hooks/useContract";
import { CHAIN_CONFIG } from "@/lib/contracts";

interface MintAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MintAssetDialog({ open, onOpenChange }: MintAssetDialogProps) {
  const [tokenType, setTokenType] = useState("erc20");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [assetId, setAssetId] = useState("");
  const { txState, mintYieldTokens, mintAssetToken, issueSecurityTokens } = useContract();

  const handleMint = async () => {
    if (!recipientAddress || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (tokenType === "erc20") {
        await mintYieldTokens(recipientAddress, amount);
      } else if (tokenType === "erc1155") {
        await mintAssetToken(recipientAddress, parseInt(assetId || "1"), parseInt(amount));
      } else {
        await issueSecurityTokens(recipientAddress, amount);
      }
      toast.success("Tokens minted successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.reason || "Minting failed. Check console for details.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Mint Tokens</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Mint new tokens to a specified address. Admin only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-foreground">Token Type</Label>
            <Select value={tokenType} onValueChange={setTokenType}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="erc20">ERC-20 Yield Token</SelectItem>
                <SelectItem value="erc1155">ERC-1155 Asset Token</SelectItem>
                <SelectItem value="security">Security Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Recipient Address</Label>
            <Input
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="bg-secondary border-border text-foreground font-mono text-sm"
            />
          </div>

          {tokenType === "erc1155" && (
            <div className="space-y-2">
              <Label className="text-foreground">Asset ID</Label>
              <Input
                placeholder="1"
                type="number"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Amount</Label>
            <Input
              placeholder="1000"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
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
              className="bg-accent/10 border border-accent/30 rounded-lg p-3"
            >
              <p className="text-sm text-accent">
                Transaction successful!{" "}
                <a
                  href={`${CHAIN_CONFIG.blockExplorer}/tx/${txState.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on BscScan
                </a>
              </p>
            </motion.div>
          )}

          <Button
            variant="gold"
            className="w-full"
            onClick={handleMint}
            disabled={txState.isLoading}
          >
            {txState.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint Tokens"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
