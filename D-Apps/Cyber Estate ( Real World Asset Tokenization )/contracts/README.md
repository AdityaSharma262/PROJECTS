# RWA Tokenization Smart Contracts

## Overview

Seven Solidity smart contracts for tokenizing real-world assets on BNB Smart Chain (BSC Testnet).

## Contracts

### Core Token Contracts

#### 1. RWAYieldToken.sol (ERC-20)
- **Purpose**: Tokenized yield-bearing assets (treasury funds, bonds)
- **Key Features**: Owner-only mint/burn, pausable, yield distribution to holders
- **Standard**: ERC-20 (OpenZeppelin)

#### 2. RWAAssetToken.sol (ERC-1155)
- **Purpose**: Fractional ownership of real-world assets (real estate, commodities)
- **Key Features**: Multi-token (each ID = different asset), admin minting, transfer restrictions, on-chain metadata
- **Standard**: ERC-1155 (OpenZeppelin)

#### 3. RWASecurityToken.sol (ERC-3643/1400 inspired)
- **Purpose**: Compliant security token with investor verification
- **Key Features**: KYC whitelist, compliance checks before transfer, jurisdiction restrictions, investment limits
- **Standard**: ERC-20 with ERC-3643 compliance layer

### Platform Contracts

#### 4. RWAMarketplace.sol
- **Purpose**: P2P secondary market for trading tokenized RWAs
- **Key Features**: Escrow-based order book, partial fills, platform fee (0.25%), KYC-gated, time-limited orders
- **Supports**: ERC-20 and ERC-1155 token trading

#### 5. KYCRegistry.sol
- **Purpose**: On-chain identity verification and compliance
- **Key Features**: KYC submission/approval/rejection flow, investor types (Retail/Accredited/Institutional), 365-day validity, jurisdiction restrictions
- **Integration**: Used by Marketplace and Security Token for access control

#### 6. RedemptionManager.sol
- **Purpose**: Token redemption with admin approval workflow
- **Key Features**: Request → Approve → Process flow, 1% fee, 7-day cooldown, native token (tBNB) and stablecoin payout options
- **Security**: Reentrancy protection, per-user cooldown enforcement

#### 7. RWAAssetFactory.sol
- **Purpose**: Factory for creating new tokenized asset offerings
- **Key Features**: Asset creation with admin approval, 0.5% creation fee, 8 asset classes, direct token purchase, metadata management
- **Asset Classes**: Real Estate, Commodity, Treasury, Infrastructure, Private Credit, Art, Carbon Credit, Other

---

## Deployment Guide (Remix IDE)

