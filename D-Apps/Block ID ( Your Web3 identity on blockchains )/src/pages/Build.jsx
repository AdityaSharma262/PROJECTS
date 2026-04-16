import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";

const Build = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="innerpage container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Build with BlockID</h1>
        <p className="subtxt text-lg md:text-xl text-muted-foreground">
          Integrate .zeus domains into your applications with our developer-friendly APIs. 
          Access documentation, SDKs, and tools to build the next generation of decentralized applications.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Build;