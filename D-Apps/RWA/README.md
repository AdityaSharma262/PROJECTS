# Cyber Estate — RWA Tokenization Platform

A production-grade decentralized platform for tokenizing real-world assets (real estate, commodities, treasuries, infrastructure) on BNB Smart Chain.

## 📸 Preview

![RWA Platform Preview](./public/placeholder.svg)

> **Modern, enterprise-grade DeFi platform** with full RWA tokenization lifecycle, KYC compliance, and secondary market trading

## 🌟 Features

- **Marketplace** — Browse and invest in tokenized real-world assets with detailed analytics
- **Secondary Market (P2P)** — Place and fill orders for ERC-20/ERC-1155 tokens with escrow settlement
- **Portfolio Management** — Track holdings, claim yield, and redeem tokens with comprehensive charts
- **KYC/AML Compliance** — On-chain identity verification with jurisdiction-based restrictions and investor types
- **Tokenization Wizard** — Create new tokenized assets with configurable tokenomics and metadata
- **Admin Panel** — Manage whitelists, mint tokens, distribute yield, and approve redemptions
- **Wallet Integration** — MetaMask with auto-reconnect, network switching, and transaction management
- **Real-time Analytics** — Asset price charts, portfolio performance, and market statistics

## 🏗️ Project Structure

```
RWA/
├── contracts/                    # Smart contracts
│   ├── KYCRegistry.sol          # On-chain identity verification
│   ├── RWAAssetFactory.sol      # Factory for creating tokenized assets
│   ├── RWAAssetToken.sol        # ERC-1155 fractional ownership tokens
│   ├── RWAMarketplace.sol       # P2P secondary market
│   ├── RWASecurityToken.sol     # ERC-3643 compliant security token
│   ├── RWAYieldToken.sol        # ERC-20 yield-bearing tokens
│   ├── RedemptionManager.sol    # Token redemption workflow
│   └── README.md                # Smart contract documentation
├── src/                          # React frontend
│   ├── components/              # React UI components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── AssetCard.tsx        # Asset display card
│   │   ├── AssetPriceChart.tsx  # Price chart component
│   │   ├── BuyAssetDialog.tsx   # Purchase modal
│   │   ├── ClaimYieldDialog.tsx  # Yield claim modal
│   │   ├── ConnectWallet.tsx    # Wallet connection
│   │   ├── HeroSection.tsx      # Landing page hero
│   │   ├── KYCBadge.tsx         # KYC status badge
│   │   ├── Layout.tsx           # App layout wrapper
│   │   ├── MintAssetDialog.tsx  # Minting modal
│   │   ├── PortfolioCard.tsx    # Portfolio summary
│   │   ├── PortfolioCharts.tsx  # Portfolio analytics
│   │   ├── RedeemTokensDialog.tsx # Redemption modal
│   │   ├── StatsSection.tsx     # Platform statistics
│   │   ├── ThemeProvider.tsx    # Theme context
│   │   └── ThemeToggle.tsx      # Dark/light mode toggle
│   ├── contexts/                # React contexts
│   │   └── WalletContext.tsx    # Wallet state management
│   ├── hooks/                   # Custom React hooks
│   │   ├── useContract.ts       # Contract instance hook
│   │   ├── useFactory.ts        # Factory contract hook
│   │   ├── useKYC.ts            # KYC verification hook
│   │   ├── useMarketplace.ts    # Marketplace interactions
│   │   ├── useRedemption.ts     # Redemption workflow
│   │   └── useWallet.ts         # Wallet connection
│   ├── lib/                     # Utilities and data
│   │   ├── chartData.ts         # Chart data generation
│   │   ├── contracts.ts         # Contract addresses & ABIs
│   │   ├── mockData.ts          # Demo data
│   │   ├── mockTransactions.ts  # Transaction history
│   │   ├── types.d.ts           # TypeScript types
│   │   └── utils.ts             # Helper functions
│   ├── pages/                   # Route pages
│   │   ├── Admin.tsx            # Admin dashboard
│   │   ├── AssetDetail.tsx      # Asset details page
│   │   ├── Index.tsx            # Home page
│   │   ├── KYC.tsx              # KYC verification
│   │   ├── Marketplace.tsx      # Asset marketplace
│   │   ├── Portfolio.tsx        # User portfolio
│   │   ├── Tokenize.tsx         # Tokenization wizard
│   │   ├── Trade.tsx            # P2P trading
│   │   └── Transactions.tsx     # Transaction history
│   ├── App.tsx                  # Main app component
│   ├── index.css                # Global styles
│   └── main.tsx                 # Entry point
├── public/                       # Static assets
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MetaMask** browser extension
- **tBNB testnet funds** ([Get testnet BNB](https://www.bnbchain.org/en/testnet-faucet))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd RWA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📋 Smart Contracts

### Contract Overview

| Contract | Standard | Purpose |
|----------|----------|---------|
| `RWAYieldToken.sol` | ERC-20 | Yield-bearing token with distribution mechanics |
| `RWAAssetToken.sol` | ERC-1155 | Fractional ownership of tokenized assets |
| `RWASecurityToken.sol` | ERC-3643 | Compliant security token with KYC enforcement |
| `RWAMarketplace.sol` | — | P2P order book with escrow and partial fills |
| `KYCRegistry.sol` | — | On-chain identity with attestation and expiration |
| `RedemptionManager.sol` | — | Token redemption with cooldown, fees, and payouts |
| `RWAAssetFactory.sol` | — | Factory for creating and approving tokenized assets |

### Deployment Guide (Remix IDE)

1. **Open Remix IDE**: Go to [remix.ethereum.org](https://remix.ethereum.org)
2. **Create new files**: Create each `.sol` file in the contracts folder
3. **Compile**: 
   - Select Solidity `0.8.20`
   - Enable optimization (200 runs)
   - Click "Compile"
4. **Deploy**: 
   - Environment: "Injected Provider - MetaMask"
   - Ensure MetaMask is on BNB Smart Chain Testnet (Chain ID 97)
   - Enter constructor arguments
   - Click "Deploy"

### Deployment Order

1. `KYCRegistry` (no dependencies)
2. `RWAYieldToken("RWA Yield Token", "RWAYLD")`
3. `RWAAssetToken("https://api.cyberestate.io/metadata/")`
4. `RWASecurityToken("RWA Security Token", "RWAST")`
5. `RWAMarketplace(kycRegistryAddress, feeRecipientAddress)`
6. `RedemptionManager(feeRecipientAddress)`
7. `RWAAssetFactory(adminAddress, feeRecipientAddress)`

### Constructor Arguments

| Contract | Arguments |
|----------|-----------|
| RWAYieldToken | `name`: "RWA Yield Token", `symbol`: "RWAYLD" |
| RWAAssetToken | `baseURI`: "https://api.cyberestate.io/metadata/" |
| RWASecurityToken | `name`: "RWA Security Token", `symbol`: "RWAST" |
| KYCRegistry | _(none)_ |
| RWAMarketplace | `_kycRegistry`: KYCRegistry address, `_feeRecipient`: fee wallet |
| RedemptionManager | `_feeRecipient`: fee wallet address |
| RWAAssetFactory | `_admin`: admin address, `_feeRecipient`: fee wallet address |

## 🔧 Configuration

### Update Contract Addresses

After deploying the smart contracts, update the contract addresses in your frontend:

1. **Open** `src/lib/contracts.ts`
2. **Replace** the addresses with your deployed contract addresses:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     rwaYieldToken: "0xYOUR_DEPLOYED_ADDRESS",
     assetToken: "0xYOUR_DEPLOYED_ADDRESS",
     securityToken: "0xYOUR_DEPLOYED_ADDRESS",
     marketplace: "0xYOUR_DEPLOYED_ADDRESS",
     kycRegistry: "0xYOUR_DEPLOYED_ADDRESS",
     redemptionManager: "0xYOUR_DEPLOYED_ADDRESS",
     assetFactory: "0xYOUR_DEPLOYED_ADDRESS",
   };
   ```

