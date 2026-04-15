import { motion } from "framer-motion";


const Blockchain = () => {
  const chains = [
    { name: "BNB", color: "text-accent" },
  ];



  return (
    <section className="py-12 border-y border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Multi-Chain Identity</h2>
            <p className="text-muted-foreground mb-8">
              BitEthWorks provides a unified identity layer across multiple blockchain networks,
              starting with BNB.
            </p>
            <div className="flex gap-4">
              {chains.map((chain) => (
                <div key={chain.name} className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="font-semibold">{chain.name}</span>
                </div>
              ))}
            </div>
          </div>
          

        </div>
      </div>
    </section>
  );
};

export default Blockchain;
