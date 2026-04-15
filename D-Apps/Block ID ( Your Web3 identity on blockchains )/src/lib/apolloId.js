import { formatEther, keccak256, toUtf8Bytes, parseEther, Contract } from "ethers";
import { getContract, getContractForChain, nodeForDomain } from "@/lib/contractConfig.js";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/ABI/constant.js";

export const SUPPORTED_TLDS = ["bnb"];
const LABEL_REGEX = /^[a-z0-9-]+$/;

/* ------------------------------------------------------------------ */
/*  INPUT NORMALIZATION (FRONTEND ONLY)                                */
/* ------------------------------------------------------------------ */

export function normalizeLabelInput(raw = "") {
  const cleaned = (raw || "").trim().toLowerCase();
  if (!cleaned) {
    throw new Error("Enter a domain name");
  }
  if (!LABEL_REGEX.test(cleaned)) {
    throw new Error("Only lowercase letters, numbers and hyphens are allowed");
  }
  return cleaned;
}

export function parseDomainInput(rawName = "", fallbackTld = "bnb") {
  const input = (rawName || "").trim().toLowerCase();
  if (!input) {
    throw new Error("Enter a domain name");
  }

  let label = input;
  let tld = fallbackTld;

  if (input.includes(".")) {
    const [maybeLabel, maybeTld] = input.split(".").filter(Boolean);
    if (maybeLabel) label = maybeLabel;
    if (maybeTld) tld = maybeTld;
  }

  if (!SUPPORTED_TLDS.includes(tld)) {
    throw new Error(`Unsupported TLD. Choose from ${SUPPORTED_TLDS.join(", ")}`);
  }

  return {
    label: normalizeLabelInput(label),
    tld,
  };
}

/* ------------------------------------------------------------------ */
/*  TOKEN ID HELPERS                                                   */
/* ------------------------------------------------------------------ */

export function tokenIdFor(label, tld) {
  const normalized = `${label}.${tld}`.toLowerCase();
  return keccak256(toUtf8Bytes(normalized));
}

export function tokenIdToBigInt(tokenIdHex) {
  return BigInt(tokenIdHex);
}

async function getRegistrar(withSigner = false) {
  // This will now be called from fetchDomainState which uses chain-specific contracts
  throw new Error("getRegistrar should not be called directly. Use chain-specific contract initialization.");
}

async function getRegistrarForChain(chainName, withSigner = false) {
  return getContractForChain("ApolloIDRegistrar", chainName, withSigner);
}

/* ------------------------------------------------------------------ */
/*  DOMAIN QUOTE                                                       */
/* ------------------------------------------------------------------ */

export async function fetchDomainQuote({ label, tld, years = 1, isRegistration = false }) {
  // Use the same chain detection logic as the UI to ensure consistency
  const chainName = tld === "bnb" ? tld : null;
  if (!chainName) {
    throw new Error("Invalid TLD for chain detection");
  }
  
  // Get registrar contract for the specific chain
  const registrar = await getContractForChain("ApolloIDRegistrar", chainName, false);

  // ❗ normalizeName REMOVED — frontend normalization only
  const normalized = label.toLowerCase();

  // Determine availability based on context (registration vs renewal)
  let available = false;
  if (isRegistration) {
    try {
      // Always cross-check by checking token ownership, regardless of isAvailable result
      // This ensures we get accurate information about whether the domain is actually registered
      try {
        const token = await getContractForChain("ApolloIDToken", chainName, false);
        const tokenIdBigInt = tokenIdToBigInt(tokenIdFor(normalized, tld));
        const owner = await token.ownerOf(tokenIdBigInt);
        // If owner exists and is not a zero address, the domain is not available
        if (owner && owner !== "0x0000000000000000000000000000000000000000") {
          available = false;
        } else {
          // If no owner or zero address, the domain is available
          available = true;
        }
      } catch (ownerErr) {
        // If we can't get the owner (e.g., token doesn't exist), check isAvailable as fallback
        try {
          const isAvailableCheck = await registrar.isAvailable(normalized, tld);
          available = isAvailableCheck;
        } catch (fallbackErr) {
          // If both methods fail, default to not available
          available = false;
        }
      }
    } catch (err) {
      console.warn("Could not determine domain availability, defaulting to not available");
      available = false;
    }
  }

  // Get the price per year using the priceFor method
  // For registration, we might want to use a different method or default price
  let pricePerYear;
  try {
    pricePerYear = await registrar.priceFor(normalized, tld, 1);
    
    // Check if the price is unreasonably large (likely due to contract misconfiguration)
    // If price is larger than 100 ETH in wei, use fallback of 0.01 ETH
    const maxReasonablePrice = parseEther("100");
    if (BigInt(pricePerYear) > maxReasonablePrice) {
      console.warn("Contract returned unreasonably large price, using fallback");
      pricePerYear = parseEther("0.01");
    }
  } catch (err) {
    // Fallback price if contract call fails
    pricePerYear = parseEther("0.01");
  }
  
  // Calculate total price by multiplying price per year by number of years
  const totalPrice = BigInt(pricePerYear) * BigInt(years);

  let expiry = null;
  try {
    const tokenIdHex = tokenIdFor(normalized, tld);
    const expiryValue = await registrar.expiry(tokenIdToBigInt(tokenIdHex));
   if (expiryValue && expiryValue > 0n) {
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  expiry =
    expiryValue < maxSafe
      ? Number(expiryValue)
      : null;
} else {
  expiry = null;
}

  } catch (_) {
    expiry = null;
  }

  return {
    label: normalized,
    tld,
    years,
    available,
    pricePerYear,
    totalPrice,
    expiry,
  };
}

