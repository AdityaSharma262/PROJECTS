import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  // Function to shorten wallet address
  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {!isConnected ? (
        <ConnectButton 
          label="Connect Wallet"
        />
      ) : (
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Wallet</span>
            <span className="font-mono text-sm">{address ? shortenAddress(address) : ''}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Balance</span>
            <span className="font-medium">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 BNB'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;