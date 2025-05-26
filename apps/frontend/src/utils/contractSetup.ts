'use client';

// Use a type import only to avoid build issues
import type { TransactionBlock } from '@mysten/sui.js/transactions';

// Package ID from deployed contract
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '0x18a2f5290fa353c2b0a6518232e689d613b5b0cae8295bbb8d805d60cf56a3aa';

/**
 * Build a transaction to create and publish a verification key
 * This needs to be called once to set up the verifier key for ZK proof verification
 * @param verificationKeyBytes The verification key bytes (from the ZK circuit setup)
 * @returns Transaction block ready to be signed
 */
export function buildCreateVerifierKeyTx(verificationKeyBytes?: Uint8Array): any {
  // Use dynamic import approach to avoid build issues
  let tx: any; 
  try {
    // For client-side only - will not run during build
    if (typeof window !== 'undefined') {
      // Dynamically import
      const { TransactionBlock } = require('@mysten/sui.js/transactions');
      tx = new TransactionBlock();
    } else {
      // Mock for server-side rendering
      return {
        moveCall: () => ({}),
        pure: () => ({}),
      };
    }
  } catch (e) {
    console.error('Failed to create TransactionBlock', e);
    // Provide a mock implementation
    return {
      moveCall: () => ({}),
      pure: () => ({}),
    };
  }
  
  // For demo purposes, use a mock verification key if none provided
  const vkBytes = verificationKeyBytes || new TextEncoder().encode('mock_verification_key_for_demo');
  
  tx.moveCall({
    target: `${PACKAGE_ID}::CredentialVerifier::create_key`,
    arguments: [
      tx.pure(Array.from(vkBytes)), // vk_bytes as vector<u8>
    ],
  });
  
  return tx;
}

/**
 * Build a transaction to initialize a revocation registry
 * This needs to be called once to set up the nullifier registry
 * @returns Transaction block ready to be signed
 */
export function buildInitRevocationRegistryTx(): any {
  // Use dynamic import approach to avoid build issues
  let tx: any; 
  try {
    // For client-side only - will not run during build
    if (typeof window !== 'undefined') {
      // Dynamically import
      const { TransactionBlock } = require('@mysten/sui.js/transactions');
      tx = new TransactionBlock();
    } else {
      // Mock for server-side rendering
      return {
        moveCall: () => ({}),
      };
    }
  } catch (e) {
    console.error('Failed to create TransactionBlock', e);
    // Provide a mock implementation
    return {
      moveCall: () => ({}),
    };
  }
  
  tx.moveCall({
    target: `${PACKAGE_ID}::CredentialVerifier::init_registry`,
    arguments: [], // No arguments needed
  });
  
  return tx;
}

/**
 * Helper function to get the package ID
 */
export function getPackageId(): string {
  return PACKAGE_ID;
}

/**
 * Helper function to parse credential type from number to string
 */
export function getCredentialTypeName(credType: number): string {
  const types: { [key: number]: string } = {
    1: 'Email',
    2: 'Basic KYC',
    3: 'Advanced KYC', 
    4: 'DAO Membership',
    5: 'Education',
    6: 'Passport',
    7: 'Driver License',
    8: 'National ID',
    9: 'Proof of Address'
  };
  
  return types[credType] || 'Unknown';
}

/**
 * Helper function to generate a nullifier from a string
 * In production, this would use proper cryptographic methods
 * @param input The input string to generate nullifier from
 * @returns A u64 nullifier value
 */
export function generateNullifier(input: string): string {
  // Simple hash function for demo - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure it's positive and fits in u64
  const nullifier = Math.abs(hash) % (2**53 - 1);
  return nullifier.toString();
}