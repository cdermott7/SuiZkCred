'use client';

import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { buildProofAndMintTx } from '../utils/buildProofTx';

export default function ProofModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [id, setId] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { connected, connecting, wallet, signAndExecuteTransactionBlock } = useWallet();
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!connected || !wallet) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // In a real app, we'd call the generateCredentialProof function
      // For demo purposes, we'll mock the proof generation
      const mockProof = { proofData: 'mock-proof-data' };
      const mockNullifier = `nullifier-${Date.now()}`;
      const mockMetadata = JSON.stringify({
        name: 'Demo Credential',
        issuer: 'SuiZkCred',
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      // Build the transaction
      const tx = buildProofAndMintTx(mockProof, mockNullifier, mockMetadata);
      
      // Sign and execute the transaction
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });
      
      console.log('Transaction result:', result);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to generate proof or execute transaction:', err);
      setError('Failed to generate proof or execute transaction');
    } finally {
      setLoading(false);
    }
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Generate Credential</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
            Credential created successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="id" className="block mb-2 text-sm font-medium text-gray-700">
              ID (e.g., email hash)
            </label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="secret" className="block mb-2 text-sm font-medium text-gray-700">
              Secret
            </label>
            <input
              type="text"
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !connected}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {loading ? 'Processing...' : connected ? 'Generate' : 'Connect Wallet First'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}