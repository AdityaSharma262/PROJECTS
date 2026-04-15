import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, Book, Rocket, Zap } from "lucide-react";

const Developer = () => {
  const features = [
    {
      icon: Code,
      title: "BitEthWorks SDK & API",
      description: "Integrate .zeus domain resolution into any dApp in just 30 minutes with our comprehensive SDK.",
    },
    {
      icon: Book,
      title: "Documentation",
      description: "Complete developer docs with code examples, tutorials, and integration guides for all platforms.",
    },
    {
      icon: Rocket,
      title: "Go-to-Market Tools",
      description: "Community tools and modules to launch your own identity services on BitEthWorks infrastructure."
    },
    {
      icon: Zap,
      title: "Quick Integration",
      description: "Query domain data, messaging, and identity verification with simple API calls.",
    },
  ];

  return (
    <section className="py-16 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-bold mb-6">Build on BitEthWorks</h2>
            <p className="text-lg text-muted-foreground mb-8">
              BitEthWorks provides a robust infrastructure for developers to build decentralized
              identity solutions. Our SDK makes it easy to integrate domain resolution 
              and messaging into your dApps.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg">
                View Documentation
              </Button>
              <Button variant="electric" size="lg">
                GitHub Repository
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full bg-background/50 border-border hover:border-primary transition-all">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Developer;
