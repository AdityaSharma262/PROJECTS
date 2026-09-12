# ⚡ Token Storm (TSender v2.0)

> **The most gas-efficient multi-recipient ERC20 airdrop platform on Earth, powered by Huff assembly on the EVM.**

Token Storm (TSender) is a high-performance decentralized web application (dApp) designed to distribute ERC20 tokens to hundreds or thousands of recipients with minimal gas consumption. Built with **Next.js 15**, **Huff EVM Assembly**, **RainbowKit**, **Wagmi v2**, and **Viem**, Token Storm features an **Auto-Batch Chunking Engine** that enables enterprise-scale token distributions without hitting EVM block gas limits.

---

## 🚀 Key Features

### 1. 🐎 Ultra Gas-Optimized Smart Contract (Huff)
- **Zero Compiler Overhead:** Built directly in low-level EVM assembly (Huff) rather than standard Solidity, saving thousands of gas per transaction.
- **Single Pull Architecture:** Executes only one `transferFrom` call for the entire batch rather than individual pulls.
- **Tight Assembly Loop:** Eliminates standard Solidity array bounds checks and memory duplication, reducing per-recipient gas to the theoretical EVM minimum.

### 2. 📦 Auto-Batch Chunking Engine (Unlimited Scale)
- **EVM Block Gas Protection:** Automatically partitions large recipient lists into safe batches (**100, 200, 250, or 400 addresses per transaction**).
- **Single Global Approval:** Sign a single approval for the grand total of the campaign—no need to sign individual approvals for each batch.
- **Batch Dispatcher:** Interactive campaign progress bar with per-batch status tracking (`Pending`, `Sent ✓`, `Error`) and 1-click retry.

### 3. 🪙 Dynamic Token Metadata & Balance Detection
- Paste any ERC20 token address to instantly fetch:
  - **Token Name** & **Symbol**
  - **Decimals** (e.g. 6 for USDC/USDT, 18 for DAI/WETH)
  - **Connected Wallet Balance**
- **Pre-flight Balance Check:** Automatically alerts you if your wallet has insufficient funds before you spend gas on approvals or transactions.

### 4. 🎯 Precision Math (Zero Float Rounding Errors)
- Powered natively by `BigInt` and Viem's `parseUnits` / `formatUnits`.
- Seamlessly handles fractional amounts (e.g., `0.5`, `12.3456`) without JavaScript IEEE-754 precision loss.

### 5. 📁 File Upload & Deduplication
- **Drag-and-Drop:** Upload `.csv`, `.txt`, or `.tsv` files containing recipient data.
- **Sample Template:** 1-click "Download Template" button for instant format reference.
- **Allocation Modes:**
  - **Custom Amounts:** Unique amounts per recipient (`address, amount`).
  - **Equal Amount:** Single fixed amount distributed to all addresses.
- **Duplicate Merger:** Automatically detects duplicate addresses and combines their amounts with a 1-click "Merge Duplicates" button to prevent double-spending gas.

### 6. 🌐 Multi-Chain Support & Network-Aware Explorers
- Out-of-the-box contract addresses configured for:
  - **Ethereum Mainnet**
  - **Base**
  - **Arbitrum One**
  - **Optimism**
  - **zkSync Era**
  - **Sepolia Testnet**
  - **Anvil / Localhost**
- Transaction links automatically route to the active network's block explorer (Etherscan, Basescan, Arbiscan, Optimistic Etherscan, zkSync Explorer).

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **UI & Styling:** Tailwind CSS, React Icons, Dark Cyberpunk Glassmorphism
- **Web3 / EVM:** [RainbowKit v2](https://rainbowkit.com/), [Wagmi v2](https://wagmi.sh/), [Viem v2](https://viem.sh/)
- **Smart Contracts:** [Huff Language](https://huff.language/) (EVM Assembly) & Solidity

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm, pnpm, or yarn
- Web3 Wallet (MetaMask, Rabby, Coinbase Wallet, WalletConnect)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AdityaSharma262/PROJECTS.git
   cd "Projects/D-Apps/Token Strom ( Multi-Recipient ERC20 Airdrop Platform )"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id_here"
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Step-by-Step Usage

1. **Connect Wallet:** Click "Connect Wallet" in the header to connect your Web3 wallet.
2. **Enter Token Address:** Paste the ERC20 token address. Token Name, Symbol, Decimals, and your current balance will appear automatically.
3. **Choose Distribution Mode:**
   - **Custom Amounts:** Paste or upload `0xAddress, amount` (one per line).
   - **Equal Amount:** Enter a fixed token amount and paste a list of addresses.
4. **Inspect & Clean:**
   - Review total recipient count and total airdrop amount.
   - If duplicates are detected, click **"Merge Duplicates"**.
5. **Approve Token:** Click **"Approve TSender Contract"** to grant permission for the total airdrop amount.
6. **Dispatch Airdrop:**
   - If sending $\le 200$ recipients: Send with a single click.
   - If sending hundreds or thousands: Click each batch sequentially in the **Batch Dispatcher** and track real-time progress.
7. **View on Explorer:** Click transaction hash links to view confirmed receipts on block explorers.

---

## 📜 Deployed Contracts

| Network | Chain ID | TSender (Huff Contract) |
| :--- | :---: | :--- |
| **Ethereum Mainnet** | `1` | `0x3aD9F29AB266E4828450B33df7a9B9D7355Cd821` |
| **Base** | `8453` | `0x31801c3e09708549c1b2c9E1CFbF001399a1B9fa` |
| **Arbitrum One** | `42161` | `0xA2b5aEDF7EEF6469AB9cBD99DE24a6881702Eb19` |
| **Optimism** | `10` | `0xAaf523DF9455cC7B6ca5637D01624BC00a5e9fAa` |
| **zkSync Era** | `324` | `0x7e645Ea4386deb2E9e510D805461aA12db83fb5E` |
| **Sepolia Testnet** | `11155111` | `0xa27c5C77DA713f410F9b15d4B0c52CAe597a973a` |
| **Anvil / Localhost** | `31337 / 1337` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |

---

## 🧪 Testing with Local Anvil

To test airdrops locally using Foundry's Anvil node:

```bash
# Start anvil with preloaded contract state
anvil --load-state tsender-deployed.json
```

---

## 📄 License

This project is licensed under the MIT License.
