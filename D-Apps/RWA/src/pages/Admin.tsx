import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  Users,
  Coins,
  Settings,
  Check,
  X,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MintAssetDialog from "@/components/MintAssetDialog";
import KYCBadge from "@/components/KYCBadge";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { toast } from "sonner";

const mockWhitelist = [
  { address: "0x1234...abcd", status: "verified" as const, name: "Alice Johnson" },
  { address: "0x5678...efgh", status: "pending" as const, name: "Bob Smith" },
  { address: "0x9abc...ijkl", status: "verified" as const, name: "Carol White" },
  { address: "0xdef0...mnop", status: "rejected" as const, name: "Dave Brown" },
];

const mockActivity = [
  { action: "Mint", token: "RWA Yield Token", amount: "10,000", to: "0x1234...abcd", time: "2 min ago" },
  { action: "Whitelist", token: "Security Token", amount: "-", to: "0x5678...efgh", time: "15 min ago" },
  { action: "Yield Distribution", token: "RWA Yield Token", amount: "5,000", to: "All Holders", time: "1 hour ago" },
  { action: "Mint", token: "Asset Token #3", amount: "500", to: "0x9abc...ijkl", time: "3 hours ago" },
  { action: "Pause", token: "RWA Yield Token", amount: "-", to: "-", time: "1 day ago" },
];

export default function Admin() {
  const { isConnected, connect, address } = useWallet();
  const { txState, distributeYield, addToWhitelist } = useContract();
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [yieldAmount, setYieldAmount] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);
  const [isWhitelisting, setIsWhitelisting] = useState(false);

  const handleDistributeYield = async () => {
    if (!yieldAmount) {
      toast.error("Enter a yield amount");
      return;
    }
    setIsDistributing(true);
    try {
      await distributeYield(yieldAmount);
      toast.success(`Distributed ${yieldAmount} tokens as yield`);
      setYieldAmount("");
    } catch {
      toast.error("Distribution failed");
    }
    setIsDistributing(false);
  };

  const handleWhitelist = async () => {
    if (!whitelistAddress) {
      toast.error("Enter an address");
      return;
    }
    setIsWhitelisting(true);
    try {
      await addToWhitelist(whitelistAddress);
      toast.success("Address added to whitelist");
      setWhitelistAddress("");
    } catch {
      toast.error("Whitelist operation failed");
    }
    setIsWhitelisting(false);
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
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect your admin wallet to access the dashboard.
          </p>
          <Button variant="gold" size="lg" onClick={connect}>
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
              Admin <span className="text-gradient-gold">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage tokens, whitelist, and yield distribution
            </p>
          </div>
          <Button variant="gold" onClick={() => setMintDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Mint Tokens
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Yield Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-card border border-border rounded-xl p-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Coins className="h-5 w-5 text-primary" />
                Distribute Yield
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Distribute yield tokens to all ERC-20 token holders proportionally.
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Amount to distribute"
                  type="number"
                  value={yieldAmount}
                  onChange={(e) => setYieldAmount(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
                <Button
                  variant="gold"
                  onClick={handleDistributeYield}
                  disabled={isDistributing}
                  className="shrink-0"
                >
                  {isDistributing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Distribute"
                  )}
                </Button>
              </div>
            </motion.div>

            {/* KYC Whitelist Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-card border border-border rounded-xl p-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                KYC Whitelist
              </h2>

              {/* Add to Whitelist */}
              <div className="flex gap-3 mb-6">
                <Input
                  placeholder="0x... address to whitelist"
                  value={whitelistAddress}
                  onChange={(e) => setWhitelistAddress(e.target.value)}
                  className="bg-secondary border-border text-foreground font-mono text-sm"
                />
                <Button
                  variant="gold"
                  onClick={handleWhitelist}
                  disabled={isWhitelisting}
                  className="shrink-0"
                >
                  {isWhitelisting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>

              {/* Whitelist Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Address</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockWhitelist.map((user) => (
                      <tr key={user.address} className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground">{user.name}</td>
                        <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{user.address}</td>
                        <td className="py-3 px-2">
                          <KYCBadge status={user.status} />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-1 justify-end">
                            {user.status !== "verified" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:text-accent">
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-card border border-border rounded-xl p-6 h-fit"
          >
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {mockActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.token} · {activity.amount !== "-" ? `${activity.amount} tokens` : ""} {activity.to !== "-" ? `→ ${activity.to}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <MintAssetDialog open={mintDialogOpen} onOpenChange={setMintDialogOpen} />
    </div>
  );
}
