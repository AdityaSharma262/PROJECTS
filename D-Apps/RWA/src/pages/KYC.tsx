import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Clock,
  FileText,
  Upload,
  Globe,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useKYC } from "@/hooks/useKYC";
import { CHAIN_CONFIG } from "@/lib/contracts";

const kycStatusLabels: Record<number, { label: string; color: string; icon: typeof Shield }> = {
  0: { label: "Not Submitted", color: "text-muted-foreground", icon: Shield },
  1: { label: "Pending Review", color: "text-primary", icon: Clock },
  2: { label: "Verified", color: "text-accent", icon: ShieldCheck },
  3: { label: "Rejected", color: "text-destructive", icon: AlertCircle },
  4: { label: "Revoked", color: "text-destructive", icon: AlertCircle },
  5: { label: "Expired", color: "text-orange-400", icon: Clock },
};

const investorTypes = [
  { value: 0, label: "Retail Investor" },
  { value: 1, label: "Accredited Investor" },
  { value: 2, label: "Institutional" },
];

const jurisdictions = [
  "US", "UK", "EU", "UAE", "SG", "CH", "JP", "AU", "CA", "HK", "IN", "Other",
];

export default function KYCPage() {
  const { isConnected, connect, address } = useWallet();
  const { kycState, txState, resetTxState, submitKYC, getIdentity } = useKYC();
  const [jurisdiction, setJurisdiction] = useState("");
  const [investorType, setInvestorType] = useState("0");
  const [documentHash, setDocumentHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      getIdentity(address).catch(() => {
        setHasChecked(true);
      }).finally(() => {
        setHasChecked(true);
      });
    }
  }, [isConnected, address, getIdentity]);

  const handleSubmit = async () => {
    if (!jurisdiction || !documentHash) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitKYC(jurisdiction, parseInt(investorType), documentHash);
      toast.success("KYC submitted successfully! Pending review.");
    } catch {
      toast.error("Submission failed. Ensure contracts are deployed.");
    }
    setIsSubmitting(false);
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
            Connect your wallet to complete KYC verification and access the platform.
          </p>
          <Button variant="gold" size="lg" onClick={connect}>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  const statusInfo = kycStatusLabels[kycState.status] || kycStatusLabels[0];
  const StatusIcon = statusInfo.icon;
  const isVerified = kycState.status === 2;
  const isPending = kycState.status === 1;

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
            KYC <span className="text-gradient-gold">Verification</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete identity verification to access all platform features
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-card border border-border rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center`}>
                <StatusIcon className={`h-7 w-7 ${statusInfo.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verification Status</p>
                <p className={`font-display text-xl font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
              </div>
            </div>
            {isVerified && (
              <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>

          {isVerified && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Jurisdiction</p>
                <p className="text-sm font-semibold text-foreground">{kycState.jurisdiction || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Investor Type</p>
                <p className="text-sm font-semibold text-foreground">
                  {investorTypes[kycState.investorType]?.label || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified On</p>
                <p className="text-sm font-semibold text-foreground">
                  {kycState.verifiedAt > 0 ? new Date(kycState.verifiedAt * 1000).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="text-sm font-semibold text-foreground">
                  {kycState.expiresAt > 0 ? new Date(kycState.expiresAt * 1000).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Steps */}
        {!isVerified && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-2">
              {["Personal Info", "Documents", "Submit"].map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-sm text-muted-foreground hidden sm:block">{step}</span>
                  {i < 2 && <div className="flex-1 h-px bg-border mx-2" />}
                </div>
              ))}
            </div>

            {/* Form */}
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-6 space-y-6">
                {/* Jurisdiction */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Jurisdiction <span className="text-destructive">*</span>
                  </Label>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select your country/region" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map((j) => (
                        <SelectItem key={j} value={j}>{j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Your country of residence for compliance purposes
                  </p>
                </div>

                {/* Investor Type */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Investor Type
                  </Label>
                  <Select value={investorType} onValueChange={setInvestorType}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {investorTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Upload */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Identity Documents <span className="text-destructive">*</span>
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-foreground font-medium">
                      Upload ID, proof of address, and selfie
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG up to 10MB each
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          // In production: upload to IPFS, get hash
                          setDocumentHash(`ipfs://Qm${Array.from(e.target.files).map(f => f.name).join("_").slice(0, 20)}`);
                          toast.info(`${e.target.files.length} file(s) selected. Upload to IPFS in production.`);
                        }
                      }}
                    />
                    <Button variant="secondary" size="sm" className="mt-4" onClick={() => {
                      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                      input?.click();
                    }}>
                      <Upload className="h-4 w-4" />
                      Select Files
                    </Button>
                  </div>
                  {documentHash && (
                    <p className="text-xs text-accent flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Document hash: {documentHash.slice(0, 30)}...
                    </p>
                  )}
                </div>

                {/* Agreement */}
                <div className="bg-secondary/50 rounded-lg p-4 text-xs text-muted-foreground">
                  <p>By submitting, you agree to the platform's Terms of Service and Privacy Policy.
                    Your documents will be reviewed by a compliance officer within 24-48 hours.
                    Verification is valid for 1 year from the date of approval.</p>
                </div>

                {/* Error */}
                {txState.error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <p className="text-sm text-destructive">{txState.error}</p>
                  </div>
                )}

                {txState.txHash && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
                    <p className="text-sm text-accent font-medium mb-1">KYC Submitted!</p>
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
                  className="w-full h-12"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !jurisdiction || !documentHash}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending State */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <Clock className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Verification In Progress
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your KYC documents are being reviewed by our compliance team.
              This typically takes 24-48 hours. You'll be notified once the review is complete.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
