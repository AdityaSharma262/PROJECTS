import { useState } from "react";
import Web3 from "web3";
import { contractAddress, contractABI } from "./freelancerAbi";
import ClientDashboard from "./components/clientDashboard";
import FreelancerDashboard from "./components/freelancerDashboard";
import Header from "./components/ui/Header";
import Toast from "./components/ui/Toast";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [page, setPage] = useState("landing");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        setWeb3(web3Instance);
        setContract(new web3Instance.eth.Contract(contractABI, contractAddress));
        showToast("Wallet connected successfully!", "success");
      } catch (error) {
        showToast("Error connecting wallet: " + error.message, "error");
      }
    } else {
      showToast("Please install MetaMask to use this application", "error");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWeb3(null);
    setContract(null);
    setPage("landing");
    showToast("Wallet disconnected", "info");
  };

  const handleNavigate = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className={`min-h-screen ${page === 'landing' ? 'bg-transparent' : 'bg-gray-50'}`}>
      <Header 
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onNavigate={handleNavigate}
        currentPage={page}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page === "client" && account && (
          <div className="animate-fade-in">
            <ClientDashboard web3={web3} contract={contract} account={account} showToast={showToast} />
          </div>
        )}

        {page === "freelancer" && account && (
          <div className="animate-fade-in">
            <FreelancerDashboard web3={web3} contract={contract} account={account} showToast={showToast} />
          </div>
        )}

        {page === "landing" && (
          <div className="animate-fade-in">
            <LandingPage 
              account={account} 
              onConnect={connectWallet}
              onGetStarted={() => setPage(account ? "client" : "landing")} 
            />
          </div>
        )}
      </main>

      {/* Background Image for Landing Page */}
      {page === "landing" && (
        <div 
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: `url('/bgImage.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
          }}
        />
      )}
    </div>
  );
}

// Modern Landing Page Component
function LandingPage({ account, onConnect, onGetStarted }) {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure Escrow",
      description: "Funds are held securely in smart contracts until work is approved",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Payments",
      description: "Get paid immediately upon approval with no middlemen or delays",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "100% Transparent",
      description: "All transactions are recorded on the blockchain for complete transparency",
    },
  ];

  const steps = [
    { number: "01", title: "Create Job", description: "Post your job with budget and requirements" },
    { number: "02", title: "Freelancer Accepts", description: "Qualified freelancers accept your job" },
    { number: "03", title: "Submit Work", description: "Freelancer delivers work on time" },
    { number: "04", title: "Release Payment", description: "Approve work and release escrow payment" },
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full text-sm font-medium text-primary-700 mb-6">
          <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></span>
          Powered by Ethereum Blockchain
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
          Decentralized
          <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Freelance Escrow
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Empowering trust, speed, and security in freelance work. No middlemen. No delays. 
          100% transparency. Your work, your rules, your money.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!account ? (
            <button onClick={onConnect} className="btn-primary text-lg px-8 py-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Connect Wallet
              </div>
            </button>
          ) : (
            <button onClick={onGetStarted} className="btn-primary text-lg px-8 py-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m6-5H2a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" />
                </svg>
                Go to Dashboard
              </div>
            </button>
          )}
          <button className="btn-secondary text-lg px-8 py-4">
            Learn More
          </button>
        </div>

        {account && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-700">Wallet Connected</span>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white rounded-3xl p-8 md:p-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-black text-gray-100 mb-4">{step.number}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-white opacity-90 mb-8 max-w-2xl mx-auto">
            Join the decentralized freelance revolution. Post your first job or start accepting work today.
          </p>
          {!account ? (
            <button 
              onClick={onConnect} 
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect Wallet
            </button>
          ) : (
            <button 
              onClick={onGetStarted} 
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m6-5H2a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" />
              </svg>
              Go to Dashboard
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;