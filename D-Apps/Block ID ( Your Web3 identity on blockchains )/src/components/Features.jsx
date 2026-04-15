import { motion } from "framer-motion";
import { Search, FileCheck, MessageSquare, ShieldCheck, Settings } from "lucide-react";
import { Card } from "@/components/ui/card.jsx";

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "Find Your Domain",
      description: "Search for .zeus and .apollo domains. You get full ownership and control in one place. ",
      gradient: "from-primary/20 to-accent/20",
    },
    {
      icon: FileCheck,
      title: "Register & Own",
      description: "Register and purchase your secure domain with the click of a button. No middlemen – full ownership",
      gradient: "from-accent/20 to-primary/20",
    },
    {
      icon: MessageSquare,
      title: "Secure Messaging",
      description: "Chat safely with end-to-end encrypted wallet-to-wallet messaging. Your conversations stay private. ",
      gradient: "from-primary/20 to-accent/20",
    },
    {
      icon: ShieldCheck,
      title: "Instant Verification",
      description: "Build a secure digital identity with verified credentials and on-chain KYC via Incognito. ",
      gradient: "from-accent/20 to-primary/20",
    },
   
  ];

  return (
    <section id="discover" className="py-5 lg:py-8">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mx-auto mb-4" style={{maxWidth: '48rem'}}
        >
          <h2 className="dmt text-3xl md:text-5xl font-bold mb-2">
           One-stop Web3 Domain & Identity Platform
          </h2>
          <p className="text-lg text-muted-foreground">
           Everything you need is here.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="dthbox grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group p-4 h-100 bg-card hover-bg-card border border-border hover-border-primary transition-all duration-300 hover-shadow-glow-primary">
                <div className={`rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`} style={{width: '3rem', height: '3rem'}}>
                  <feature.icon className="text-primary" style={{width: '1.5rem', height: '1.5rem'}} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
