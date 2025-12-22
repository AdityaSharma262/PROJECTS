import { useState } from "react";
import Web3 from "web3";
import { contractAddress, contractABI } from "./freelancerAbi";
import ClientDashboard from "./components/clientDashboard";
import FreelancerDashboard from "./components/freelancerDashboard";
import "./App.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [page, setPage] = useState("landing");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        setWeb3(web3Instance);
        setContract(new web3Instance.eth.Contract(contractABI, contractAddress));
      } catch (error) {
        alert("Error connecting wallet: " + error.message);
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWeb3(null);
    setContract(null);
    setPage("landing");
  };

  if (page === "client") {
    return (
      <div className="app-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1>Client Dashboard</h1>
        <ClientDashboard web3={web3} contract={contract} account={account} />
        <button style={{ marginTop: 24 }} onClick={() => setPage("landing")}>Back to Home</button>
      </div>
    );
  }

  if (page === "freelancer") {
    return (
      <div className="app-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1>Freelancer Dashboard</h1>
        <FreelancerDashboard web3={web3} contract={contract} account={account} />
        <button style={{ marginTop: 24 }} onClick={() => setPage("landing")}>Back to Home</button>
      </div>
    );
  }

  // Landing page
  return (
    <div className="app-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {account && (
        <div className="connected-account-box" style={{ marginBottom: 18, marginTop: 18 }}>
          Connected Account:<br />
          <span style={{ fontWeight: 600 }}>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
        </div>
      )}
      <div className="landing-card">
        <h1>Decentralized Freelance Escrow Platform</h1>
        <div className="landing-description">
          <span className="highlight">Empowering Trust, Speed, and Security</span><br /><br />
          <strong>For Clients:</strong> Post jobs, fund escrow instantly, and pay only when satisfied.<br />
          <strong>For Freelancers:</strong> Accept jobs, deliver work, and get paid instantly upon approval.<br /><br />
          <span className="subtle">No middlemen. No delays. 100% transparency. <br />
          <span style={{ color: '#667eea', fontWeight: 600 }}>Your work, your rules, your money.</span></span>
        </div>
        {account && (
          <button className="disconnect-btn" onClick={disconnectWallet}>Disconnect</button>
        )}
        {!account && (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <div className="role-btn-row">
          <button className="role-btn" onClick={() => setPage("client")} disabled={!account}>
            <span className="role-icon" role="img" aria-label="Client">👤</span>
            Client
          </button>
          <button className="role-btn" onClick={() => setPage("freelancer")} disabled={!account}>
            <span className="role-icon" role="img" aria-label="Freelancer">💼</span>
            Freelancer
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;