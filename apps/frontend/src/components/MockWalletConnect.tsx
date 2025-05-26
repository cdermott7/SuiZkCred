'use client';

import { useState } from 'react';

interface MockWalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address?: string;
}

export default function MockWalletConnect({
  onConnect,
  onDisconnect,
  isConnected,
  address
}: MockWalletConnectProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a random mock address
    const mockAddress = '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    onConnect(mockAddress);
    setLoading(false);
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  if (isConnected && address) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-indigo-900">Wallet Connected (Demo)</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
            Active
          </span>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-indigo-100 mb-4">
          <p className="mb-1 text-sm text-gray-700">Your Sui Address (Demo)</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-gray-800 truncate">
              {address.substring(0, 10)}...{address.substring(address.length - 6)}
            </p>
            <button 
              onClick={() => navigator.clipboard.writeText(address)}
              className="text-indigo-600 hover:text-indigo-800"
              title="Copy address"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200"
          >
            Disconnect Demo Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
      <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-medium mb-2">Connect Demo Wallet</h2>
      <p className="text-gray-700 mb-6">No wallet extension? Use our demo wallet to test the application.</p>
      <div className="transform transition-transform hover:scale-105">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 relative overflow-hidden"
        >
          {loading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-indigo-700">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          ) : null}
          <span className={loading ? 'invisible' : ''}>Connect Demo Wallet</span>
        </button>
      </div>
    </div>
  );
}