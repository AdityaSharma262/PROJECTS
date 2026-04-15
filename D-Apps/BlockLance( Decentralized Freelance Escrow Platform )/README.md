# Decentralized Freelance Escrow Platform

A blockchain-based freelance platform that enables secure, trustless transactions between clients and freelancers using smart contracts on Ethereum.

## 🌟 Features

- **Secure Escrow System**: Funds are locked in smart contracts until work is approved
- **Client Dashboard**: Create jobs, fund escrow, and review submissions
- **Freelancer Dashboard**: Browse available jobs, accept work, and submit deliverables
- **Transparent Payments**: Instant payment release upon client approval
- **Rejection System**: Up to 3 rejections allowed with automatic refund
- **Web3 Integration**: MetaMask wallet connection for seamless blockchain interaction

## 🏗️ Project Structure

```
freelance-escrow/
├── contracts/                 # Smart contracts
│   ├── FreelancerEscrow.sol  # Main escrow contract
│   ├── interfaces/           # Contract interfaces
│   ├── libraries/            # Reusable libraries
│   └── utils/                # Utility contracts
├── src/                      # React frontend
│   ├── components/           # React components
│   ├── App.jsx              # Main application
│   └── App.css              # Styling
├── public/                   # Static assets
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MetaMask** browser extension
- **Ethereum testnet** (Sepolia, Goerli, or local network)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd freelance-escrow
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📋 Smart Contract Deployment

### Option 1: Using Remix IDE (Recommended for beginners)

1. **Open Remix IDE**: Go to [remix.ethereum.org](https://remix.ethereum.org)
2. **Create new file**: Create `FreelancerEscrow.sol` in the contracts folder
3. **Copy contract code**: Paste the contract code from `contracts/FreelancerEscrow.sol`
4. **Compile**: Go to the Solidity Compiler tab and compile the contract
5. **Deploy**: 
   - Go to the Deploy & Run Transactions tab
   - Select your environment (Injected Provider - MetaMask)
   - Choose the FreelancerEscrow contract
   - Click "Deploy"
6. **Copy contract address**: Save the deployed contract address

### Option 2: Using Hardhat (For advanced users)

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init
   ```

2. **Configure Hardhat**
   Create `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   
   module.exports = {
     solidity: "0.8.20",
     networks: {
       sepolia: {
         url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
         accounts: [PRIVATE_KEY]
       }
     }
   };
   ```

3. **Deploy contract**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## 🔧 Configuration

### Update Contract Address

After deploying the smart contract, update the contract address in your frontend:

1. **Open** `src/freelancerAbi.js`
2. **Replace** the `contractAddress` with your deployed contract address:
   ```javascript
   export const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

### Network Configuration

Make sure your MetaMask is connected to the same network where you deployed the contract:
- **Sepolia Testnet** (Recommended for testing)
- **Goerli Testnet**
- **Local Network** (for development)

## 💡 How to Use

### For Clients

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Create Job**: 
   - Enter job title, description, and budget
   - Click "Create Job" and approve the transaction
3. **Review Submissions**: 
   - Wait for freelancer submissions
   - Review submitted work
   - Approve or reject submissions
4. **Release Payment**: Approve to release payment to freelancer

### For Freelancers

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Browse Jobs**: View available jobs in the freelancer dashboard
3. **Accept Job**: Click "Accept Job" and approve the transaction
4. **Submit Work**: 
   - Provide submission link
   - Click "Submit Work" and approve the transaction
5. **Wait for Approval**: Client will review and approve/reject your work

## 🔒 Security Features

- **Escrow Protection**: Funds are locked until work is approved
- **Rejection Limit**: Maximum 3 rejections to prevent abuse
- **Automatic Refunds**: Rejected work automatically refunds the client
- **Transparent Transactions**: All actions are recorded on the blockchain

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Smart Contract Functions

#### Client Functions
- `createJob()` - Create a new job with escrow
- `approveSubmission(uint256 jobId)` - Approve and pay freelancer
- `rejectSubmission(uint256 jobId)` - Reject submission

#### Freelancer Functions
- `acceptJob(uint256 jobId)` - Accept an available job
- `submitWork(uint256 jobId, string memory submissionLink)` - Submit completed work

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check if you're on the correct network
   - Try refreshing the page

2. **Transaction Failed**
   - Check if you have sufficient ETH for gas fees
   - Ensure you're connected to the correct network
   - Verify the contract address is correct

3. **Contract Not Found**
   - Verify the contract address in `freelancerAbi.js`
   - Ensure the contract is deployed on the same network as MetaMask

### Getting Help

- Check the browser console for error messages
- Verify your MetaMask network settings
- Ensure you have test ETH for gas fees

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

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

---

**Happy freelancing on the blockchain! 🚀**
