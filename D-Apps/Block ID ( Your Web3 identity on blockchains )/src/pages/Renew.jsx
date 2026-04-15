// pages/Renew.jsx
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SUPPORTED_TLDS,
  parseDomainInput,
  fetchDomainState,
  fetchDomainQuote,
  formatPrice,
  formatExpiry,
  tokenIdFor,
  tokenIdToBigInt,
} from "@/lib/apolloId.js";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/ABI/constant.js";

const Renew = () => {
  const [searchParams] = useSearchParams();
  const initialLabel = searchParams.get("name") || "";
  const initialTldParam = searchParams.get("tld") || "zeus";
  const initialTld = SUPPORTED_TLDS.includes(initialTldParam) ? initialTldParam : "zeus";
  const initialDomainFull = initialLabel && initialTld ? `${initialLabel}.${initialTld}` : "";

  const [selectedDomain, setSelectedDomain] = useState(initialDomainFull);
  const [domainInput, setDomainInput] = useState(initialLabel);
  const [selectedTld, setSelectedTld] = useState(initialTld);
  const [years, setYears] = useState(1);
  const [domainState, setDomainState] = useState(null);
  const [priceQuote, setPriceQuote] = useState(null);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [domainFetchStatus, setDomainFetchStatus] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const { address: user, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending: isRenewing, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  // Current chain detection
  const currentTld = chainId === 34504 ? "zeus" : chainId === 97 ? "bnb" : null;
  const tokenAddress = currentTld ? CONTRACT_ADDRESSES[currentTld]?.ApolloIDToken : null;
  const resolverAddress = currentTld ? CONTRACT_ADDRESSES[currentTld]?.ApolloIDResolver : null;
  const registrarAddress = currentTld ? CONTRACT_ADDRESSES[currentTld]?.ApolloIDRegistrar : null;
  const registrarABI = CONTRACT_ABIS.ApolloIDRegistrar;

  const domainOptions = domains.filter((d) => d.name && d.name.includes("."));

  const handleDomainSelection = useCallback(
    async (domainName) => {
      setSelectedDomain(domainName);
      setDomainState(null);
      setPriceQuote(null);
      setStatus(null);
      setTxHash(null);
      if (domainName && domainName.includes(".")) {
        const [label, tld] = domainName.split(".");
        setDomainInput(label || "");
        setSelectedTld(tld || currentTld || "zeus");
        
        // Immediately load the domain state and price quote for the selected domain
        if (user && label && tld) {
          try {
            setLoadingData(true);
            const parsed = parseDomainInput(`${label}.${tld}`, tld);
            
            // Load domain state
            const state = await fetchDomainState({
              label: parsed.label,
              tld: parsed.tld,
              walletAddress: user,
            });
            setDomainState(state);
            
            // Load price quote
            setLoadingPrice(true);
            const quote = await fetchDomainQuote({
              label: parsed.label,
              tld: parsed.tld,
              years,
              isRegistration: false,
            });
            setPriceQuote(quote);
          } catch (err) {
            setStatus(err?.message || "Failed to load domain info");
          } finally {
            setLoadingData(false);
            setLoadingPrice(false);
          }
        }
      } else {
        setDomainInput("");
        setSelectedTld(currentTld || "bnb");
      }
    },
    [currentTld, user, setLoadingData, setStatus, setLoadingPrice, years]
  );

  // Fetch owned domains from current chain only
  const fetchUserDomains = useCallback(async () => {
    if (!user || !isConnected || !publicClient || !tokenAddress || !resolverAddress) {
      setDomains([]);
      setDomainFetchStatus("Connect wallet or switch to BNB.");
      handleDomainSelection("");
      return;
    }

    try {
      setLoadingDomains(true);
      setDomainFetchStatus(null);
      // Clear current domain state when refreshing
      setDomainState(null);

      const logs = await publicClient.getLogs({
        address: tokenAddress,
        event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
        args: { to: user },
        fromBlock: 0n,
        toBlock: "latest",
      });

      const candidateIds = new Set(logs.map((log) => log.args.tokenId.toString()));
      const fetched = [];
      const cachedPrimaryName = await publicClient.readContract({
        address: resolverAddress,
        abi: CONTRACT_ABIS.ApolloIDResolver,
        functionName: "name",
        args: [user],
      }).catch(() => null);

      for (const tokenIdStr of candidateIds) {
        const tokenId = BigInt(tokenIdStr);
        try {
          const ownerNow = await publicClient.readContract({
            address: tokenAddress,
            abi: CONTRACT_ABIS.ApolloIDToken,
            functionName: "ownerOf",
            args: [tokenId],
          });
          if (ownerNow?.toLowerCase() !== user?.toLowerCase()) continue;

          let name = null;
          const uri = await publicClient.readContract({
            address: tokenAddress,
            abi: CONTRACT_ABIS.ApolloIDToken,
            functionName: "tokenURI",
            args: [tokenId],
          });

          if (uri?.startsWith("data:application/json;base64,")) {
            const decoded = JSON.parse(atob(uri.split(",")[1]));
            name = decoded?.name?.trim();
          }

          if ((!name || !name.includes(".")) && cachedPrimaryName?.trim()) {
            const [pLabel, pTld] = cachedPrimaryName.split(".");
            if (pTld === currentTld) {
              const expectedId = tokenIdToBigInt(tokenIdFor(pLabel.toLowerCase(), pTld.toLowerCase()));
              if (expectedId === tokenId) name = cachedPrimaryName.trim();
            }
          }

          if (name) fetched.push({ tokenId: tokenIdStr, name });
        } catch (err) {
          console.debug("Skip token:", err);
        }
      }

      setDomains(fetched);

      const match = fetched.find((d) => d.name.toLowerCase() === initialDomainFull.toLowerCase());
      const fallback = match || fetched[0];
      handleDomainSelection(fallback?.name || "");
    } catch (err) {
      setDomainFetchStatus("Failed to load domains.");
      setDomains([]);
      handleDomainSelection("");
    } finally {
      setLoadingDomains(false);
    }
  }, [user, isConnected, publicClient, tokenAddress, resolverAddress, currentTld, handleDomainSelection, initialDomainFull]);

  useEffect(() => {
    if (isConnected) {
      fetchUserDomains();
    }
  }, [isConnected, fetchUserDomains]);



  // Transaction handling
  useEffect(() => {
    if (txSuccess && hash) {
      setTxHash(hash);
      setStatus("Domain renewed successfully!");
      fetchUserDomains(); // Refresh list
    }
    if (writeError) {
      let msg = writeError.shortMessage || writeError.message || "Transaction failed";
      
      // Handle specific error cases
      if (msg.toLowerCase().includes("user rejected")) {
        msg = "Transaction was rejected. Please try again.";
      } else if (msg.toLowerCase().includes("insufficient")) {
        msg = "Insufficient balance to complete this transaction.";
      } else if (msg.toLowerCase().includes("missing revert data")) {
        msg = "Transaction failed. This may be due to an invalid domain name, insufficient funds, or network issues. Please check your inputs and try again.";
      } else if (msg.toLowerCase().includes("execution reverted")) {
        msg = "Transaction failed. The contract execution was reverted. This may be due to invalid parameters or contract state.";
      }
      
      setStatus(msg);
    }
  }, [txSuccess, hash, writeError, fetchUserDomains]);

  const handleRenew = () => {
    if (!registrarAddress || !priceQuote?.totalPrice) {
      setStatus("Not connected to valid network");
      return;
    }

    const parsed = parseDomainInput(`${domainInput}.${selectedTld}`, selectedTld);
    const name = parsed.label.trim().toLowerCase();
    const tld = parsed.tld.trim().toLowerCase();
    
    // Validate domain name format
    if (!name || name.length === 0) {
      setStatus("Please select a valid domain");
      return;
    }
    
    // Check for valid characters (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9\-]+$/.test(name)) {
      setStatus("Domain name can only contain lowercase letters, numbers, and hyphens");
      return;
    }
    
    // Check for leading/trailing hyphens
    if (name.startsWith('-') || name.endsWith('-')) {
      setStatus("Domain name cannot start or end with a hyphen");
      return;
    }
    
    const value = BigInt(priceQuote.totalPrice);

    writeContract({
      address: registrarAddress,
      abi: registrarABI,
      functionName: "renew",
      args: [name, tld, years],
      value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="Renew container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Renew your domain</h1>
        <p className="subtext text-lg text-muted-foreground">Extend your ownership in a few clicks.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="col-span-1">
            <div className="p-4 border rounded-2xl bg-card/50">
              <h5 className="mb-3">Domain</h5>
              <div className="mb-3">
                <div className="refresh flex justify-between items-center">
                  <label className="block text-sm font-medium mb-0">Select your domain</label>
                  <Button variant="outline" size="sm" onClick={fetchUserDomains} disabled={loadingDomains}>
                    {loadingDomains ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                {loadingDomains && <p className="text-muted-foreground text-sm mb-0 mt-2">Loading your domains...</p>}
                {!loadingDomains && domainOptions.length === 0 && (
                  <p className="text-muted-foreground text-sm mb-0 mt-2">
                    {domainFetchStatus || "Connect wallet and refresh to load your domains."}
                  </p>
                )}
                {!loadingDomains && domainOptions.length > 0 && (
                  <select
                    className="w-full p-2 bg-background border rounded uppercase font-semibold mt-2"
                    value={selectedDomain}
                    onChange={(e) => handleDomainSelection(e.target.value)}
                  >
                    <option value="">-- Select a domain --</option>
                    {domainOptions.map((domain) => (
                      <option key={domain.tokenId} value={domain.name}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                )}
                {domainFetchStatus && !loadingDomains && <small className="text-warning block mt-2">{domainFetchStatus}</small>}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Extend by</label>
                <select className="w-full p-2 bg-background border rounded" value={years} onChange={async (e) => {
                  const newYears = Number(e.target.value);
                  setYears(newYears);
                  
                  // Refresh price quote when years change
                  if (domainInput && selectedTld) {
                    try {
                      setLoadingPrice(true);
                      const parsed = parseDomainInput(`${domainInput}.${selectedTld}`, selectedTld);
                      const quote = await fetchDomainQuote({
                        label: parsed.label,
                        tld: parsed.tld,
                        years: newYears,
                        isRegistration: false,
                      });
                      setPriceQuote(quote);
                    } catch (err) {
                      setStatus(err?.message || "Failed to load price quote");
                    } finally {
                      setLoadingPrice(false);
                    }
                  }
                }}>
                  {[1, 2, 3, 5, 10].map((val) => (
                    <option key={val} value={val}>
                      {val} {val === 1 ? "year" : "years"}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="Renewbtn w-full mt-3"
                variant="hero"
                disabled={!selectedDomain || loadingData || isRenewing || isConfirming}
                onClick={handleRenew}
              >
                {isRenewing || isConfirming ? "Renewing..." : "Renew Domain"}
              </Button>

              {status && <p className="text-sm mt-3 mb-0 text-muted-foreground">{status}</p>}
              {txHash && (
                <p className="text-success mt-2 text-sm mb-0">
                  Tx Hash:{" "}
                  <a href={`https://${currentTld === "zeus" ? "zeuschainscan.io" : "testnet.bscscan.com"}/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline">
                    View on Explorer
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="p-4 border rounded-2xl bg-card bg-opacity-50">
              <h5 className="mb-3">Domain status</h5>
              {loadingData && <p className="text-muted-foreground text-sm mb-0">Loading...</p>}
              {!loadingData && !domainState && <p className="text-sm mb-0">Select a domain to view details.</p>}
              {domainState && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-semibold">{domainState.normalizedLabel}.{domainState.tld}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-semibold break-all text-right max-w-[60%]">{domainState.ownerAddress || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry</span>
                    <span className="font-semibold">{formatExpiry(domainState.expiry)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolver</span>
                    <span className="font-semibold break-all text-right max-w-[60%]">{domainState.defaultResolver || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reverse record</span>
                    <span className="font-semibold">{domainState.reverseName || "Not set"}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border rounded-2xl bg-card bg-opacity-50 mt-4">
              <h5 className="mb-3">Renewal cost</h5>
              {loadingPrice && <p className="text-muted-foreground text-sm mb-0">Fetching price...</p>}
              {priceQuote && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price / year</span>
                    <span className="font-semibold text-primary">{formatPrice(priceQuote.pricePerYear, selectedTld)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total ({years} {years === 1 ? "year" : "years"})</span>
                    <span className="font-semibold text-primary">{formatPrice(priceQuote.totalPrice, selectedTld)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Renew;