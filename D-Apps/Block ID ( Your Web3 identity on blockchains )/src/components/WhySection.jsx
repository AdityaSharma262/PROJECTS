import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Lock, Layers, Network } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is a Web3 identity?",
      answer:
        "A Web3 identity is a secure digital identity you fully own on the blockchain. Instead of using multiple usernames and passwords, you control one identity that works across apps, wallets, and platforms — without relying on a company to manage it for you.",
    },
    {
      question: "Why would I want my identity on a blockchain?",
      answer:
        "Putting your identity on-chain gives you ownership, privacy, and portability. No platform can delete, restrict, or sell your data. You decide what information to share, and your identity works everywhere you go in Web3.",
    },
    {
      question: "What is a .bnb domain?",
      answer:
        "A .bnb domain is your personal name or brand on the BNB network. It replaces long wallet addresses with a simple username, and can serve as your Web3 identity, messaging handle, and verification hub.",
    },
    {
      question: "How does secure messaging work?",
      answer:
        "Messaging is end-to-end encrypted, meaning only you and the recipient can read it. You can send wallet-to-wallet messages or receive emails directly into your wallet through the email-to-wallet gateway. Your conversations stay private.",
    },
     {
      question: "How is my data protected?",
      answer:
        "You control all your information. Nothing is stored by a company — everything is encrypted or kept on-chain under your ownership. You decide who sees your credentials and which apps you connect to.",
    },
    {
      question: "What is self-sovereign identity?",
      answer:
        "Self-sovereign identity (SSI) means you own your identity, not a platform. You hold verifiable credentials (like KYC, age, or membership proofs) that you can share selectively without giving away personal details.",
    },
    {
      question: "How does on-chain KYC via Incognito work?",
      answer:
        "Incognito performs identity verification privately. You prove who you are once, and receive verifiable credentials that apps can trust — without exposing your sensitive data to multiple services.",
    },
    {
      question: "Do I really 'own' my .bnb domain?",
      answer:
        "Yes. Your .bnb domain is registered directly on the BNB network. There's no company that can take it from you, shut it down, or deactivate it. As long as you control your wallet, the identity is fully yours.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-list mt-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border rounded-lg p-3 mb-3 bg-white cursor-pointer"
          onClick={() => toggleFAQ(index)}
        >
          <div className="flex justify-between items-center">
            <h5 className="mb-0">{faq.question}</h5>
            <span>{openIndex === index ? "-" : "+"}</span>
          </div>

          <AnimatePresence>
            {openIndex === index && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 text-muted-foreground"
              >
                {faq.answer}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

const WhySection = () => {
  const benefits = [
    {
      icon: Key,
      title: "Ownership",
      description:
        "In Web2, your identity (email, username, social profile) is rented from platforms. In Web3, your identity is yours, stored on-chain, and cannot be taken away, banned, or sold.",
    },
    {
      icon: Lock,
      title: "One Identity",
      description:
        "A Web3 identity acts as a universal login that travels with you across apps, games, marketplaces, and wallets.",
    },
    {
      icon: Layers,
      title: "You’re In Control",
      description:
        "Web2 platforms store your data. We don’t – you choose what to share, when, and with whom. No leaks or shadow profiles.",
    },
    {
      icon: Network,
      title: "Communication",
      description:
        "With a blockchain identity, messages are encrypted, wallet-to-wallet, spam-free, and portable across apps.",
    },
  ];

  return (
    <>
      {/* BENEFITS SECTION */}
      <section className="py-5 lg:py-8 bg-card Ownership">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mx-auto mb-5"
            style={{ maxWidth: "65rem" }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-2">Why Web3 Identity Matters</h2>
            <p className="text-lg text-muted-foreground">
              Instead of managing dozens of logins, you control one secure
              identity that works across apps, wallets, and platforms.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div
                  className="mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 hover-shadow-glow-primary transition-all duration-300"
                  style={{ width: "4rem", height: "4rem" }}
                >
                  <benefit.icon
                    className="text-primary"
                    style={{ width: "2rem", height: "2rem" }}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </>
  );
};

export default WhySection;
