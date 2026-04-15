import Header from "@/components/Header.jsx";
import Hero from "@/components/Hero.jsx";
import Features from "@/components/Features.jsx";
import WhySection from "@/components/WhySection.jsx";
import Blockchain from "@/components/Blockchain.jsx";
import FAQ from "@/components/FAQ.jsx";
import Footer from "@/components/Footer.jsx";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <WhySection />
      <Blockchain />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
