import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Coins,
  ShieldCheck,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Search,
  ArrowLeftRight,
  UserCheck,
  UserX,
  XOctagon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHAIN_CONFIG } from "@/lib/contracts";
import {
  mockTransactions,
  type TxStatus,
  type TxType,
} from "@/lib/mockTransactions";

const txTypeConfig: Record<TxType, { label: string; icon: React.ElementType; color: string }> = {
  purchase: { label: "Purchase", icon: ArrowUpRight, color: "text-primary" },
  yield_claim: { label: "Yield Claim", icon: ArrowDownLeft, color: "text-accent" },
  transfer: { label: "Transfer", icon: Send, color: "text-muted-foreground" },
  mint: { label: "Mint", icon: Coins, color: "text-emerald-400" },
  redeem: { label: "Redeem", icon: RefreshCw, color: "text-orange-400" },
  whitelist: { label: "KYC / Whitelist", icon: ShieldCheck, color: "text-blue-400" },
  trade: { label: "Trade", icon: ArrowLeftRight, color: "text-purple-400" },
  kyc_verify: { label: "KYC Verified", icon: UserCheck, color: "text-green-400" },
  kyc_revoke: { label: "KYC Revoked", icon: UserX, color: "text-red-400" },
  order_cancel: { label: "Order Cancelled", icon: XOctagon, color: "text-yellow-400" },
};

const statusConfig: Record<TxStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  confirmed: { label: "Confirmed", icon: CheckCircle2, variant: "default" },
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  failed: { label: "Failed", icon: XCircle, variant: "destructive" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function Transactions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockTransactions.filter((tx) => {
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          tx.assetName.toLowerCase().includes(q) ||
          tx.txHash.toLowerCase().includes(q) ||
          tx.tokenSymbol.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [statusFilter, typeFilter, search]);

  const stats = useMemo(() => {
    const confirmed = mockTransactions.filter((t) => t.status === "confirmed").length;
    const pending = mockTransactions.filter((t) => t.status === "pending").length;
    const failed = mockTransactions.filter((t) => t.status === "failed").length;
    const totalVolume = mockTransactions
      .filter((t) => t.status === "confirmed" && t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    return { confirmed, pending, failed, totalVolume };
  }, []);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            Track all on-chain transactions across your RWA portfolio
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Txns", value: mockTransactions.length, icon: RefreshCw },
            { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2 },
            { label: "Pending", value: stats.pending, icon: Clock },
            {
              label: "Volume",
              value: `$${stats.totalVolume.toLocaleString()}`,
              icon: Coins,
            },
          ].map((s, i) => (
            <Card key={i} className="bg-gradient-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-card border-border mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by asset, hash, or symbol..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-secondary border-border">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="yield_claim">Yield Claim</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="mint">Mint</SelectItem>
                    <SelectItem value="redeem">Redeem</SelectItem>
                    <SelectItem value="whitelist">KYC</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-secondary border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-card border-border overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-display">
                {filtered.length} Transaction{filtered.length !== 1 && "s"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Asset</TableHead>
                      <TableHead className="text-muted-foreground">Amount</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-muted-foreground hidden lg:table-cell">Tx Hash</TableHead>
                      <TableHead className="text-muted-foreground hidden lg:table-cell">Block</TableHead>
                      <TableHead className="text-muted-foreground text-right">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((tx, i) => {
                        const typeInfo = txTypeConfig[tx.type];
                        const statusInfo = statusConfig[tx.status];
                        const TypeIcon = typeInfo.icon;
                        const StatusIcon = statusInfo.icon;
                        return (
                          <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-border hover:bg-secondary/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                                <span className="text-sm font-medium text-foreground">
                                  {typeInfo.label}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {tx.assetName}
                            </TableCell>
                            <TableCell>
                              {tx.amount > 0 ? (
                                <span className="text-foreground font-mono text-sm">
                                  ${tx.amount.toLocaleString()}
                                  {tx.tokenSymbol && (
                                    <span className="text-muted-foreground ml-1 text-xs">
                                      {tx.tokenSymbol}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {formatDate(tx.timestamp)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="font-mono text-xs text-muted-foreground">
                                {truncateHash(tx.txHash)}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm font-mono">
                              {tx.blockNumber ?? "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <a
                                  href={`${CHAIN_CONFIG.blockExplorer}/tx/${tx.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </a>
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
