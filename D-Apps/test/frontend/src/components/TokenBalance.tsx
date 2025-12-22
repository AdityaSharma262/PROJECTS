import { useState, useEffect } from 'react';

interface TokenBalanceProps {
  address: string;
}

const TokenBalance = ({ address }: TokenBalanceProps) => {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await fetch(`${backendUrl}/api/token/balance?address=${address}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch token balance');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setBalance(data.balance);
        } else {
          setError(data.message || 'Failed to fetch token balance');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Error fetching token balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalance();
  }, [address]);

  if (!address) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">No wallet address provided</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-2">WCT Token Balance</h3>
      
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {balance !== null && !loading && !error && (
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{balance}</span>
          <span className="text-sm text-gray-500">WCT</span>
        </div>
      )}
    </div>
  );
};

export default TokenBalance;