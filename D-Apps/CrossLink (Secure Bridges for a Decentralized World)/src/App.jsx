import { useEffect, useState } from 'react';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useBalance,
} from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits, parseUnits, toHex, zeroHash } from 'viem';
import { bsc, mainnet, polygon, arbitrum, optimism, avalanche, fantom } from 'wagmi/chains';
import CONTRACT_ABI from './contractAbi.json';
import { readContract } from '@wagmi/core';
import { config } from './wagmi-config.js';
import Footer from './Footer';


const CONTRACT_ADDRESSES = {
  [mainnet.id]: '0x6602d8b4d7688eee8c11d7ca2addc582d6744c4c',
  [bsc.id]: '0xd65a2db3bb4e4d64ca6fbbd94599b2cc44e0d056',
  [polygon.id]: '0x6a158b0d9da3bc124b7e8c62e520a3c5e2d22216',
  [arbitrum.id]: '0x6602d8b4d7688eee8c11d7ca2addc582d6744c4c',
  [optimism.id]: '0x6602d8b4d7688eee8c11d7ca2addc582d6744c4c',
  [avalanche.id]: '0x6602d8b4d7688eee8c11d7ca2addc582d6744c4c',
  [fantom.id]: '0x6602d8b4d7688eee8c11d7ca2addc582d6744c4c',
};

const DST_CHAIN_NAMES = {
  [mainnet.id]: 'ethereum-mainnet',
  [bsc.id]: 'bsc-mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arbitrum-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [avalanche.id]: 'avalanche-mainnet',
  [fantom.id]: 'fantom-mainnet',
};

const CHAIN_ICON = {
  [mainnet.id]: "/eth.png",
  [bsc.id]: "/bsc-mainnet.png",
  [polygon.id]: "/polygon-mainnet.png",
  [arbitrum.id]: "/arbitrum-mainnet.svg",
  [optimism.id]: "/optimism-mainnet.svg",
  [avalanche.id]: "/avalanche-mainnet.svg",
  [fantom.id]: "/fantom-mainnet.svg",
};

