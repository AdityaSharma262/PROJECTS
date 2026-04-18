import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.jsx";
import { motion } from "framer-motion";

const FAQ = () => {
  const faqs = [
    {
      question: "What is a .bnb domain?",
      answer: "A .bnb domain is a decentralized Web3 domain built on blockchains that serves as your universal digital identity across blockchain platforms, dApps, and Web3 services.",
    },
    {
      question: "How do I register a .bnb domain?",
      answer: "Simply search for your desired domain name, connect your Apollo Wallet or MetaMask, and complete the transaction on blockchains. The domain is yours permanently once registered.",
    },
    {
      question: "What is BNB Mail and how does it work?",
      answer: "BNB Mail is an encrypted email-to-wallet gateway that lets you send and receive messages using your .bnb domain. All messages are end-to-end encrypted and stored as hashes on-chain.",
    },
    {
      question: "How is messaging encrypted?",
      answer: "We use end-to-end encryption with your wallet's private key. Only you and your recipient can decrypt messages — not even BlockID can access your communications."
    },
   
    {
      question: "Does BlockID support multiple blockchains?",
      answer: "Absolutely. BlockID works across BNB, Ethereum, Base, Polygon, and APE Chain, giving you true multi-chain identity."
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about BlockID.</p>
        </motion.div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
