import { motion } from "framer-motion";
import { ArrowRight, Shield, Coins, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Building,
    title: "Tokenized Real Estate",
    description: "Invest in premium properties worldwide with fractional ownership starting from $25.",
  },
  {
    icon: Coins,
    title: "Yield Distribution",
    description: "Earn passive income through automated on-chain yield distribution to token holders.",
  },
  {
    icon: Shield,
    title: "Compliant & Secure",
    description: "ERC-3643 security tokens with built-in KYC/AML compliance and investor whitelisting.",
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-gold" />
              <span className="text-sm font-medium text-primary">Built on Ethereum</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-foreground">Tokenize </span>
              <span className="text-gradient-gold">Real-World Assets</span>
              <br />
              <span className="text-foreground">On The Blockchain</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Invest in premium real estate, treasury bonds, and commodities through 
              fractional ownership. Earn passive yield with full regulatory compliance.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/marketplace">
                <Button variant="hero" size="xl">
                  Explore Assets
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button variant="gold-outline" size="xl">
                  View Portfolio
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="mt-16 grid sm:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300"
              >
                <feature.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-display text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