### Network Configuration

Make sure your MetaMask is connected to the correct network:
- **BNB Smart Chain Testnet** (Chain ID 97) - Recommended for testing
- **BNB Smart Chain Mainnet** (Chain ID 56) - For production

## 💡 How to Use

### For Investors

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Complete KYC**: 
   - Navigate to KYC page
   - Submit jurisdiction and investor type
   - Wait for admin approval
3. **Browse Marketplace**: 
   - View available tokenized assets
   - Filter by asset class (Real Estate, Treasury, etc.)
   - Review asset details and yield rates
4. **Invest**: 
   - Click "Buy" on desired asset
   - Enter investment amount
   - Approve transaction in MetaMask
5. **Manage Portfolio**: 
   - Track your holdings in Portfolio page
   - Claim yield when available
   - Redeem tokens when needed

### For Asset Issuers

1. **Navigate to Tokenize**: Go to the Tokenize page
2. **Fill Asset Details**:
   - Asset name and symbol
   - Asset class (Real Estate, Commodity, Treasury, etc.)
   - Location and total value
   - Token price and total supply
   - Annual yield percentage
3. **Upload Metadata**: Provide IPFS links for asset documents
4. **Pay Creation Fee**: Approve the factory fee transaction
5. **Await Approval**: Admin will review and approve your asset

### For Admins

1. **Access Admin Panel**: Navigate to Admin page
2. **Manage KYC**: 
   - Review pending KYC submissions
   - Approve or reject with investor type assignment
3. **Approve Assets**: Review and approve tokenized asset creation requests
4. **Manage Whitelists**: Add/remove addresses from whitelists
5. **Process Redemptions**: Approve token redemption requests

## 🔒 Security Features

