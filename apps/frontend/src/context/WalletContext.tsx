'use client';

import { WalletProvider, SuiWallet, WalletStandardAdapter } from '@mysten/wallet-adapter-react';
import { createContext, useContext, useMemo } from 'react';

export function SuiWalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new WalletStandardAdapter()
  ], []);

  return (
    <WalletProvider wallets={wallets} autoConnect>
      {children}
    </WalletProvider>
  );
}

export { useWallet } from '@mysten/wallet-adapter-react';