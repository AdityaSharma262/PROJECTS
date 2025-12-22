// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying FreelancerEscrow contract...");

  // Get the contract factory
  const FreelancerEscrow = await hre.ethers.getContractFactory("FreelancerEscrow");
  
  // Deploy the contract
  const freelancerEscrow = await FreelancerEscrow.deploy();
  
  // Wait for deployment to finish
  await freelancerEscrow.waitForDeployment();
  
  // Get the deployed contract address
  const address = await freelancerEscrow.getAddress();
  
  console.log("FreelancerEscrow deployed to:", address);
  console.log("Network:", hre.network.name);
  console.log("Block explorer:", getBlockExplorerUrl(hre.network.name, address));
  
  // Verify the contract on Etherscan (if not on local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await freelancerEscrow.deployTransaction.wait(6);
    await verify(address, []);
  }
}

// Function to get block explorer URL
function getBlockExplorerUrl(network, address) {
  const explorers = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    goerli: `https://goerli.etherscan.io/address/${address}`,
    mainnet: `https://etherscan.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    mumbai: `https://mumbai.polygonscan.com/address/${address}`
  };
  return explorers[network] || `https://${network}.etherscan.io/address/${address}`;
}

// Function to verify contract on Etherscan
async function verify(contractAddress, args) {
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("Contract verified on Etherscan!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.log("Verification failed:", error.message);
    }
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 