### Prerequisites
- MetaMask browser extension
- tBNB testnet funds (get from faucet: https://www.bnbchain.org/en/testnet-faucet)

### Step-by-Step

1. **Open Remix**: Go to https://remix.ethereum.org

2. **Create contract files**:
   - File Explorer → New File → paste each `.sol` file

3. **Compile**:
   - Compiler tab → Select `0.8.20`
   - Enable optimization (200 runs)
   - Click "Compile"

4. **Deploy**:
   - Deploy tab → Environment: "Injected Provider - MetaMask"
   - Ensure MetaMask is on BNB Smart Chain Testnet (chain ID 97)
   - Enter constructor arguments
   - Click "Deploy"

5. **Verify (optional)**:
   - Copy deployed address
   - Go to https://testnet.bscscan.com
   - Verify & Publish source code

### Deployment Order

1. **`KYCRegistry`** (no constructor args)
2. **`RWAYieldToken`** (`name`: "RWA Yield Token", `symbol`: "RWAYLD")
3. **`RWAAssetToken`** (`baseURI`: "https://api.cyberestate.io/metadata/")
4. **`RWASecurityToken`** (`name`: "RWA Security Token", `symbol`: "RWAST")
5. **`RWAMarketplace`** (`_kycRegistry`: KYCRegistry address)
6. **`RedemptionManager`** (`_kycRegistry`: KYCRegistry address, `_feeRecipient`: fee wallet address)
7. **`RWAAssetFactory`** (`_kycRegistry`: KYCRegistry address, `_assetToken`: RWAAssetToken address)

### Post-Deployment Linkage
To allow the Asset Factory to mint fractional tokens directly when users buy them:
- Call `RWAAssetToken.setAdmin(RWAAssetFactoryAddress, true)` from the owner wallet.

### Constructor Arguments Reference

| Contract | Constructor Arguments | Notes |
|----------|----------------------|-------|
| `KYCRegistry` | _(none)_ | Deploy first |
| `RWAYieldToken` | `name`: `"RWA Yield Token"`, `symbol`: `"RWAYLD"` | Yield-bearing ERC-20 |
| `RWAAssetToken` | `baseURI`: `"https://api.cyberestate.io/metadata/"` | Fractional ERC-1155 |
| `RWASecurityToken` | `name`: `"RWA Security Token"`, `symbol`: `"RWAST"` | ERC-3643 inspired |
| `RWAMarketplace` | `_kycRegistry`: `0xKYCRegistryAddress` | Secondary order book |
| `RedemptionManager` | `_kycRegistry`: `0xKYCRegistryAddress`, `_feeRecipient`: `0xFeeWalletAddress` | Redemption manager |
| `RWAAssetFactory` | `_kycRegistry`: `0xKYCRegistryAddress`, `_assetToken`: `0xRWAAssetTokenAddress` | Primary issuance factory |

---

## ⚡ 1-Click Remix Deployment & BscScan Verification

All contracts are also provided in **`contracts/deployable/`** as self-contained, standalone single-file contracts with zero external dependencies:

1. **Open Remix**: Go to [https://remix.ethereum.org](https://remix.ethereum.org).
2. Copy any file from `contracts/deployable/<ContractName>.sol` and paste into Remix.
3. Select **Solidity Compiler** `0.8.20` and click **Compile**.
4. In **Deploy & Run Transactions**, select **Injected Provider - MetaMask** (ensure connected to BSC Testnet, chain ID 97).
5. Enter constructor arguments and click **Deploy**.
6. **Instant BscScan Verification**:
   - Go to [https://testnet.bscscan.com](https://testnet.bscscan.com) and search your deployed contract address.
   - Click **Contract** → **Verify and Publish**.
   - Compiler Type: **Solidity (Single file)**.
   - Compiler Version: **v0.8.20**.
   - Open Source License Type: **MIT**.
   - Paste the exact contents of `contracts/deployable/<ContractName>.sol`.
   - Click **Verify and Publish** — it verifies with a green checkmark on the first try!

---

## Contract Interaction Examples

### RWAYieldToken

```javascript
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(ADDRESS, ABI, signer);

// Mint tokens (owner only)
await contract.mint("0xRecipient...", ethers.parseEther("1000"));

// Distribute yield
await contract.distributeYield(ethers.parseEther("100"));

// Claim yield (any holder)
await contract.claimYield();

// Check pending yield
const pending = await contract.earned("0xHolder...");
console.log("Pending yield:", ethers.formatEther(pending));
```

### RWAAssetToken

```javascript
// Mint tokens for an asset
await contract.mint("0xBuyer...", 1, 100, "0x");

// Restrict transfers for an asset
await contract.setTransferRestriction(1, true);
```

### RWAMarketplace

```javascript
// Place a sell order for ERC-20 tokens
await contract.placeERC20Order(
  tokenAddress,
  ethers.parseEther("100"),    // amount
  ethers.parseEther("50"),     // price per token
  true,                        // isSellOrder
  86400 * 30                   // duration (30 days)
);

// Fill an order
await contract.fillOrder(orderId, ethers.parseEther("50"), {
  value: ethers.parseEther("2500") // total price
});

// Cancel an order
await contract.cancelOrder(orderId);
```

### KYCRegistry

```javascript
// Submit KYC
await contract.submitKYC("US", 1, "QmDocumentHash...");

// Approve KYC (admin)
await contract.approveKYC(
  "0xInvestor...",
  "US",
  1,                            // Accredited
  ethers.parseEther("100000")   // investment limit
);

// Check verification
const verified = await contract.isVerified("0xInvestor...");
```

### RedemptionManager

```javascript
// Request redemption
await contract.requestRedemption(
  tokenAddress,
  ethers.parseEther("100"),
  0,                            // NativeToken payout
  ethers.ZeroAddress
);

// Approve redemption (admin)
await contract.approveRedemption(requestId);

// Estimate payout
const [gross, fee, net] = await contract.getEstimatedPayout(
  tokenAddress,
  ethers.parseEther("100")
);
```

### RWAAssetFactory

```javascript
// Create a new tokenized asset
const fee = await contract.getCreationFee(ethers.parseEther("25000000"));
await contract.createAsset({
  name: "Manhattan Office Tower",
  symbol: "MOT",
  assetClass: 0,                           // RealEstate
  location: "New York, USA",
  totalValue: ethers.parseEther("25000000"),
  tokenPrice: ethers.parseEther("50"),
  totalSupply: 500000,
  annualYieldBps: 800,                     // 8.00%
  maturityDate: 0,                         // open-ended
  metadataURI: "ipfs://metadata...",
  documentHash: "ipfs://documents..."
}, { value: fee });

// Buy tokens directly
await contract.buyTokens(assetId, 100, {
  value: ethers.parseEther("5000") // 100 * $50
});
```

---

## Updating Frontend Contract Addresses

After deploying, update `src/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  rwaYieldToken: "0x7f8a7ea393E40c7D314EF0B8dF3545292F1D7814",
  assetToken: "0x537E66288890e9825C9b0C85850373106285311D",
  securityToken: "0x9b4524ea7c4F75016fc774E3Ea1dF31230C4BB5D",
  marketplace: "0x9Ac8c7a2BB33bF67dB3Af762731c120e5863CE76",
  kycRegistry: "0xff6840c8A2C08093f57c4a7301Ed9f57D0D45D41",
  redemptionManager: "0xd72D9529874298B74612DF1160E68a8e691869bc",
  assetFactory: "0xcC8d63F00A7C4c8b5cb37a4a788726d6Cd9e20bE",
};
```

---

## Security Considerations

1. **Access Control**: All sensitive functions restricted to owner/admin
2. **Pausable**: Emergency pause mechanism on core token contracts
3. **Compliance**: Security token and marketplace enforce KYC before transactions
4. **Reentrancy**: OpenZeppelin ReentrancyGuard on RedemptionManager and Marketplace
5. **Escrow**: Marketplace locks funds in contract before settlement
6. **Upgradability**: Consider using proxy pattern for production deployments
7. **Audit**: Recommended third-party audit before mainnet deployment

## Testing

Use Remix's built-in testing or Hardhat/Foundry for comprehensive tests.
Recommended test cases:
- Mint/burn with correct permissions
- Transfer restrictions enforcement
- Yield distribution accuracy
- KYC whitelist enforcement
- Marketplace order lifecycle (place, fill, cancel)
- Redemption flow (request, approve, process)
- Factory asset creation and approval workflow
- Pause/unpause behavior
# RWA Tokenization Smart Contracts

## Overview
Three Solidity smart contracts for tokenizing real-world assets on EVM-compatible networks.

## Contracts

### 1. RWAYieldToken.sol (ERC-20)
- **Purpose**: Tokenized yield-bearing assets (treasury funds, bonds)
- **Key Features**: Owner-only mint/burn, pausable, yield distribution to holders
- **Standard**: ERC-20 (OpenZeppelin)

### 2. RWAAssetToken.sol (ERC-1155)
- **Purpose**: Fractional ownership of real-world assets (real estate, commodities)
- **Key Features**: Multi-token (each ID = different asset), admin minting, transfer restrictions, on-chain metadata
- **Standard**: ERC-1155 (OpenZeppelin)

### 3. RWASecurityToken.sol (ERC-3643/1400 inspired)
- **Purpose**: Compliant security token with investor verification
- **Key Features**: KYC whitelist, compliance checks before transfer, jurisdiction restrictions, investment limits
- **Standard**: ERC-20 with ERC-3643 compliance layer

---

## Deployment Guide (Remix IDE)

### Prerequisites
- MetaMask browser extension
- Sepolia ETH (get from faucet: https://sepoliafaucet.com)

### Step-by-Step

1. **Open Remix**: Go to https://remix.ethereum.org

2. **Create contract files**: 
   - File Explorer → New File → paste each `.sol` file

3. **Compile**:
   - Compiler tab → Select `0.8.20`
   - Enable optimization (200 runs)
   - Click "Compile"

4. **Deploy**:
   - Deploy tab → Environment: "Injected Provider - MetaMask"
   - Ensure MetaMask is on Sepolia network
   - Enter constructor arguments
   - Click "Deploy"

5. **Verify (optional)**:
   - Copy deployed address
   - Go to https://sepolia.etherscan.io
   - Verify & Publish source code

### Constructor Arguments

| Contract | Arguments |
|----------|-----------|
| RWAYieldToken | `name`: "RWA Yield Token", `symbol`: "RWAYLD" |
| RWAAssetToken | `baseURI`: "https://api.yourapp.com/metadata/" |
| RWASecurityToken | `name`: "RWA Security Token", `symbol`: "RWAST" |

---

## Contract Interaction Examples

### RWAYieldToken

```javascript
// Using ethers.js
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(ADDRESS, ABI, signer);

// Mint tokens (owner only)
await contract.mint("0xRecipient...", ethers.parseEther("1000"));

// Distribute yield
await contract.distributeYield(ethers.parseEther("100"));

// Claim yield (any holder)
await contract.claimYield();

// Check pending yield
const pending = await contract.earned("0xHolder...");
console.log("Pending yield:", ethers.formatEther(pending));
```

### RWAAssetToken

```javascript
// Create a new asset
const tx = await contract.createAsset(
  "Manhattan Office Tower",  // name
  "New York, USA",           // location
  ethers.parseEther("25000000"), // totalValue
  ethers.parseEther("50"),   // tokenPrice
  500000,                    // totalTokens
  "0xInitialHolder..."       // initialHolder
);

// Mint additional tokens
await contract.mint("0xBuyer...", 1, 100, "0x");

// Restrict transfers for an asset
await contract.setTransferRestriction(1, true);
```

### RWASecurityToken

```javascript
// Add investor to whitelist (after KYC)
await contract.addToWhitelist(
  "0xInvestor...",
  "US",                       // jurisdiction
  ethers.parseEther("100000") // investment limit
);

// Check if investor is verified
const isVerified = await contract.isVerified("0xInvestor...");

// Check if transfer is allowed
const [allowed, reason] = await contract.canTransfer(
  "0xFrom...", "0xTo...", ethers.parseEther("100")
);

// Issue tokens to verified investor
await contract.issue("0xInvestor...", ethers.parseEther("1000"));
```

---

## Updating Frontend Contract Addresses

After deploying, update `src/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  rwaYieldToken: "0xYOUR_DEPLOYED_ADDRESS",
  assetToken: "0xYOUR_DEPLOYED_ADDRESS",
  securityToken: "0xYOUR_DEPLOYED_ADDRESS",
};
```

---

## Security Considerations

1. **Access Control**: All sensitive functions restricted to owner/admin
2. **Pausable**: Emergency pause mechanism on all contracts
3. **Compliance**: Security token enforces KYC before any transfer
4. **Reentrancy**: Using OpenZeppelin's safe patterns
5. **Upgradability**: Consider using proxy pattern for production

## Testing

Use Remix's built-in testing or Hardhat/Foundry for comprehensive tests.
Recommended test cases:
- Mint/burn with correct permissions
- Transfer restrictions enforcement
- Yield distribution accuracy
- KYC whitelist enforcement
- Pause/unpause behavior
