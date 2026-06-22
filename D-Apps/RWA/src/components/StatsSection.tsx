import { motion } from "framer-motion";
import { DollarSign, Building, Users, TrendingUp } from "lucide-react";
import { platformStats } from "@/lib/mockData";

const stats = [
  {
    label: "Total Value Locked",
    value: `$${(platformStats.totalValueLocked / 1000000).toFixed(0)}M`,
    icon: DollarSign,
    description: "Assets under management",
  },
  {
    label: "Tokenized Assets",
    value: platformStats.totalAssets.toString(),
    icon: Building,
    description: "Across 12 countries",
  },
  {
    label: "Active Investors",
    value: `${(platformStats.totalInvestors / 1000).toFixed(1)}K`,
    icon: Users,
    description: "Global community",
  },
  {
    label: "Avg. Annual Yield",
    value: `${platformStats.avgYield}%`,
    icon: TrendingUp,
    description: "Across all assets",
  },
];

export default function StatsSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-gradient-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-colors glow-gold/0 hover:glow-gold"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
