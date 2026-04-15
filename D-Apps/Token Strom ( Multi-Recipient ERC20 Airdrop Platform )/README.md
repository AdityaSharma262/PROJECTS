# TSender

Efficient Multi-Recipient ERC20 Airdrop Platform

TSender is a decentralized web application that enables users to distribute ERC20 tokens to multiple recipients in a single, gas-optimized transaction. Built with Next.js, RainbowKit, and wagmi, TSender is ideal for community rewards, marketing campaigns, payroll, and more.

---

## Features

- **Wallet Integration:** Secure wallet connection via RainbowKit and wagmi, supporting major Ethereum networks and testnets.
- **Batch Airdrop:** Distribute ERC20 tokens to multiple addresses in one transaction.
- **Approval Workflow:** Guided ERC20 approval process for secure token transfers.
- **Robust Validation:** Comprehensive input validation and error handling.
- **User Feedback:** Real-time transaction status, including transaction hashes and explorer links.
- **Developer Friendly:** Easily testable with local blockchains (Anvil, Hardhat) and compatible with any standard ERC20 token.

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Wallet/Blockchain:** RainbowKit, wagmi, ethers.js
- **Smart Contracts:** Solidity (ERC20, TSender airdrop contract), OpenZeppelin libraries

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- An Ethereum wallet (e.g., MetaMask)
- Access to a local or public Ethereum network (Anvil, Hardhat, Sepolia, etc.)

### Installation

```bash
# Clone the repository
 git clone <your-repo-url>
 cd ts-Tsender/ts-sender

# Install dependencies
 pnpm install

# Copy and configure environment variables
 cp .env.example .env.local
# Edit .env.local to add your WalletConnect Project ID, etc.
```

### Running the App

```bash
# Start the development server
pnpm run dev
# The app will be available at http://localhost:3000
```

---

## Usage

1. **Connect your wallet** using the Connect button.
2. **Enter the ERC20 token address** you want to airdrop.
3. **Enter recipient addresses** (comma or newline separated).
4. **Enter amounts** for each recipient (comma or newline separated, must match number of addresses).
5. **Approve** the TSender contract to spend your tokens.
6. **Click AIRDROP** to send tokens to all recipients in a single transaction.
7. **Monitor transaction status** and view hashes on the block explorer.

---

## Smart Contracts

- **TSender Contract:** Handles batch ERC20 token transfers.
- **ERC20 Token:** Any standard ERC20 token can be used. For testing, you can deploy the provided `MockToken` contract.

### Example MockToken (for testing)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
    function mintTo(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
```

---

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or improvements.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements
- [RainbowKit](https://rainbowkit.com/)
- [wagmi.sh](https://wagmi.sh/)
- [OpenZeppelin](https://openzeppelin.com/)
- [Next.js](https://nextjs.org/)
