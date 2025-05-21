'use client';

import { WalletKitProvider } from '@mysten/wallet-kit';
import { useWalletKit } from '@mysten/wallet-kit';
import { createContext, useContext, useEffect, useState } from 'react';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { mockSignAndExecuteTransaction } from '../utils/mockTransactions';

type WalletContextType = {
  connected: boolean;
  connecting: boolean;
  currentAccount: any;
  signAndExecuteTransactionBlock: any;
  useMockWallet: boolean;
  setUseMockWallet: (use: boolean) => void;
  mockConnected: boolean;
  mockAddress: string | undefined;
  connectMockWallet: () => void;
  disconnectMockWallet: () => void;
};

const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  currentAccount: null,
  signAndExecuteTransactionBlock: null,
  useMockWallet: false,
  setUseMockWallet: () => {},
  mockConnected: false,
  mockAddress: undefined,
  connectMockWallet: () => {},
  disconnectMockWallet: () => {},
});

export function SuiWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WalletKitProvider>
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </WalletKitProvider>
  );
}

function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const walletKit = useWalletKit();
  const { isConnected, isConnecting, currentAccount, signAndExecuteTransactionBlock } = walletKit;
  
  // Mock wallet state
  const [useMockWallet, setUseMockWallet] = useState(false);
  const [mockConnected, setMockConnected] = useState(false);
  const [mockAddress, setMockAddress] = useState<string>();
  
  // Mock wallet methods
  const connectMockWallet = () => {
    // Generate a random mock address
    const address = '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    setMockAddress(address);
    setMockConnected(true);
  };
  
  const disconnectMockWallet = () => {
    setMockConnected(false);
    setMockAddress(undefined);
  };
  
  // Provide a combined mock+real wallet interface
  const value = {
    connected: isConnected || mockConnected,
    connecting: isConnecting,
    currentAccount: isConnected ? currentAccount : mockConnected ? { address: mockAddress } : null,
    signAndExecuteTransactionBlock: isConnected ? signAndExecuteTransactionBlock : mockSignAndExecuteTransaction,
    useMockWallet,
    setUseMockWallet,
    mockConnected,
    mockAddress,
    connectMockWallet,
    disconnectMockWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}