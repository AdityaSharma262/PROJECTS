import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";

const Discover = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="discover container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Discover</h1>
        <p className="subtx text-lg md:text-xl text-muted-foreground">
          Explore the decentralized web with .bnb domains. Discover new projects, 
          connect with communities, and explore the BNB ecosystem.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Discover;