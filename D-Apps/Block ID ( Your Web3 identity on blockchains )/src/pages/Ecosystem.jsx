import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";

const Ecosystem = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="innerpage container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">BNB Ecosystem</h1>
        <p className="subtxt text-lg md:text-xl text-muted-foreground">
          Explore the growing ecosystem of applications, services, and tools built on blockchains. 
          Discover how .bnb domains integrate with the broader decentralized web.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Ecosystem;