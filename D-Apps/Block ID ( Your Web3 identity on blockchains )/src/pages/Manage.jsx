// pages/Manage.jsx
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { tokenIdFor, tokenIdToBigInt } from "@/lib/apolloId.js";
import { useUserDomain } from "@/hooks/useUserDomain.js";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/ABI/constant.js";

const DEPLOYER_ADDRESS = "0x3630e465ed73ce2ddecca9cb87b58a48b6130e21".toLowerCase();

const Manage = () => {
  const { address: user, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");
  const [transferStatus, setTransferStatus] = useState(null);

  const [selectedPrimaryDomain, setSelectedPrimaryDomain] = useState("");
  const [currentPrimaryDomain, setCurrentPrimaryDomain] = useState("");
  const [primaryDomainStatus, setPrimaryDomainStatus] = useState(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);

  // Current chain detection
  const currentTld = chainId === 97 ? "bnb" : null;
  const tokenAddress = currentTld ? CONTRACT_ADDRESSES[currentTld]?.ApolloIDToken : null;
  const resolverAddress = currentTld ? CONTRACT_ADDRESSES[currentTld]?.ApolloIDResolver : null;
  const registrarAddress = currentTld ? CONTRACT_ADDRESSES[currentTld]?.ApolloIDRegistrar : null;
  const registrarABI = CONTRACT_ABIS.ApolloIDRegistrar;
  const tokenABI = CONTRACT_ABIS.ApolloIDToken;

  // Header ke liye primary domain
  const { domainName: headerDomainName, refresh: refreshHeaderDomain } = useUserDomain(user);

  // Fetch current primary domain
  const fetchCurrentPrimaryDomain = useCallback(async () => {
    if (!user || !publicClient || !resolverAddress) {
      setCurrentPrimaryDomain("");
      return;
    }
    try {
      const name = await publicClient.readContract({
        address: resolverAddress,
        abi: CONTRACT_ABIS.ApolloIDResolver,
        functionName: "name",
        args: [user],
      });
      setCurrentPrimaryDomain(name?.trim() || "");
    } catch {
      setCurrentPrimaryDomain("");
    }
  }, [user, publicClient, resolverAddress]);

  useEffect(() => {
    fetchCurrentPrimaryDomain();
  }, [fetchCurrentPrimaryDomain]);

  const fetchDomains = useCallback(async () => {
    if (!user || !isConnected || !publicClient || !tokenAddress || !resolverAddress) {
      setDomains([]);
      return;
    }

    try {
      setLoading(true);

      const logs = await publicClient.getLogs({
        address: tokenAddress,
        event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"), 
        args: { to: user },
        fromBlock: 0n,
        toBlock: "latest",
      });
      
      const candidateIds = new Set(logs.map((log) => log.args.tokenId.toString()));
      const fetched = [];
      const primaryName = await publicClient.readContract({
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
            abi: tokenABI,
            functionName: "ownerOf",
            args: [tokenId],
          });
          if (ownerNow?.toLowerCase() !== user?.toLowerCase()) continue;
      
          let name = null;
          const uri = await publicClient.readContract({
            address: tokenAddress,
            abi: tokenABI,
            functionName: "tokenURI",
            args: [tokenId],
          }).catch(() => null);
      
          if (uri?.startsWith("data:application/json;base64,")) {
            try {
              const decoded = JSON.parse(atob(uri.split(",")[1]));
              name = decoded?.name?.trim();
            } catch {}
          }
      
          if ((!name || !name.includes(".")) && primaryName?.trim()) {
            const [label, tld] = primaryName.split(".");
            if (tld === currentTld) {
              const expectedId = tokenIdToBigInt(tokenIdFor(label.toLowerCase(), tld.toLowerCase()));
              if (expectedId === tokenId) name = primaryName.trim();
            }
          }
      
          // Find the transaction hash for this specific token transfer
          const logForToken = logs.find(log => log.args.tokenId.toString() === tokenIdStr);
          const transactionHash = logForToken ? logForToken.transactionHash : null;
      
          fetched.push({
            tokenId: tokenIdStr,
            name: name || null,
            contractAddress: tokenAddress,
            transactionHash: transactionHash,
          });
        } catch (err) {
          fetched.push({ 
            tokenId: tokenIdStr, 
            name: null,
            transactionHash: null,
          });
        }
      }

      setDomains(fetched);
    } catch (err) {
      console.error("Fetch domains error:", err);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  }, [user, isConnected, publicClient, tokenAddress, resolverAddress, currentTld]);

  // Transfer domain
  const transfer = () => {
    if (!transferTo || !transferTokenId) {
      setTransferStatus("Fill both fields");
      return;
    }
    writeContract({
      address: tokenAddress,
      abi: tokenABI,
      functionName: "safeTransferFrom",
      args: [user, transferTo, BigInt(transferTokenId)],
    });
  };

  // Set primary domain
  const setPrimaryDomain = () => {
    if (!selectedPrimaryDomain || !registrarAddress) {
      setPrimaryDomainStatus("Select domain or check network");
      return;
    }
    setIsSettingPrimary(true);
    setPrimaryDomainStatus(null);
    writeContract({
      address: registrarAddress,
      abi: registrarABI,
      functionName: "setPrimaryDomain",
      args: [selectedPrimaryDomain],
    });
  };

  // Transaction handling
  useEffect(() => {
    if (txSuccess && hash) {
      if (isWriting && transferTokenId) {
        setTransferStatus("Transferred successfully!");
        setTransferTo("");
        setTransferTokenId("");
        fetchDomains();
      } else if (isSettingPrimary) {
        setCurrentPrimaryDomain(selectedPrimaryDomain);
        setPrimaryDomainStatus("Primary domain set successfully!");
        setSelectedPrimaryDomain("");
        setTimeout(() => {
          fetchCurrentPrimaryDomain();
          if (refreshHeaderDomain) refreshHeaderDomain();
        }, 2000);
      }
    }
    if (writeError) {
      const msg = writeError.shortMessage || writeError.message || "Transaction failed";
      if (transferTokenId) setTransferStatus(msg);
      else if (isSettingPrimary) setPrimaryDomainStatus(msg);
    }
  }, [txSuccess, hash, writeError, isWriting, isSettingPrimary, transferTokenId, fetchDomains, fetchCurrentPrimaryDomain, refreshHeaderDomain, selectedPrimaryDomain]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="Managepg innerpage container mx-auto px-4 py-5" style={{ paddingTop: '6rem' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Manage Your Identity</h1>
        <p className="text-lg text-muted-foreground">
          Control your decentralized identity with our intuitive management dashboard.
        </p>

        <div className="mt-4 flex gap-2 flex-wrap">
          <Button onClick={fetchDomains} disabled={loading}>
            {loading ? "Loading..." : "Fetch My Domains"}
          </Button>
        </div>

        <div className="mt-3">
          {domains.length === 0 && <small className="text-muted">No domains found yet.</small>}
          {domains.length > 0 && (
            <div className="p-4 border rounded" style={{ backgroundColor: 'hsl(var(--card) / 0.3)' }}>
              <h5 className="mb-3">My Domains</h5>
              <div className="flex flex-col gap-3">
                {domains.map((d) => (
                  <div key={d.tokenId} className="pb-3 border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                    {d.name ? (
                      <div className="font-bold text-xl text-primary mb-2">{d.name}</div>
                    ) : (
                      <div className="text-muted small mb-2">Name not available</div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-sm flex-shrink-0">Token ID: </span>
                        <div className="flex items-center gap-1 flex-1">
                          <a 
                            href={`https://testnet.bscscan.com/token/${d.contractAddress}?id=${d.tokenId}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline flex-shrink-1"
                          >
                            {d.tokenId}
                          </a>
                          <button 
                            className="copybutton p-1 m-0 border"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(d.tokenId);
                            }}
                            title="Copy token ID to clipboard"
                            style={{ backgroundColor: 'transparent', color: 'white', fontSize: '0.8rem', lineHeight: '1', cursor: 'pointer' }}
                          >
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="icon-white">
                        <path d="M384 96L384 0H64C28.7 0 0 28.7 0 64v320h96V128c0-17.7 14.3-32 32-32h256zM448 128H160c-17.7 0-32 14.3-32 32v320c0 17.7 14.3 32 32 32h288c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32z"/>
                        </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-sm flex-shrink-0">Contract: </span>
                        <div className="flex items-center gap-1 flex-1">
                          <a 
                            href={`https://testnet.bscscan.com/token/${d.contractAddress}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline flex-shrink-1"
                          >
                            {d.contractAddress?.slice(0, 6)}...{d.contractAddress?.slice(-4)}
                          </a>
                          <button 
                            className="copybutton p-1 m-0 border"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(d.contractAddress);
                            }}
                            title="Copy address to clipboard"
                            style={{ backgroundColor: 'transparent', color: 'white', fontSize: '0.8rem', lineHeight: '1', cursor: 'pointer' }}
                          >
                        <svg xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="icon-white">
                        <path d="M384 96L384 0H64C28.7 0 0 28.7 0 64v320h96V128c0-17.7 14.3-32 32-32h256zM448 128H160c-17.7 0-32 14.3-32 32v320c0 17.7 14.3 32 32 32h288c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32z"/>
                        </svg>


                          </button>
                        </div>
                      </div>
                      {d.transactionHash && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-sm flex-shrink-0">Transaction: </span>
                          <div className="flex items-center gap-1 flex-1">
                            <a 
                              href={`https://testnet.bscscan.com/tx/${d.transactionHash}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-primary underline flex-shrink-1"
                            >
                              {d.transactionHash?.slice(0, 6)}...{d.transactionHash?.slice(-4)}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Set Primary Domain */}
        {domains.length > 0 && (
          <div className="mt-5">
            <h5>Set Primary Domain</h5>
            <p className="text-muted small mb-3">
              Choose which domain will be displayed as your primary identity.
              {currentPrimaryDomain && (
                <span className="block mt-1">
                  Current: <span className="font-bold text-primary">{currentPrimaryDomain}</span>
                </span>
              )}
            </p>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-grow-1 w-full" style={{ maxWidth: "400px" }}>
                <label className="form-label text-sm text-muted">Select Domain</label>
                <select
                  className="w-full p-2 bg-background border rounded"
                  value={selectedPrimaryDomain}
                  onChange={(e) => setSelectedPrimaryDomain(e.target.value)}
                  disabled={isSettingPrimary}
                >
                  <option value="">-- Select a domain --</option>
                  {domains.filter((d) => d.name).map((d) => (
                    <option key={d.tokenId} value={d.name}>
                      {d.name} {currentPrimaryDomain === d.name && "(Current)"}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={setPrimaryDomain}
                disabled={!selectedPrimaryDomain || isSettingPrimary || selectedPrimaryDomain === currentPrimaryDomain}
                className="w-auto"
              >
                {isSettingPrimary ? "Setting..." : "Set as Primary"}
              </Button>
            </div>
            {primaryDomainStatus && (
              <div className={`mt-2 small ${primaryDomainStatus.includes("successfully") ? "text-success" : "text-warning"}`}>
                {primaryDomainStatus}
              </div>
            )}
          </div>
        )}

        {/* Transfer Domain */}
        <div className="mt-4">
          <h5>Transfer Domain</h5>
          <div className="flex flex-col md:flex-row gap-2 flex-wrap">
            <input
              className="flex-1 p-2 bg-background border rounded"
              placeholder="Recipient address"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            />
            <input
              className="flex-1 p-2 bg-background border rounded"
              placeholder="Token ID"
              value={transferTokenId}
              onChange={(e) => setTransferTokenId(e.target.value)}
            />
            <Button onClick={transfer} disabled={isWriting || isConfirming} className="w-auto">
              {isWriting || isConfirming ? "Transferring..." : "Transfer"}
            </Button>
          </div>
          {transferStatus && (
            <div className="mt-2 small text-muted">{transferStatus}</div>
          )}
        </div>

        {/* Admin section commented as in your code */}
        {/* {isRegistrarOwner && ( ... )} */}
      </div>
      <Footer />
    </div>
  );
};

export default Manage;