/* ------------------------------------------------------------------ */
/*  PRICE FORMATTER                                                    */
/* ------------------------------------------------------------------ */

export function formatPrice(value, tld) {
  if (value === null || value === undefined) return "-";

  try {
    let symbol;
    if (String(tld).toLowerCase() === "bnb") {
      symbol = "tBNB";
    } else {
      symbol = "tBNB";
    }

    const eth = Number(formatEther(value));

    return `${eth.toFixed(4)} ${symbol}`;
  } catch (_) {
    return "-";
  }
}


/* ------------------------------------------------------------------ */
/*  RENEW DOMAIN                                                       */
/* ------------------------------------------------------------------ */

export async function renewDomain({ label, tld, years = 1, overrides = null }) {
  // Use the same chain detection logic as the UI to ensure consistency
  const chainName = tld === "bnb" ? tld : null;
  if (!chainName) {
    throw new Error("Invalid TLD for chain detection");
  }
  
  // Get registrar contract for the specific chain with signer
  const registrar = await getContractForChain("ApolloIDRegistrar", chainName, true);

  // ❗ normalizeName REMOVED
  const normalized = label.toLowerCase();

  // Get price per year and calculate total price
  let pricePerYear = await registrar.priceFor(normalized, tld, 1);
  
  // Check if the price is unreasonably large (likely due to contract misconfiguration)
  // If price is larger than 100 ETH in wei, use fallback of 0.01 ETH
  const maxReasonablePrice = parseEther("100");
  if (BigInt(pricePerYear) > maxReasonablePrice) {
    console.warn("Contract returned unreasonably large price, using fallback");
    pricePerYear = parseEther("0.01");
  }
  
  const totalPrice = BigInt(pricePerYear) * BigInt(years);
  
  const txOverrides =
    overrides && typeof overrides === "object"
      ? overrides
      : { value: totalPrice };

  const tx = await registrar.renew(normalized, tld, years, txOverrides);

  return {
    tx,
    normalized,
    totalPrice: txOverrides.value,
    tokenIdHex: tokenIdFor(normalized, tld),
  };
}

/* ------------------------------------------------------------------ */
/*  DOMAIN STATE                                                       */
/* ------------------------------------------------------------------ */

