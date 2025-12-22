import { useAccount } from 'wagmi';
import WalletConnect from './components/WalletConnect';
import TokenBalance from './components/TokenBalance';
import PredictionForm from './components/PredictionForm';

function App() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Match Prediction</h1>
          
          {/* Wallet Connect Component */}
          <div className="mb-6">
            <WalletConnect />
          </div>
          
          {/* Token Balance Component - only shown when wallet is connected */}
          {isConnected && address && (
            <div className="mb-6">
              <TokenBalance address={address} />
            </div>
          )}
          
          {/* Prediction Form Component - only shown when wallet is connected */}
          {isConnected && address && (
            <div className="mb-4">
              <PredictionForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App
