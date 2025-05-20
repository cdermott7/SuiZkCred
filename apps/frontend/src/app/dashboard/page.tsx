'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import WalletConnect from '../../components/WalletConnect';
import ProofModal from '../../components/ProofModal';
import { useWallet } from '../../context/WalletContext';

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const { connected } = useWallet();
  const router = useRouter();
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">SuiZkCred Dashboard</h1>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Wallet connection */}
            <div className="px-4 py-6 bg-white rounded-lg shadow sm:p-6">
              <WalletConnect />
            </div>
            
            {/* Credentials section */}
            <div className="px-4 py-6 bg-white rounded-lg shadow sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Your Credentials</h2>
                <button
                  onClick={() => setIsProofModalOpen(true)}
                  disabled={!connected}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  Create Credential
                </button>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-500">
                  {connected 
                    ? "No credentials yet. Create your first one!" 
                    : "Connect your wallet to manage credentials."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Proof generation modal */}
      <ProofModal 
        isOpen={isProofModalOpen} 
        onClose={() => setIsProofModalOpen(false)} 
      />
    </div>
  );
}