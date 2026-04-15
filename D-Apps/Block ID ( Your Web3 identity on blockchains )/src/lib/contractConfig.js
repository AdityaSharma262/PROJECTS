import {
  BrowserProvider,
  Contract,
  keccak256,
  id,
  concat,
  ZeroAddress,
} from "ethers";

// ✅ RELATIVE import (alias confusion खत्म)
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAME,
} from "../ABI/constant.js";

/* ------------------------------------------------------------------ */
/*  PROVIDER (Apollo Wallet first, MetaMask fallback)                  */
/* ------------------------------------------------------------------ */

function getInjectedProvider() {
  if (window.apolloWallet) return window.apolloWallet;
  if (window.myCustomWallet) return window.myCustomWallet;
  if (window.ethereum) return window.ethereum;
  return null;
}

export async function getProvider() {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("No wallet provider found");
  }
  return new BrowserProvider(injected);
}

export async function getSigner() {
  const provider = await getProvider();
  return await provider.getSigner();
}

/* ------------------------------------------------------------------ */
/*  CHAIN DETECTION (lowercase-safe)                                   */
/* ------------------------------------------------------------------ */

export async function getChainName() {
  const injected = getInjectedProvider();
  if (!injected) return null;

  const provider = new BrowserProvider(injected);
  const network = await provider.getNetwork();

  const rawChainId = network.chainId;
  const chainIdNum =
    typeof rawChainId === "bigint"
      ? Number(rawChainId)
      : typeof rawChainId === "string"
      ? parseInt(rawChainId, 16)
      : Number(rawChainId);

  console.log("[ApolloID] chainId:", chainIdNum);
  console.log("[ApolloID] CHAIN_NAME:", CHAIN_NAME);

  // ✅ returns "bnb"
  return CHAIN_NAME[chainIdNum] || null;
}

/* ------------------------------------------------------------------ */
/*  CONTRACT HELPERS                                                   */
/* ------------------------------------------------------------------ */

export async function getContractAddress(contractName) {
  const chainName = await getChainName(); // bnb
  
  if (!chainName) {
    throw new Error("Unsupported or unknown chain");
  }

  const addr = CONTRACT_ADDRESSES?.[chainName]?.[contractName];

  if (!addr) {
    throw new Error(
      `Contract address not found for ${contractName} on ${chainName}`
    );
  }

  return addr;
}

export async function getContract(contractName, withSigner = true) {
  const address = await getContractAddress(contractName);
  const abi = CONTRACT_ABIS[contractName];

  if (!abi) {
    throw new Error(`ABI not found for ${contractName}`);
  }

  const provider = await getProvider();

  if (withSigner) {
    const signer = await provider.getSigner();
    return new Contract(address, abi, signer);
  }

  return new Contract(address, abi, provider);
}

// Helper function to get contract for a specific chain
export async function getContractForChain(contractName, chainName, withSigner = true) {
  if (!chainName) {
    throw new Error("Chain name is required");
  }

  const addr = CONTRACT_ADDRESSES?.[chainName]?.[contractName];
  if (!addr) {
    throw new Error(
      `Contract address not found for ${contractName} on ${chainName}`
    );
  }

  const abi = CONTRACT_ABIS[contractName];
  if (!abi) {
    throw new Error(`ABI not found for ${contractName}`);
  }

  const provider = await getProvider();

  if (withSigner) {
    const signer = await provider.getSigner();
    return new Contract(addr, abi, signer);
  }

  return new Contract(addr, abi, provider);
}

/* ------------------------------------------------------------------ */
/*  ENS-style helpers                                                  */
/* ------------------------------------------------------------------ */

export function labelhash(label) {
  return id(label);
}

export function namehash(name) {
  let node = "0x" + "00".repeat(32);
  if (!name) return node;

  const labels = name.split(".").filter(Boolean).reverse();
  for (const label of labels) {
    const lh = labelhash(label);
    node = keccak256(concat([node, lh]));
  }
  return node;
}

export function nodeForDomain(label, tld) {
  const parentNode = namehash(tld);
  const lh = labelhash(label);
  return keccak256(concat([parentNode, lh]));
}

/* ------------------------------------------------------------------ */
/*  Wallet events                                                      */
/* ------------------------------------------------------------------ */

export function subscribeWalletEvents({ onAccountsChanged, onChainChanged } = {}) {
  const injected = getInjectedProvider();
  if (!injected?.on) return () => {};

  const handleAccounts = (accounts) => {
    if (onAccountsChanged) onAccountsChanged(accounts);
  };

  const handleChain = (chainId) => {
    if (onChainChanged) onChainChanged(chainId);
  };

  injected.on("accountsChanged", handleAccounts);
  injected.on("chainChanged", handleChain);

  return () => {
    if (injected.removeListener) {
      injected.removeListener("accountsChanged", handleAccounts);
      injected.removeListener("chainChanged", handleChain);
    }
  };
}

export const zeroAddress = ZeroAddress;
export { ZeroAddress };