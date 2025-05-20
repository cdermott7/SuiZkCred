'use client';

import { useWallet } from '../context/WalletContext';

export default function WalletConnect() {
  const { connected, connecting, wallet, wallets, select, disconnect } = useWallet();

  return (
    <div className="flex flex-col">
      {!connected ? (
        <div>
          <h2 className="mb-4 text-lg font-medium">Connect Wallet</h2>
          <div className="space-y-2">
            {wallets.map((w) => (
              <button
                key={w.name}
                onClick={() => select(w.name)}
                disabled={connecting}
                className="block px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {connecting ? 'Connecting...' : `Connect ${w.name}`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-lg font-medium">Wallet Connected</h2>
          <p className="mb-2">
            <span className="font-medium">Wallet:</span> {wallet?.name}
          </p>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}