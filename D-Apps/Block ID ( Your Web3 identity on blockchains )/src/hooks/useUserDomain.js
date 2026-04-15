import { useEffect, useState } from "react";
import { getContract, subscribeWalletEvents } from "@/lib/contractConfig.js";

/**
 * Custom hook to fetch and display the user's domain name from ApolloIDResolver
 * Returns the domain name (e.g., ".apollo") or empty string if not set
 * Auto-refreshes on wallet/chain changes
 */
export function useUserDomain(userAddress) {
  const [domainName, setDomainName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDomainName = async (address) => {
    if (!address) {
      setDomainName("");
      return;
    }

    try {
      setIsLoading(true);
      // Get resolver contract (read-only, no signer needed)
      const resolver = await getContract("ApolloIDResolver", false);
      
      // Call resolver.name(address) to get the domain name
      const name = await resolver.name(address);
      
      // If name is empty string, treat as no domain set
      if (name && typeof name === "string" && name.trim() !== "") {
        setDomainName(name.trim());
      } else {
        setDomainName("");
      }
    } catch (err) {
      // Silently handle errors - don't break the app
      // This could happen if:
      // - Contract not deployed on chain
      // - Address not set in resolver
      // - Network issues
      setDomainName("");
      // Optional: uncomment for debugging
      // console.debug("Error fetching domain name:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch domain name when userAddress changes
  useEffect(() => {
    if (userAddress) {
      fetchDomainName(userAddress);
    } else {
      setDomainName("");
    }
  }, [userAddress]);

  // Subscribe to wallet events to auto-refresh
  useEffect(() => {
    const unsubscribe = subscribeWalletEvents({
      onAccountsChanged: (accounts) => {
        const newAddress = accounts?.[0] || null;
        // Account changed, fetch domain for new address
        if (newAddress) {
          fetchDomainName(newAddress);
        } else {
          setDomainName("");
        }
      },
      onChainChanged: () => {
        // Chain changed, refetch domain name (may be different resolver)
        // Small delay to ensure chain switch is complete
        setTimeout(() => {
          if (userAddress) {
            fetchDomainName(userAddress);
          } else {
            setDomainName("");
          }
        }, 500);
      },
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]); // fetchDomainName is stable enough for this use case

  // Expose refresh function for manual updates
  const refresh = () => {
    if (userAddress) {
      fetchDomainName(userAddress);
    }
  };

  return { domainName, isLoading, refresh };
}