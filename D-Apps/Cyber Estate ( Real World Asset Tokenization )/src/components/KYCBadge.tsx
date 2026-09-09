import { Shield, ShieldCheck, ShieldAlert, Clock } from "lucide-react";

type KYCStatusType = "verified" | "pending" | "unverified" | "rejected";

interface KYCBadgeProps {
  status: KYCStatusType;
  className?: string;
}

const statusConfig = {
  verified: {
    icon: ShieldCheck,
    label: "KYC Verified",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  pending: {
    icon: Clock,
    label: "KYC Pending",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  unverified: {
    icon: Shield,
    label: "Not Verified",
    className: "bg-muted text-muted-foreground border-border",
  },
  rejected: {
    icon: ShieldAlert,
    label: "KYC Rejected",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export default function KYCBadge({ status, className = "" }: KYCBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${config.className} ${className}`}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </div>
  );
}
