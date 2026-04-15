import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";

const Identity = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="innerpage container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Your Digital Identity</h1>
        <p className="subtxt text-lg md:text-xl text-muted-foreground">
          Your .zeus domain is more than just a name - it's your decentralized identity. 
          Control your data, manage your reputation, and own your digital presence.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Identity;