- **KYC Enforcement**: All transactions require verified identity
- **Access Control**: Role-based permissions for admin functions
- **Pausable Contracts**: Emergency pause mechanism on all tokens
- **Reentrancy Protection**: OpenZeppelin ReentrancyGuard on critical contracts
- **Escrow Settlement**: Marketplace locks funds until order completion
- **Jurisdiction Restrictions**: Region-based investment limits
- **Cooldown Periods**: 7-day cooldown on redemptions to prevent abuse
- **Audit Recommended**: Third-party audit suggested before mainnet deployment

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest

### Tech Stack

- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Animation:** Framer Motion
- **Charts:** Recharts for data visualization
- **Blockchain:** ethers.js v6, BNB Smart Chain
- **Smart Contracts:** Solidity 0.8.20 (OpenZeppelin)
- **State Management:** React Context, TanStack React Query
- **Forms:** React Hook Form with Zod validation

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check if you're on BNB Smart Chain Testnet (Chain ID 97)
   - Try refreshing the page

2. **KYC Not Approved**
   - Ensure you submitted KYC through the KYC page
   - Wait for admin approval (check your KYC status badge)
   - Contact admin if approval is delayed

3. **Transaction Failed**
   - Check if you have sufficient tBNB for gas fees
   - Ensure you're connected to the correct network
   - Verify the contract addresses in `contracts.ts`

4. **Marketplace Order Failed**
   - Ensure both parties have completed KYC
   - Check order hasn't expired
   - Verify sufficient balance for the transaction

### Getting Help

- Check the browser console for detailed error messages
- Verify your MetaMask network settings
- Ensure you have test BNB for gas fees
- Review the contracts README for detailed interaction examples

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Ensure you're using the latest version
- Check the [contracts README](./contracts/README.md) for detailed contract documentation

---

**Tokenize the real world with Cyber Estate! 🏢💎**
# Cyber Estate — RWA Tokenization Platform

A production-grade decentralized platform for tokenizing real-world assets (real estate, commodities, treasuries, infrastructure) on BNB Smart Chain.

## Tech Stack

- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui, Framer Motion
- **Blockchain:** ethers.js v6, BNB Smart Chain Testnet (tBNB)
- **Smart Contracts:** Solidity 0.8.20 (OpenZeppelin)
- **State:** React Context, TanStack React Query

## Features

- **Marketplace** — Browse and invest in tokenized real-world assets
- **Secondary Market (P2P)** — Place and fill orders for ERC-20/ERC-1155 tokens with escrow settlement
- **Portfolio** — Track holdings, claim yield, and redeem tokens
- **KYC/AML** — On-chain identity verification with jurisdiction-based restrictions
- **Tokenization Wizard** — Create new tokenized assets with configurable tokenomics
- **Admin Panel** — Manage whitelists, mint tokens, and distribute yield
- **Wallet Integration** — MetaMask with auto-reconnect and network switching

## Smart Contracts

| Contract | Standard | Purpose |
|----------|----------|---------|
| `RWAYieldToken.sol` | ERC-20 | Yield-bearing token with distribution mechanics |
| `RWAAssetToken.sol` | ERC-1155 | Fractional ownership of tokenized assets |
| `RWASecurityToken.sol` | ERC-3643 | Compliant security token with KYC enforcement |
| `RWAMarketplace.sol` | — | P2P order book with escrow and partial fills |
| `KYCRegistry.sol` | — | On-chain identity with attestation and expiration |
| `RedemptionManager.sol` | — | Token redemption with cooldown, fees, and payouts |
| `RWAAssetFactory.sol` | — | Factory for creating and approving tokenized assets |

## Getting Started

### Prerequisites

- Node.js >= 18
- MetaMask browser extension
- tBNB testnet funds ([faucet](https://www.bnbchain.org/en/testnet-faucet))

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

## Contract Deployment (Remix IDE)

1. Open [Remix IDE](https://remix.ethereum.org)
2. Compile each `.sol` file with Solidity `0.8.20`, optimization enabled (200 runs)
3. Deploy via **Injected Provider — MetaMask** on BNB Smart Chain Testnet
4. Copy deployed addresses into `src/lib/contracts.ts`

### Constructor Arguments

| Contract | Arguments |
|----------|-----------|
| RWAYieldToken | `name`: "RWA Yield Token", `symbol`: "RWAYLD" |
| RWAAssetToken | `baseURI`: "https://api.cyberestate.io/metadata/" |
| RWASecurityToken | `name`: "RWA Security Token", `symbol`: "RWAST" |
| KYCRegistry | _(none)_ |
| RWAMarketplace | `_kycRegistry`: address of deployed KYCRegistry, `_feeRecipient`: fee wallet |
| RedemptionManager | `_feeRecipient`: fee wallet |
| RWAAssetFactory | `_admin`: admin address, `_feeRecipient`: fee wallet |

## Project Structure

```
├── contracts/            Solidity smart contracts
├── src/
│   ├── components/       React UI components
│   ├── contexts/         Wallet context (MetaMask integration)
│   ├── hooks/            Contract interaction hooks
│   ├── lib/              ABIs, addresses, mock data, utilities
│   └── pages/            Route-level page components
├── public/               Static assets
└── index.html
```

## License

MIT
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
