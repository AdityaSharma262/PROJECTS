import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

interface PredictionData {
  wallet: string;
  matchId: string;
  team: string;
}

interface PredictionFormProps {
  onSuccess?: () => void;
}

const PredictionForm = ({ onSuccess }: PredictionFormProps) => {
  const { address, isConnected } = useAccount();
  
  const [formData, setFormData] = useState<PredictionData>({
    wallet: '',
    matchId: '',
    team: 'A',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill wallet address if connected
  useEffect(() => {
    if (isConnected && address) {
      setFormData(prev => ({
        ...prev,
        wallet: address
      }));
    }
  }, [address, isConnected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Prediction submitted successfully!' });
        // Reset form
        setFormData({ wallet: isConnected && address ? address : '', matchId: '', team: 'A' });
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit prediction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error submitting prediction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            id="wallet"
            name="wallet"
            value={formData.wallet}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your wallet address"
            readOnly={isConnected}
          />
        </div>

        <div>
          <label htmlFor="matchId" className="block text-sm font-medium text-gray-700 mb-1">
            Match ID
          </label>
          <input
            type="text"
            id="matchId"
            name="matchId"
            value={formData.matchId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter match ID"
          />
        </div>

        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
            Select Team
          </label>
          <select
            id="team"
            name="team"
            value={formData.team}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="A">Team A</option>
            <option value="B">Team B</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200`}
        >
          {isLoading ? 'Submitting...' : 'Submit Prediction'}
        </button>
      </form>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          {message.text}
        </motion.div>
      )}
    </div>
  );
};

export default PredictionForm;