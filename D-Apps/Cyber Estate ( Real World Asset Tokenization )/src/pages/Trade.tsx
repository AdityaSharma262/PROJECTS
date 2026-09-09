import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  X,
  Wallet,
  Loader2,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplace } from "@/hooks/useMarketplace";
import { CHAIN_CONFIG } from "@/lib/contracts";

interface OrderItem {
  id: number;
  maker: string;
  asset: string;
  type: "sell" | "buy";
  amount: number;
  filled: number;
  pricePerToken: number;
  status: "active" | "filled" | "cancelled" | "expired";
  created: string;
  expires: string;
}

const mockOrders: OrderItem[] = [];

const statusConfig = {
  active: { label: "Active", variant: "default" as const, className: "bg-accent/20 text-accent" },
  filled: { label: "Filled", variant: "secondary" as const, className: "bg-primary/20 text-primary" },
  cancelled: { label: "Cancelled", variant: "destructive" as const, className: "bg-muted text-muted-foreground" },
  expired: { label: "Expired", variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
};

export default function Trade() {
  const { isConnected, connect } = useWallet();
  const { txState, fillOrder, cancelOrder, resetTxState } = useMarketplace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placeOrderOpen, setPlaceOrderOpen] = useState(false);
  const [fillOrderOpen, setFillOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);

  // Place order state
  const [orderAsset, setOrderAsset] = useState("Manhattan Office Tower");
  const [orderType, setOrderType] = useState<"buy" | "sell">("sell");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderDuration, setOrderDuration] = useState("7");

  const filtered = mockOrders.filter((o) => {
    const matchesSearch = o.asset.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || o.type === typeFilter;
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handlePlaceOrder = async () => {
    if (!orderAmount || !orderPrice) {
      toast.error("Please fill in all fields");
      return;
    }
    // Simulated — will use contract once deployed
    toast.success(`Order placed: ${orderType === "sell" ? "Sell" : "Buy"} ${orderAmount} tokens of ${orderAsset} at $${orderPrice}/token`);
    setPlaceOrderOpen(false);
    setOrderAmount("");
    setOrderPrice("");
  };

  const handleFillOrder = async () => {
    if (!selectedOrder) return;
    try {
      await fillOrder(selectedOrder.id, 1);
      toast.success("Order filled successfully!");
      setFillOrderOpen(false);
    } catch {
      toast.error("Fill order failed. Ensure contracts are deployed.");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled");
    } catch {
      toast.error("Cancel failed. Ensure contracts are deployed.");
    }
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
            Connect your wallet to access the secondary market and trade RWA tokens.
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
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Secondary <span className="text-gradient-gold">Market</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Trade RWA tokens peer-to-peer with on-chain escrow
            </p>
          </div>
          <Button variant="gold" onClick={() => setPlaceOrderOpen(true)}>
            <ArrowUpRight className="h-4 w-4" />
            Place Order
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Orders", value: mockOrders.filter(o => o.status === "active").length },
            { label: "Total Filled", value: mockOrders.filter(o => o.status === "filled").length },
            { label: "Platform Fee", value: "0.25%" },
            { label: "Network", value: "tBNB" },
          ].map((s, i) => (
            <Card key={i} className="bg-gradient-card border-border">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy Orders</SelectItem>
              <SelectItem value="sell">Sell Orders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Order List */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.length > 0 ? (
            filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gradient-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${order.type === "sell" ? "bg-destructive/10" : "bg-accent/10"}`}>
                      {order.type === "sell" ? (
                        <ArrowUpRight className="h-5 w-5 text-destructive" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">{order.asset}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {order.type === "sell" ? "Sell" : "Buy"} · ${order.pricePerToken}/token
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {order.created}
                        </span>
                        {order.expires !== "—" && <span>Expires: {order.expires}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {order.amount.toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.filled > 0
                          ? `${order.filled.toLocaleString()} filled (${((order.filled / order.amount) * 100).toFixed(0)}%)`
                          : "No fills yet"}
                      </p>
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[order.status].className}`}>
                        {statusConfig[order.status].label}
                      </span>
                    </div>

                    {order.status === "active" && (
                      <div className="flex gap-2">
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setFillOrderOpen(true);
                          }}
                        >
                          Fill
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-card/30">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-foreground">No Open Orders</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                There are currently no active limit orders on the secondary market. Place the first order!
              </p>
              <Button variant="gold" size="sm" onClick={() => setPlaceOrderOpen(true)}>
                Place Order
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Place Order Dialog */}
      <Dialog open={placeOrderOpen} onOpenChange={setPlaceOrderOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Place Order</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new limit order on the secondary market
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-foreground">Asset</Label>
              <Select value={orderAsset} onValueChange={setOrderAsset}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhattan Office Tower">Manhattan Office Tower</SelectItem>
                  <SelectItem value="Dubai Marina Residences">Dubai Marina Residences</SelectItem>
                  <SelectItem value="US Treasury Bond Fund">US Treasury Bond Fund</SelectItem>
                  <SelectItem value="Singapore Data Center">Singapore Data Center</SelectItem>
                  <SelectItem value="Gold Reserve Fund">Gold Reserve Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Order Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={orderType === "sell" ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => setOrderType("sell")}
                  className="flex-1"
                >
                  <ArrowUpRight className="h-4 w-4" /> Sell
                </Button>
                <Button
                  variant={orderType === "buy" ? "gold" : "secondary"}
                  size="sm"
                  onClick={() => setOrderType("buy")}
                  className="flex-1"
                >
                  <ArrowDownLeft className="h-4 w-4" /> Buy
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground">Amount</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Price/Token ($)</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Duration (days)</Label>
              <Select value={orderDuration} onValueChange={setOrderDuration}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {parseInt(orderAmount || "0") > 0 && parseFloat(orderPrice || "0") > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-bold text-primary">
                    ${(parseInt(orderAmount) * parseFloat(orderPrice)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="text-foreground">0.25%</span>
                </div>
              </div>
            )}
            <Button variant="gold" className="w-full" onClick={handlePlaceOrder}>
              {orderType === "sell" ? "Place Sell Order" : "Place Buy Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fill Order Dialog */}
      <Dialog open={fillOrderOpen} onOpenChange={(open) => { if (!open) resetTxState(); setFillOrderOpen(open); }}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Fill Order</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedOrder?.type === "sell" ? "Buy" : "Sell"} tokens from this order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="font-semibold text-foreground">{selectedOrder.asset}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="font-semibold">{(selectedOrder.amount - selectedOrder.filled).toLocaleString()} tokens</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">${selectedOrder.pricePerToken}/token</p>
                  </div>
                </div>
              </div>
              {txState.error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm text-destructive">{txState.error}</p>
                </div>
              )}
              {txState.txHash && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
                  <p className="text-sm text-accent font-medium mb-1">Order Filled!</p>
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
              <Button
                variant="gold"
                className="w-full"
                onClick={handleFillOrder}
                disabled={txState.isLoading || !!txState.txHash}
              >
                {txState.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : txState.txHash ? (
                  "Filled ✓"
                ) : (
                  `Fill Order ($${((selectedOrder.amount - selectedOrder.filled) * selectedOrder.pricePerToken).toLocaleString()})`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
