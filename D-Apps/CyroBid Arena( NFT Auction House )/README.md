# 🏛️ NFT Auction House

A modern, decentralized NFT auction platform built with React and Solidity. Features a futuristic UI with real-time bidding, secure smart contracts, and seamless Web3 integration.

![NFT Auction House](https://img.shields.io/badge/React-18.0.0-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)
![Web3](https://img.shields.io/badge/Web3-1.9.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎨 Frontend
- **Futuristic UI Design** - Dark theme with neon cyan accents
- **Responsive Layout** - Two-column design optimized for all devices
- **Real-time Updates** - Live auction status and countdown timers
- **Web3 Integration** - MetaMask wallet connection
- **Glassmorphism Effects** - Modern card designs with blur effects

### 🔗 Smart Contracts
- **ERC721 NFT Contract** - Standard NFT minting and management
- **Auction Marketplace** - Secure bidding and auction management
- **Reentrancy Protection** - Security against common attacks
- **Event System** - Real-time blockchain event tracking

### 🚀 Core Functionality
- **NFT Minting** - Create and mint new NFTs with custom URIs
- **Auction Creation** - List NFTs with minimum bid and duration
- **Real-time Bidding** - Place bids on active auctions
- **Auction Management** - End auctions and transfer ownership
- **Wallet Integration** - MetaMask support for transactions

## 📁 Project Structure

```
nft-auction-house/
├── nft-auction-frontend/          # React frontend application
│   ├── src/
│   │   ├── App.jsx               # Main application component
│   │   ├── App.css               # Futuristic styling
│   │   ├── main.jsx              # Application entry point
│   │   ├── MyNftABI.js           # NFT contract interface
│   │   └── nftAuctionABI.js      # Auction contract interface
│   ├── public/
│   │   └── logo.webp             # Application favicon
│   ├── index.html                # HTML template
│   └── package.json              # Frontend dependencies
├── contracts/                     # Smart contracts
│   ├── MyNFT.sol                 # ERC721 NFT contract
│   ├── nftAuction.sol            # Auction marketplace contract
│   ├── hardhat.config.js         # Hardhat configuration
│   └── package.json              # Contract dependencies
└── README.md                     # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Web3.js** - Ethereum blockchain interaction
- **CSS3** - Custom futuristic styling
- **Google Fonts** - Orbitron for headings

### Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **OpenZeppelin** - Secure contract libraries
- **Hardhat** - Development environment
- **Ethereum** - Blockchain platform

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nft-auction-house
   ```

2. **Install frontend dependencies**
   ```bash
   cd nft-auction-frontend
   npm install
   ```

3. **Install contract dependencies**
   ```bash
   cd ../contracts
   npm install
   ```

4. **Start the development server**
   ```bash
   cd ../nft-auction-frontend
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage Guide

### Connecting Wallet
1. Click "Connect Wallet" button
2. Approve MetaMask connection
3. Your account address will be displayed

### Minting NFTs
1. Enter the NFT URI (IPFS hash or HTTP URL)
2. Click "Mint NFT"
3. Confirm the transaction in MetaMask
4. Note your Token ID for auction creation

### Creating Auctions
1. Enter your Token ID
2. Set minimum bid amount (in ETH)
3. Set auction duration (in seconds)
4. Click "Create Auction"
5. Approve NFT transfer to marketplace

### Bidding on Auctions
1. View live auctions in the right column
2. Enter your bid amount
3. Click "Place Bid"
4. Confirm transaction in MetaMask

### Ending Auctions
1. Wait for auction to end
2. Click "Settle Auction" (seller only)
3. NFT transfers to highest bidder
4. Seller receives payment

## 🎨 UI Features

### Design Elements
- **Dark Theme** - Professional dark background
- **Neon Accents** - Cyan (#00ffe7) highlights
- **Glassmorphism** - Translucent card effects
- **Hover Animations** - Smooth transitions
- **Responsive Grid** - Adaptive layout

### Layout Structure
- **Left Column** - NFT minting and auction creation
- **Right Column** - Live auctions and bidding
- **Bottom Section** - NFT gallery display

## 🔒 Security Features

### Smart Contract Security
- **ReentrancyGuard** - Prevents reentrancy attacks
- **Access Control** - Proper permission management
- **Input Validation** - Comprehensive parameter checks
- **Safe Transfers** - Secure NFT and ETH transfers

### Frontend Security
- **MetaMask Integration** - Secure wallet connection
- **Transaction Validation** - Input sanitization
- **Error Handling** - Graceful error management

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm run test
```

### Frontend
```bash
cd nft-auction-frontend
npm run test
```

## 📦 Deployment

### Smart Contracts
1. Configure network in `hardhat.config.js`
2. Set environment variables
3. Run deployment script:
   ```bash
   cd contracts
   npm run deploy
   ```

### Frontend
1. Build the application:
   ```bash
   cd nft-auction-frontend
   npm run build
   ```
2. Deploy to your preferred hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin** - For secure smart contract libraries
- **MetaMask** - For wallet integration
- **React Team** - For the amazing frontend framework
- **Ethereum Community** - For blockchain innovation

## 📞 Support

If you have any questions or need support:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Built with ❤️ for the Web3 community** 