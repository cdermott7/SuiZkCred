'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { parseCredentialObject } from '../utils/credentialContract';

// Package ID from our deployed contract
const PACKAGE_ID = '0xe00132aafb392b45f43a13054c7c8589f5c7f7bd4393d6b4dd3ff7c8ad44eb12';

// Use a mock client for demo purposes

export interface CredentialData {
  id: string;
  nullifier: string;
  credentialType: number;
  issuer: string;
  expirationTimestamp: number;
  isRevoked: boolean;
}

export default function useUserCredentials() {
  const { connected, currentAccount } = useWallet();
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch user's credentials (mock implementation)
  const fetchCredentials = async () => {
    if (!connected || !currentAccount?.address) {
      setCredentials([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock credential data (in a real app, we'd query the blockchain)
      const mockCredentials: CredentialData[] = localStorage.getItem('on-chain-credentials') 
        ? JSON.parse(localStorage.getItem('on-chain-credentials') || '[]')
        : [];
      
      // Add a sample credential if none exist
      if (mockCredentials.length === 0) {
        // Add a sample credential for demo purposes
        const sampleCredential: CredentialData = {
          id: '0x' + Array.from(Array(64)).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          nullifier: 'sample-nullifier-' + Date.now(),
          credentialType: 1,
          issuer: currentAccount.address,
          expirationTimestamp: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year from now
          isRevoked: false
        };
        
        mockCredentials.push(sampleCredential);
        
        // Store in local storage for persistence
        localStorage.setItem('on-chain-credentials', JSON.stringify(mockCredentials));
      }
      
      setCredentials(mockCredentials);
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch credentials'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch credentials when wallet connection changes
  useEffect(() => {
    fetchCredentials();
  }, [connected, currentAccount?.address]);

  return {
    credentials,
    loading,
    error,
    refetch: fetchCredentials
  };
}