export async function fetchDomainState({ label, tld, walletAddress }) {
  // Use the same chain detection logic as the UI to ensure consistency
  const chainName = tld === "bnb" ? tld : null;
  if (!chainName) {
    throw new Error("Invalid TLD for chain detection");
  }
  
  // Get contracts for the specific chain sequentially to avoid race conditions
  const token = await getContractForChain("ApolloIDToken", chainName, false);
  const registry = await getContractForChain("ApolloIDRegistry", chainName, false);
  const resolver = await getContractForChain("ApolloIDResolver", chainName, false);

  const registrar = await getRegistrarForChain(chainName, false);

  const normalizedLabel = label.toLowerCase();
  const tokenIdHex = tokenIdFor(normalizedLabel, tld);
  const tokenIdBigInt = tokenIdToBigInt(tokenIdHex);

  const node = nodeForDomain(normalizedLabel, tld);

  // Make contract calls sequentially to avoid race conditions
  let ownerAddress = null;
  let expiryRaw = null;
  let registryResolver = null;
  let resolvedAddress = null;
  let reverseName = null;

  try {
    ownerAddress = await token.ownerOf(tokenIdBigInt);
    // Validate that the owner address is a proper Ethereum address
    if (ownerAddress && typeof ownerAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
      // Only process if it's a valid address format
      if (ownerAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
        ownerAddress = null; // Treat zero address as null
      }
    } else {
      ownerAddress = null; // Invalid address format
    }
  } catch (err) {
    console.debug('Failed to fetch owner address:', err);
    ownerAddress = null;
  }

  try {
    expiryRaw = await registrar.expiry(tokenIdBigInt);
    // Validate expiry value
    if (expiryRaw && typeof expiryRaw === 'bigint' && expiryRaw > 0n && !isNaN(Number(expiryRaw))) {
      // Valid expiry value
    } else {
      expiryRaw = null;
    }
  } catch (err) {
    console.debug('Failed to fetch expiry:', err);
    expiryRaw = null;
  }

  try {
    registryResolver = await registry.resolver(node);
    // Validate registry resolver address
    if (registryResolver && typeof registryResolver === 'string' && /^0x[a-fA-F0-9]{40}$/.test(registryResolver)) {
      // Only process if it's a valid address format
      if (registryResolver.toLowerCase() === "0x0000000000000000000000000000000000000000") {
        registryResolver = null; // Treat zero address as null
      }
    } else {
      registryResolver = null; // Invalid address format
    }
  } catch (err) {
    console.debug('Failed to fetch registry resolver:', err);
    registryResolver = null;
  }

  // Use the domain-specific resolver if available, otherwise fall back to global resolver
  let domainResolver = resolver; // Default to global resolver
  if (registryResolver && registryResolver !== "0x0000000000000000000000000000000000000000") {
    try {
      // Create a contract instance for the domain-specific resolver
      domainResolver = new Contract(registryResolver, CONTRACT_ABIS.ApolloIDResolver, resolver.runner);
    } catch (err) {
      console.debug('Failed to create domain-specific resolver:', err);
      // Fallback to global resolver
      domainResolver = resolver;
    }
  }

  try {
    resolvedAddress = await domainResolver.addr(node);
    // Validate resolved address
    if (resolvedAddress && typeof resolvedAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(resolvedAddress)) {
      // Only process if it's a valid address format
      if (resolvedAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
        resolvedAddress = null; // Treat zero address as null
      }
    } else {
      resolvedAddress = null; // Invalid address format
    }
  } catch (err) {
    console.debug('Failed to fetch resolved address:', err);
    resolvedAddress = null;
  }

  // Fetch reverse record (primary name) for the domain owner, not the connected wallet
  if (ownerAddress) {
    try {
      reverseName = await resolver.name(ownerAddress);
      // Validate that we got a meaningful response
      if (reverseName && typeof reverseName === 'string' && reverseName.trim().length > 0) {
        if (reverseName !== "0x0000000000000000000000000000000000000000") {
          reverseName = reverseName.trim();
        } else {
          reverseName = null; // Treat hex string as null
        }
      } else {
        reverseName = null;
      }
    } catch (err) {
      console.debug('Failed to fetch reverse name:', err);
      reverseName = null;
    }
  }

  // Process and validate the results
  const processedExpiry = 
    expiryRaw && expiryRaw > 0n && !isNaN(Number(expiryRaw))
      ? Number(expiryRaw)
      : null;

  // Get the default resolver address for the chain
  const defaultResolverAddress = CONTRACT_ADDRESSES?.[chainName]?.ApolloIDResolver;
  
  return {
    normalizedLabel,
    tld,
    tokenIdHex,
    ownerAddress,
    expiry: processedExpiry,
    resolvedAddress,
    registryResolver,
    defaultResolver: defaultResolverAddress, // Add the default resolver address for the chain
    reverseName,
  };
}


/* ------------------------------------------------------------------ */
/*  EXPIRY FORMATTER                                                   */
/* ------------------------------------------------------------------ */

export function formatExpiry(expirySeconds) {
  if (!expirySeconds || expirySeconds === "0") return "-";
  
  try {
    const numSeconds = Number(expirySeconds);
    if (Number.isNaN(numSeconds) || numSeconds <= 0) return "-";
    
    const ms = numSeconds * 1000;
    if (Number.isNaN(ms) || ms <= 0) return "-";
    
    const date = new Date(ms);
    // Check if date is valid
    if (date.toString() === "Invalid Date" || date.getFullYear() < 1970) return "-";
    
    // Format as "M/d/yyyy, h:mm:ss AM/PM"
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch (err) {
    return "-";
  }
}