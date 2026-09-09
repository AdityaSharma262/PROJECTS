import { Wallet, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ConnectWallet() {
  const { address, balance, isConnecting, isConnected, isWrongNetwork, connect, disconnect, switchNetwork, shortenAddress } = useWallet();

  if (!isConnected) {
    return (
      <Button variant="gold" size="sm" onClick={connect} disabled={isConnecting}>
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button variant="destructive" size="sm" onClick={switchNetwork}>
        <AlertTriangle className="h-4 w-4" />
        Wrong Network
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs">{shortenAddress(address!)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-sm font-semibold text-foreground">
            {parseFloat(balance).toFixed(4)} ETH
          </p>
        </div>
        <DropdownMenuItem
          onClick={disconnect}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
