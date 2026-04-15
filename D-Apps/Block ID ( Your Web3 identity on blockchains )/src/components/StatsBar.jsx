import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const StatsBar = () => {
  const stats = [
    { label: "Domains Registered", value: 12847, suffix: "+" },
    { label: "Active Users", value: 8320, suffix: "+" },
    { label: "BNB Chain TVL", value: 4.2, suffix: "M" },
    { label: "Messages Encrypted", value: 156000, suffix: "+" },
  ];

  return (
    <section className="py-12 border-y border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AnimatedCounter = ({ value, suffix }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-3xl lg:text-4xl font-bold bg-gradient-electric bg-clip-text text-transparent">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

export default StatsBar;