// === Token list with icons ===
const TOKENS = [
  { symbol: "USDT", name: "Tether USD", icon: "/usdt.svg", address: { [mainnet.id]: '0xdAC17F958D2ee523a2206206994597C13D831ec7', [bsc.id]: '0x55d398326f99059fF775485246999027B3197955', [polygon.id]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', [arbitrum.id]: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', [optimism.id]: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', [avalanche.id]: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', [fantom.id]: '0x049d68029688eAbF473097a2fC38ef61633A3C7A' } },
  { symbol: "USDC", name: "USD Coin", icon: "/usdc.svg", address: { [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', [bsc.id]: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', [polygon.id]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', [optimism.id]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', [avalanche.id]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', [fantom.id]: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75' } },
  { symbol: "DAI", name: "Dai", icon: "/dai.svg", address: { [mainnet.id]: '0x6B175474E89094C44Da98b954EedeAC495271d0F', [bsc.id]: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', [polygon.id]: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', [arbitrum.id]: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', [optimism.id]: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', [avalanche.id]: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', [fantom.id]: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E' } },
  { symbol: "BUSD", name: "Binance USD", icon: "/busd.svg", address: { [mainnet.id]: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', [bsc.id]: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', [polygon.id]: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39', [arbitrum.id]: '0x3119c04b4681675F422DC65FBdd1952ee37D142C', [optimism.id]: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39', [avalanche.id]: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39', [fantom.id]: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39' } },
  { symbol: "FRAX", name: "Frax", icon: "/frax.svg", address: { [mainnet.id]: '0x853d955aCEf822Db058eb8505911ED77F175b99e', [bsc.id]: '0x90C97F71E18723b0Cf0dfa30ee176Ab653E89F40', [polygon.id]: '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89', [arbitrum.id]: '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F', [optimism.id]: '0x2E3D870790dC77A83DD1d18184Acc7439A53f475', [avalanche.id]: '0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64', [fantom.id]: '0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355' } },
  { symbol: "TUSD", name: "TrueUSD", icon: "/tusd.svg", address: { [mainnet.id]: '0x0000000000085d4780B73119b644AE5ecd22b376', [bsc.id]: '0x14016E85a25aeb13065688cAFB43044C2ef86784', [polygon.id]: '0x2e1AD108fF1D8C782fcBbB89AAd783aC49586756', [arbitrum.id]: '0x4D15a3A2286D80e045467E5574fd1Efb0f2d6969', [optimism.id]: '0x541522392074De06D99E036b223345214A205C94', [avalanche.id]: '0x1C20E891Bab6b1727d14Da358FAe2984Ed9B59EB', [fantom.id]: '0x9879Abdea01A879644185341F7aF7d8343556B7a' } },
  { symbol: "USDP", name: "Pax Dollar", icon: "/usdp.svg", address: { [mainnet.id]: '0x8E870D67F660D95d5be530380D0eC0bd388289E1', [bsc.id]: '0xb7F8Cd00C5A06c0537E2aBfF0b5803C4b6AE9d0c', [polygon.id]: '0xD14697C38c2BE30b0A98C396e93C3C21C93e3b45', [arbitrum.id]: '0xD14697C38c2BE30b0A98C396e93C3C21C93e3b45', [optimism.id]: '0xD14697C38c2BE30b0A98C396e93C3C21C93e3b45', [avalanche.id]: '0xD14697C38c2BE30b0A98C396e93C3C21C93e3b45', [fantom.id]: '0xD14697C38c2BE30b0A98C396e93C3C21C93e3b45' } },
  { symbol: "GUSD", name: "Gemini Dollar", icon: "/gusd.svg", address: { [mainnet.id]: '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd', [bsc.id]: '0x6fE4C1eECf74971B43B9E4587d46E77f9b30e5dD', [polygon.id]: '0xC83F166f549Fe9141C14763500B5e49567677500', [arbitrum.id]: '0xC83F166f549Fe9141C14763500B5e49567677500', [optimism.id]: '0xC83F166f549Fe9141C14763500B5e49567677500', [avalanche.id]: '0xC83F166f549Fe9141C14763500B5e49567677500', [fantom.id]: '0xC83F166f549Fe9141C14763500B5e49567677500' } },
  { symbol: "LUSD", name: "Liquity USD", icon: "/lusd.svg", address: { [mainnet.id]: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', [bsc.id]: '0x23396cF899Ca06c4472205fC903bDB4dE24c0dF4', [polygon.id]: '0x23001f892c0C82b79303EDC9B9033cD190BB21c7', [arbitrum.id]: '0x23001f892c0C82b79303EDC9B9033cD190BB21c7', [optimism.id]: '0x23001f892c0C82b79303EDC9B9033cD190BB21c7', [avalanche.id]: '0x23001f892c0C82b79303EDC9B9033cD190BB21c7', [fantom.id]: '0x23001f892c0C82b79303EDC9B9033cD190BB21c7' } },
  { symbol: "sUSD", name: "Synth sUSD", icon: "/susd.svg", address: { [mainnet.id]: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51', [bsc.id]: '0x0543347646A2269406A93D36784a4f9c3d1B8C5e', [polygon.id]: '0xF81b4Bec6Ca8f9fe7bE01CA734F55B2b6e03A7a0', [arbitrum.id]: '0xF81b4Bec6Ca8f9fe7bE01CA734F55B2b6e03A7a0', [optimism.id]: '0xF81b4Bec6Ca8f9fe7bE01CA734F55B2b6e03A7a0', [avalanche.id]: '0xF81b4Bec6Ca8f9fe7bE01CA734F55B2b6e03A7a0', [fantom.id]: '0xF81b4Bec6Ca8f9fe7bE01CA734F55B2b6e03A7a0' } },
];

// === Custom Dropdown (Chains) ===
function ChainDropdown({ chains, selected, onSelect }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (chainId) => {
    onSelect(chainId);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Selected */}
      <div
        onClick={() => setOpen(!open)}
        className="maindiv flex items-center justify-between w-full border rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500"
      >
        <div className="flex items-center space-x-2 box1">
          <img
            src={CHAIN_ICON[selected] || "/chain-logo.svg"}
            alt="chain"
            className="w-5 h-5 rounded-full"
          />
          <span>
            {chains.find((c) => c.id === selected)?.name || "Select Chain"}
          </span>
        </div>
        <span className="text-gray-500">▼</span>
      </div>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {chains.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <img
                src={CHAIN_ICON[c.id]}
                alt={c.name}
                className="w-5 h-5 rounded-full mr-2"
              />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === Custom Dropdown (Tokens with Icons) ===
function TokenDropdown({ tokens, selected, onSelect }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (symbol) => {
    onSelect(symbol);
    setOpen(false);
  };

  const selectedToken = tokens.find((t) => t.symbol === selected);

  return (
    <div className="relative">
      {/* Selected */}
      <div
        onClick={() => setOpen(!open)}
        className="maindiv flex items-center justify-between w-full border rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500"
      >
        <div className="flex items-center space-x-2 box1">
          <img
            src={selectedToken?.icon || "/token.png"}
            alt="token"
            className="w-5 h-5 rounded-full"
          />
          <span>{selectedToken?.name || "Select Token"}</span>
        </div>
        <span className="text-gray-500">▼</span>
      </div>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {tokens.map((t) => (
            <div
              key={t.symbol}
              onClick={() => handleSelect(t.symbol)}
              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <img
                src={t.icon}
                alt={t.name}
                className="w-5 h-5 rounded-full mr-2"
              />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { address, chain, isConnected } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { error, data: txHash, writeContract } = useWriteContract();

  // Theme state management
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

 const [sourceChainId, setSourceChainId] = useState(chain?.id);
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState("USDT");
  const [balance, setBalance] = useState("0");
  // Get token balance on current chain
  useEffect(() => {
    const getBalance = async () => {
      if (!address || !chain) return;

      try {
        const selectedToken = TOKENS.find(t => t.symbol === token);
        const tokenAddress = selectedToken?.address?.[chainId];
        
        if (!tokenAddress) {
          setBalance("0");
          return;
        }

        const bal = await readContract(config, {
          address: tokenAddress,
          abi: CONTRACT_ABI,
          functionName: "balanceOf",
          args: [address],
        });

        setBalance(formatUnits(bal, 18).toString());
      } catch (err) {
        console.error("Error fetching balance:", err);
        setBalance("0");
      }
    };

    getBalance();
  }, [address, chain, token]);

  // Native balance for gas
  const { data: nativeBalance } = useBalance({ address, chainId });

  const handleSwitchSourceChain = (newChainId) => {
    setSourceChainId(newChainId);
    if (chainId !== newChainId) {
      switchChain({ chainId: newChainId });
    }
  };

  const [destChainId, setDestChainId] = useState(bsc.id)

  const handleBridge = () => {
    console.log("Bridging initiated");
    if (!amount || !address) return;

    const selectedToken = TOKENS.find(t => t.symbol === token);
    const tokenAddress = selectedToken?.address?.[sourceChainId];
    
    if (!tokenAddress) {
      console.error("Token address not found for selected chain");
      return;
    }

    const contractAddress = CONTRACT_ADDRESSES[sourceChainId];
    const dstChain = DST_CHAIN_NAMES[destChainId];
	const dstAddressBytes = toHex(address);
    const parsedAmount = parseUnits(amount, 18);
    const transferId = zeroHash;
    console.log([parsedAmount, dstChain, dstAddressBytes, transferId],)
    writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'burnForBridge',
      args: [parsedAmount, dstChain, dstAddressBytes, transferId],
      chainId: sourceChainId,
      value:'0'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="text-white py-0 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img alt="CROSSLINK Logo" src="/chainmeshlogo.png" className="site-logo" />
          <div className="flex items-center">
            <button 
              onClick={toggleTheme}
              className="theme-toggle mr-8"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                // Moon icon for light mode
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                // Sun icon for dark mode
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <div className="ConnectButtonright" style={{ marginLeft: '20px' }}>
              <ConnectButton accountStatus="avatar" />
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="bridge-card">
          <div className="bg-card rounded-[1.5rem] shadow-xl p-6 w-full max-w-md border border-border-primary">
          <h1 className="text-2xl font-bold text-center mb-6">
            CROSSLINK 
          </h1>

          {/* Custom Dropdowns */}
          <div className="form-stack">
            <div className="dropdownbox field-block">
              <label className="block text-xs font-medium mb-1 text-gray-200">Source Chain</label>
              <ChainDropdown 
                chains={chains}
                selected={sourceChainId}
                onSelect={handleSwitchSourceChain}
              />
            </div>

            <div className="arrow-separator">↓</div>

            <div className="dropdownbox field-block">
              <label className="block text-xs font-medium mb-1 text-gray-200">Destination Chain</label>
              <ChainDropdown
                chains={chains}
                selected={destChainId}
                onSelect={setDestChainId}
              />
            </div>

            <div className="dropdownbox field-block">
              <label className="block text-xs font-medium mb-1 text-gray-200">Token</label>
              <TokenDropdown
                tokens={TOKENS}
                selected={token}
                onSelect={setToken}
              />
            </div>

            <div className="field-block">
              <label className="block text-xs font-medium mb-1 text-gray-200">Amount to Bridge</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-1.5 border rounded-lg text-sm"
              />
            </div>

            <button
              onClick={handleBridge}
              disabled={!amount || chainId !== sourceChainId || !isConnected}
              className="action-button bg-blue-600 text-white"
            >
              Bridge {token}
            </button>
			
			{txHash && (
                <div className="text-green-600 text-xs break-words mt-2 p-2 rounded-lg bg-green-600/10 border border-green-600/20">
                  ✅ Transaction submitted: <a
                    href={`${chain.blockExplorers.default.url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-400"
                  >
                    {txHash}
                  </a>
                </div>
              )}
			  
           {error && (
                <div className="text-red-600 text-xs break-words mt-2 p-2 rounded-lg bg-red-600/10 border border-red-600/20">
                  ❌ Error: {error.message}
                </div>
              )}
            </div>
			
			   {/* Connection hint */}
            {!isConnected && (
              <p className="text-center text-gray-500 text-xs mt-3">Please connect your wallet to proceed with bridging.</p>
            )}
                        
            {isConnected && (
              <div className="text-xs text-gray-400 space-y-1 mt-3 p-2 rounded-lg bg-dark-tertiary/50">
               <p>
                  <span className="font-medium text-gray-300">{token} Balance:</span> {balance} {token}
                </p>
                <p>
                  <span className="font-medium text-gray-300">Native Balance:</span>{' '}
                  {nativeBalance?.formatted ?? '0'} {nativeBalance?.symbol ?? ''}
                </p>
              </div>
            )}
       			
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
