// pages/Register.jsx
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


import {
  SUPPORTED_TLDS,
  parseDomainInput,
  fetchDomainQuote,
  fetchDomainState,
  formatPrice,
  formatExpiry,
  tokenIdFor,
  tokenIdToBigInt,
} from "@/lib/apolloId.js";
import { getContract } from "@/lib/contractConfig.js"; // 
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/ABI/constant.js"; // 

// Custom hook for debouncing values
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

const YEARS_OPTIONS = [1, 2, 3, 5, 10];
const BNB_CHAIN_ID = 97;

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialLabel = searchParams.get("name") || "";
  const initialTldParam = searchParams.get("tld") || "bnb";
  const initialTld = SUPPORTED_TLDS.includes(initialTldParam) ? initialTldParam : "bnb";

  const [domainInput, setDomainInput] = useState(initialLabel);
  const [selectedTld, setSelectedTld] = useState(initialTld);
  const [years, setYears] = useState(1);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [domainExpiry, setDomainExpiry] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [registrationSummary, setRegistrationSummary] = useState(null);
  
  // Debounce domain input to prevent excessive API calls when typing rapidly
  const debouncedDomainInput = useDebounce(domainInput, 500); // 500ms delay

  const { address: user, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { writeContract, data: hash, isPending: isRegistering, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  const targetChainId = BNB_CHAIN_ID;
  const isOnCorrectChain = chainId === targetChainId;

  const registrarAddress = CONTRACT_ADDRESSES[selectedTld]?.ApolloIDRegistrar;
  const registrarABI = CONTRACT_ABIS.ApolloIDRegistrar;

  // Quote + Expiry (bilkul old logic)
  useEffect(() => {
    if (!debouncedDomainInput) {
      setQuote(null);
      setQuoteError(null);
      setDomainExpiry(null);
      setIsExpired(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingQuote(true);
        setQuoteError(null);
        setDomainExpiry(null);
        setIsExpired(false);
        const parsed = parseDomainInput(`${debouncedDomainInput}.${selectedTld}`, selectedTld);
        const data = await fetchDomainQuote({ label: parsed.label, tld: parsed.tld, years, isRegistration: true });
        if (!cancelled) {
          setQuote(data);

          if (!data.available) {
            try {
              const registrar = await getContract("ApolloIDRegistrar", false);
              const tokenIdHex = tokenIdFor(data.label, data.tld);
              const tokenIdBigInt = tokenIdToBigInt(tokenIdHex);
              const expiry = await registrar.expiry(tokenIdBigInt);
              if (!cancelled && expiry) {  // Check if cancelled before using expiry
                const expiryTimestamp = Number(expiry) * 1000;
                const now = Date.now();
                setDomainExpiry(expiryTimestamp);
                setIsExpired(expiryTimestamp < now);
              }
            } catch (err) {
              if (!cancelled) {  // Only log if not cancelled
                console.debug("Failed to fetch expiry:", err);
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err?.message || "Unable to quote domain");
        }
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedDomainInput, selectedTld, years]);

  // Success handling
  useEffect(() => {
    if (txSuccess && hash && user) {
      setTxHash(hash);
      (async () => {
        const parsed = parseDomainInput(`${domainInput}.${selectedTld}`, selectedTld);
        const summary = await fetchDomainState({
          label: parsed.label.trim().toLowerCase(),
          tld: parsed.tld.trim().toLowerCase(),
          walletAddress: user,
        });
        setRegistrationSummary({ ...summary, txHash: hash });
      })();
    }
    if (writeError) {
      let msg = writeError.shortMessage || writeError.message || "Transaction failed";
      
      // Handle specific error cases
      if (msg.toLowerCase().includes("user rejected")) {
        msg = "Transaction was rejected. Please try again.";
      } else if (msg.toLowerCase().includes("insufficient funds")) {
        msg = "Insufficient balance to complete this transaction.";
      } else if (msg.toLowerCase().includes("missing revert data")) {
        msg = "Transaction failed. This may be due to an invalid domain name, insufficient funds, or network issues. Please check your inputs and try again.";
      } else if (msg.toLowerCase().includes("execution reverted")) {
        if (msg.toLowerCase().includes("only registrar") || msg.toLowerCase().includes("registrar")) {
          msg = "Registration failed: The registrar is not properly set. Please contact the administrator to set the registrar on the ApolloIDToken contract.";
        } else {
          msg = "Transaction failed. The contract execution was reverted. This may be due to invalid parameters or contract state.";
        }
      }
      
      setQuoteError(msg);
    }
  }, [txSuccess, hash, writeError, user, domainInput, selectedTld]);

  const availabilityLabel = useMemo(() => {
    if (!quote) return "Unknown";
    return quote.available ? "✔ Available" : "❌ Not Available";
  }, [quote]);

  const formatExpiryDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const options = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

 const handleRegister = () => {
  if (!isConnected) {
    setQuoteError("Please connect your wallet");
    return;
  }
  if (!isOnCorrectChain) {
    switchChain({ chainId: targetChainId });
    return;
  }
  if (!quote?.available || !registrarAddress) {
    setQuoteError("Domain not available");
    return;
  }
  
  const parsed = parseDomainInput(`${domainInput}.${selectedTld}`, selectedTld);
  const name = parsed.label.trim().toLowerCase();
  const tld = parsed.tld.trim().toLowerCase();
  
  // Validate domain name format
  if (!name || name.length === 0) {
    setQuoteError("Please enter a valid domain name");
    return;
  }
  
  // Check for valid characters (only lowercase letters, numbers, and hyphens)
  if (!/^[a-z0-9\-]+$/.test(name)) {
    setQuoteError("Domain name can only contain lowercase letters, numbers, and hyphens");
    return;
  }
  
  // Check for leading/trailing hyphens
  if (name.startsWith('-') || name.endsWith('-')) {
    setQuoteError("Domain name cannot start or end with a hyphen");
    return;
  }
  
  const value =
    typeof quote.totalPrice === "bigint"
      ? quote.totalPrice
      : BigInt(quote.totalPrice);

  // Get the appropriate resolver address for the current chain
  const resolverAddress = CONTRACT_ADDRESSES[selectedTld]?.ApolloIDResolver;
  
  writeContract({
    address: registrarAddress,
    abi: registrarABI,
    functionName: "register",
    args: [name, tld, years, ""],
    value,
    
  });
  
  // After registration, we should set the resolver in the registry
  // This will be handled by the contract, but we need to ensure it's working correctly
};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="register container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Register your domain</h1>
        <p className="subtext text-lg text-muted-foreground">
          Pick a name, choose your TLD, preview pricing, and register directly on-chain.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="col-span-1">
            <div className="p-4 border rounded-2xl bg-card/50">
              <h5 className="mb-3">Domain details</h5>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full p-2 bg-background border rounded"
                  placeholder="e.g., dex"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Top-level domain</label>
                <select
                  className="w-full p-2 bg-background border rounded uppercase font-semibold"
                  value={selectedTld}
                  onChange={(e) => setSelectedTld(e.target.value)}
                >
                  {SUPPORTED_TLDS.map((tld) => (
                    <option key={tld} value={tld}>
                      .{tld}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Registration years</label>
                <select className="w-full p-2 bg-background border rounded" value={years} onChange={(e) => setYears(Number(e.target.value))}>
                  {YEARS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "year" : "years"}
                    </option>
                  ))}
                </select>
              </div>

              {!isOnCorrectChain && selectedTld && (
                <div className="mt-3 p-3 border rounded bg-warning/10">
                  <p className="text-warning text-sm mb-2">
                    {"You must be connected to BNB to register a .bnb domain."}
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => switchChain({ chainId: targetChainId })}
                    className="switchbtn w-full"
                  >
                    Switch to BNB Network
                  </Button>
                </div>
              )}

              <Button
                className="registerbtn w-full mt-3"
                variant="hero"
                disabled={(quote && !quote.available && !isExpired) || isRegistering || isConfirming || loadingQuote || !isOnCorrectChain || !isConnected}
                onClick={handleRegister}
                data-edge-warning="trigger"
              >
                {isRegistering || isConfirming ? "Registering..." : "Register Domain"}
              </Button>

              {quoteError && <p className="text-warning mt-3 text-sm">{quoteError}</p>}
              {txHash && (
                <p className="haxbox text-success mt-3 text-sm">
                  Tx Hash:{" "}
                  <a href={`https://testnet.bscscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="haxid underline">
                    {txHash}
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <div className="p-4 border rounded-2xl bg-card/50">
              <h5 className="mb-3">Quote</h5>
              {loadingQuote && <p className="text-muted-foreground text-sm">Fetching quote...</p>}
              {!loadingQuote && !quote && (
                <p className="text-sm">Enter a name to view pricing and availability.</p>
              )}
              {quote && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain name</span>
                    <span className="font-semibold text-foreground">
                      {quote.label}.{quote.tld}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-semibold ${quote.available ? "text-success" : "text-danger"}`}>
                      {availabilityLabel}
                    </span>
                  </div>
                  {!quote.available && (
                    <div className="mt-2">
                      <p className="text-warning text-sm mb-1">This domain is already registered.</p>
                      {domainExpiry && (
                        <p className="text-muted-foreground text-sm">
                          {isExpired ? (
                            <span className="text-danger">This domain has expired and can be claimed.</span>
                          ) : (
                            <>Expiration date: <span className="font-semibold">{formatExpiryDate(domainExpiry)}</span></>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price / year</span>
                    <span className="font-semibold text-primary">{formatPrice(quote.pricePerYear, quote.tld)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total ({years} {years === 1 ? "year" : "years"})</span>
                    <span className="font-semibold text-primary">{formatPrice(quote.totalPrice, quote.tld)}</span>
                  </div>
                  {(quote.expiry || quote.available) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{quote.available ? "Estimated expiry" : "Current expiry"}</span>
                      <span className="font-semibold">
                        {quote.available
                          ? formatExpiry(Math.floor(Date.now() / 1000) + years * 31536000)
                          : formatExpiry(quote.expiry)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Success summary  */}
            {registrationSummary && (
              <div className="p-4 border rounded-2xl bg-success/10 mt-4">
                <h5 className="mb-3 text-success">Domain Registered!</h5>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-semibold text-foreground">
                      {registrationSummary.normalizedLabel}.{registrationSummary.tld}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2" style={{ minWidth: 0 }}>
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-semibold truncate text-end" style={{ maxWidth: "70%" }}>
                      {registrationSummary.ownerAddress || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry</span>
                    <span className="font-semibold">{formatExpiry(registrationSummary.expiry)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2" style={{ minWidth: 0 }}>
                    <span className="text-muted-foreground">Resolver Address</span>
                    <span className="font-semibold truncate text-end" style={{ maxWidth: "70%" }}>
                      {registrationSummary.registryResolver || registrationSummary.defaultResolver || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reverse Record</span>
                    <span className="font-semibold break-all">{registrationSummary.reverseName || "Not set"}</span>
                  </div>
                  <Button asChild variant="electric" className="mt-3">
                    <Link
                      to={`/renew?name=${registrationSummary.normalizedLabel}&tld=${registrationSummary.tld}`}
                    >
                      Renew Domain
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
