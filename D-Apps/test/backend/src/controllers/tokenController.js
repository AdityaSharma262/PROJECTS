const { ethers } = require('ethers');
const erc20ABI = require('../config/erc20ABI');

const getTokenBalance = async (req, res) => {
  try {
    // Read address from query parameters
    const { address } = req.query;

    // Validate that address is provided
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    // Validate that address is a proper Ethereum address
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format'
      });
    }

    // Get RPC URL and contract address from environment variables
    const rpcUrl = process.env.BSC_RPC_URL;
    const contractAddress = process.env.WCT_TOKEN_ADDRESS;

    // Validate environment variables
    if (!rpcUrl) {
      return res.status(500).json({
        success: false,
        message: 'BSC RPC URL not configured'
      });
    }

    if (!contractAddress) {
      return res.status(500).json({
        success: false,
        message: 'WCT token address not configured'
      });
    }

    // Validate contract address
    if (!ethers.isAddress(contractAddress)) {
      return res.status(500).json({
        success: false,
        message: 'Invalid contract address format'
      });
    }

    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, erc20ABI, provider);

    // Call balanceOf and decimals functions
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals()
    ]);

    // Format balance to readable number
    const formattedBalance = ethers.formatUnits(balance, decimals);

    // Return JSON response
    return res.status(200).json({
      success: true,
      address,
      balance: formattedBalance
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle contract call errors
    if (error.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        success: false,
        message: 'Contract call failed. Check WCT token address and network.'
      });
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Network error. Unable to connect to BSC.'
      });
    }
    
    // Handle general errors
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getTokenBalance
};