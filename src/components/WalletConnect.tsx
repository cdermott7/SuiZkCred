'use client';

import { useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ConnectButton } from '@mysten/wallet-kit';

export default function WalletConnect() {
  const { 
    connected, 
    currentAccount, 
    useMockWallet, 
    setUseMockWallet, 
    mockConnected, 
    connectMockWallet, 
    disconnectMockWallet 
  } = useWallet();
  
  // Check if the real wallet is available after a delay
  useEffect(() => {
    // If we're already connected with a real wallet, don't show mock wallet
    if (connected && !mockConnected) {
      setUseMockWallet(false);
      return;
    }
    
    // After 3 seconds, if no wallet connection, offer the mock wallet
    const timer = setTimeout(() => {
      if (!connected) {
        setUseMockWallet(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [connected, mockConnected, setUseMockWallet]);

  return (
    <div className="flex flex-col">
      {!connected ? (
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2">Connect Your Wallet</h2>
          <p className="text-gray-700 mb-6">Connect to the Sui blockchain to manage your credentials.</p>
          <div className="transform transition-transform hover:scale-105">
            <ConnectButton />
          </div>
          
          {useMockWallet && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-700 mb-4">No wallet extension?</p>
              <button
                onClick={connectMockWallet}
                className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-md hover:bg-indigo-200 transition-colors flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Use Demo Wallet
              </button>
            </div>
          )}
        </div>
      ) : mockConnected ? (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-indigo-900">Demo Wallet Connected</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
              Demo
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-md border border-indigo-100 mb-4">
            <p className="mb-1 text-sm text-gray-700">Your Demo Sui Address</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-gray-800 truncate">
                {currentAccount?.address?.substring(0, 10)}...{currentAccount?.address?.substring(currentAccount?.address?.length - 6)}
              </p>
              <button 
                onClick={() => navigator.clipboard.writeText(currentAccount?.address || '')}
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
              onClick={disconnectMockWallet}
              className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200"
            >
              Disconnect Demo Wallet
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-indigo-900">Wallet Connected</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
              Active
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-md border border-indigo-100 mb-4">
            <p className="mb-1 text-sm text-gray-700">Your Sui Address</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-gray-800 truncate">
                {currentAccount?.address?.substring(0, 10)}...{currentAccount?.address?.substring(currentAccount?.address?.length - 6)}
              </p>
              <button 
                onClick={() => navigator.clipboard.writeText(currentAccount?.address || '')}
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
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  );
}