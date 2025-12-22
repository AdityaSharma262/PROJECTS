# Deployment Guide

This guide will walk you through deploying the FreelancerEscrow smart contract and setting up the frontend application.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MetaMask** browser extension
3. **Ethereum testnet ETH** (Sepolia or Goerli)
4. **Infura/Alchemy account** (for RPC endpoints)
5. **Etherscan account** (for contract verification)

## Step 1: Environment Setup

1. **Copy environment template**:
   ```bash
   cp env.example .env
   ```

2. **Fill in your environment variables** in `.env`:
   ```env
   # Get from Infura/Alchemy
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   
   # Your wallet private key (without 0x)
   PRIVATE_KEY=your_private_key_here
   
   # Get from Etherscan
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

## Step 2: Install Dependencies

```bash
npm install
# or
pnpm install
```

## Step 3: Compile Smart Contract

```bash
npm run compile
```

## Step 4: Test Smart Contract (Optional but Recommended)

```bash
npm run test
```

## Step 5: Deploy Smart Contract

### Option A: Deploy to Sepolia Testnet (Recommended)

```bash
npm run deploy:sepolia
```

### Option B: Deploy to Goerli Testnet

```bash
npm run deploy:goerli
```

### Option C: Deploy to Local Network

1. **Start local Hardhat node**:
   ```bash
   npm run node
   ```

2. **In a new terminal, deploy**:
   ```bash
   npm run deploy:local
   ```

## Step 6: Verify Contract on Etherscan

After deployment, verify your contract:

```bash
# For Sepolia
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS

# For Goerli
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS
```

## Step 7: Update Frontend Configuration

1. **Open** `src/freelancerAbi.js`
2. **Replace** the contract address:
   ```javascript
   export const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

## Step 8: Start Frontend Application

```bash
npm run dev
```

Navigate to `http://localhost:5173`

## Step 9: Test the Application

1. **Connect MetaMask** to the same network where you deployed
2. **Create a test job** as a client
3. **Accept the job** as a freelancer (use a different wallet)
4. **Submit work** and test the approval/rejection flow

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**
   - Get testnet ETH from a faucet
   - Sepolia: https://sepoliafaucet.com/
   - Goerli: https://goerlifaucet.com/

2. **"Contract not found"**
   - Verify the contract address in `freelancerAbi.js`
   - Ensure MetaMask is on the correct network

3. **"Transaction failed"**
   - Check gas fees
   - Ensure sufficient ETH for gas
   - Verify network connection

4. **"Compilation failed"**
   - Check Solidity version compatibility
   - Ensure all dependencies are installed

### Getting Help

- Check the browser console for errors
- Verify your `.env` file configuration
- Ensure all dependencies are installed correctly
- Check network connectivity

## Production Deployment

For production deployment:

1. **Deploy to mainnet**:
   ```bash
   npm run deploy:mainnet
   ```

2. **Update environment variables** for mainnet
3. **Build the frontend**:
   ```bash
   npm run build
   ```

4. **Deploy frontend** to your preferred hosting service (Vercel, Netlify, etc.)

## Security Considerations

- **Never commit your `.env` file** to version control
- **Use environment variables** for sensitive data
- **Test thoroughly** on testnets before mainnet
- **Verify contracts** on Etherscan for transparency
- **Use hardware wallets** for production deployments

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the README.md file
3. Open an issue on GitHub
4. Ensure you're using the latest version 