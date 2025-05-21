'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '../../components/Notifications';
import { handleError } from '../../utils/errorHandler';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import WalletConnect from '../../components/WalletConnect';
import ProofModal, { Credential } from '../../components/ProofModal';
import CredentialCard from '../../components/CredentialCard';
import { useWallet } from '../../context/WalletContext';
import nullifierClient from '../../supabase/mockNullifierClient';
import { buildRevokeCredentialTx } from '../../utils/credentialContract';
import useCredentialMetadata from '../../hooks/useCredentialMetadata';
import { StorageKey } from '../../utils/walrusStorage';
import useUserCredentials, { CredentialData } from '../../hooks/useUserCredentials';
import OnboardingGuide from '../../components/OnboardingGuide';
import VerificationExplainer from '../../components/VerificationExplainer';
import { mockSignAndExecuteTransaction } from '../../utils/mockTransactions';
import DemoModeButton from '../../components/DemoModeButton';

import Logo from '../../components/Logo';

interface NullifierStatus {
  nullifier: string;
  revoked: boolean;
}

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const { connected, currentAccount, signAndExecuteTransactionBlock } = useWallet();
  const { showNotification } = useNotifications();
  const router = useRouter();
  
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedMetadataKey, setSelectedMetadataKey] = useState<StorageKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  
  // Use our hook to fetch on-chain credentials
  const { credentials: onChainCredentials, loading: credentialsLoading, refetch } = useUserCredentials();
  
  // Combine with local demo credentials (in a real app, we'd only use on-chain data)
  const [localCredentials, setLocalCredentials] = useState<Credential[]>([]);
  
  // Use our metadata hook to fetch details for the selected credential
  const { 
    metadata: selectedMetadata, 
    loading: metadataLoading 
  } = useCredentialMetadata(selectedMetadataKey);

  // Load local demo credentials
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalCredentials(window.credentials || []);
    }
  }, [isProofModalOpen]); // Re-check when modal is closed

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);
  
  // Map on-chain credentials to the format expected by the UI
  const allCredentials = [
    ...onChainCredentials.map(cred => ({
      id: cred.id,
      nullifier: cred.nullifier,
      name: `Credential Type ${cred.credentialType}`,
      credentialType: cred.credentialType,
      issuer: cred.issuer,
      expiration: new Date(cred.expirationTimestamp * 1000).toISOString(),
      metadataKey: cred.id, // Use the ID as the metadata key for on-chain objects
      onChain: true,
      isRevoked: cred.isRevoked
    })),
    ...localCredentials
  ];

  // Handle newly created credentials
  const handleCredentialCreated = (credential: Credential) => {
    setLocalCredentials(prev => [...prev, credential]);
    
    // Refresh on-chain credentials if this was on-chain
    if (credential.onChain) {
      refetch();
    }
  };
  
  // Handle credential inspection (view metadata)
  const handleInspectCredential = (credential: Credential) => {
    if (!credential.metadataKey) return;
    
    // In a real app, we'd convert the metadataKey string to a StorageKey object
    // For this demo, we'll create a fake StorageKey
    setSelectedMetadataKey({
      id: credential.metadataKey,
      type: 'storage_key',
      walrusId: `walrus-${credential.metadataKey}`,
    });
  };
  
  // Handle credential revocation
  const handleRevokeCredential = async (credential: Credential) => {
    if (!connected || !currentAccount || isRevoking) return;
    
    try {
      setIsRevoking(true);
      
      // Call on-chain revocation if credential is on-chain
      if (credential.onChain) {
        const tx = buildRevokeCredentialTx(credential.id);
        
        try {
          // Try to use the real wallet first
          await signAndExecuteTransactionBlock({
            transactionBlock: tx,
          });
        } catch (walletError) {
          console.warn('Wallet transaction failed, using mock instead:', walletError);
          // Fall back to mock transaction if wallet fails
          await mockSignAndExecuteTransaction({
            transactionBlock: tx,
          });
        }
        
        // Refresh the credentials list after revocation
        refetch();
      } else {
        // For local credentials, just mark as revoked in local storage
        const updatedCredentials = localCredentials.map(cred => 
          cred.id === credential.id 
            ? { ...cred, isRevoked: true } 
            : cred
        );
        
        if (typeof window !== 'undefined') {
          window.credentials = updatedCredentials;
        }
        
        setLocalCredentials(updatedCredentials);
      }
      
      // Show success notification
      showNotification({
        type: 'success',
        title: 'Credential Revoked',
        message: 'Your credential has been successfully revoked.'
      });
    } catch (error) {
      console.error('Failed to revoke credential:', error);
      const processedError = handleError(error);
      showNotification({
        type: 'error',
        title: 'Revocation Failed',
        message: processedError.message
      });
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Guide */}
      <OnboardingGuide />
      
      <header className="bg-white shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo width={48} height={32} variant="default" showText={false} />
              <h1 className="text-3xl font-bold text-gray-900">SuiZkCred</h1>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Demo disclaimer */}
          <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
            <h3 className="font-bold flex items-center mb-2">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Demo Application
            </h3>
            <p className="text-sm">This is a demonstration application with the following limitations:</p>
            <ul className="text-sm mt-2 list-disc list-inside space-y-1">
              <li>Document uploads are <strong>not actually verified</strong> for authenticity</li>
              <li>Zero-knowledge proofs are simulated rather than using cryptographically secure implementations</li>
              <li>Blockchain transactions use mock data in a testnet environment</li>
              <li>Data persistence is limited to the current browser session</li>
            </ul>
          </div>

          {/* Welcome banner */}
          <div className="mb-8 rounded-xl shadow-lg overflow-hidden matrix-animation relative"
            style={{ 
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)' 
            }}
          >
            <div className="px-6 py-8 md:flex md:items-center md:justify-between relative z-10">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold text-white mb-2 matrix-glitch">Welcome to SuiZkCred</h2>
                <p className="text-white font-medium">
                  Create and manage private, verifiable credentials using zero-knowledge proofs on Sui.
                </p>
                <div className="mt-4" data-demo-target="zk-explainer">
                  <VerificationExplainer />
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-8 flex-shrink-0 hidden md:block">
                <Logo 
                  width={150}
                  height={100}
                  variant="default"
                  showText={true}
                />
              </div>
            </div>
          </div>
        
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Wallet connection */}
            <div className="px-4 py-6 bg-white rounded-xl shadow-sm sm:p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <svg className="mr-2 h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Wallet Connection
              </h2>
              <WalletConnect />
              
              {/* Metadata viewer */}
              {selectedMetadataKey && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credential Details</h3>
                  
                  {metadataLoading ? (
                    <p className="text-gray-500">Loading metadata...</p>
                  ) : selectedMetadata ? (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-md font-medium mb-2">{selectedMetadata.name}</h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                        <dd className="text-sm text-gray-900">{selectedMetadata.credentialType}</dd>
                        
                        <dt className="text-sm font-medium text-gray-500">Issuer</dt>
                        <dd className="text-sm text-gray-900">{selectedMetadata.issuer}</dd>
                        
                        <dt className="text-sm font-medium text-gray-500">Issued</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedMetadata.issuanceDate * 1000).toLocaleDateString()}
                        </dd>
                        
                        <dt className="text-sm font-medium text-gray-500">Expires</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedMetadata.expirationDate * 1000).toLocaleDateString()}
                        </dd>
                        
                        {selectedMetadata.attributes && (
                          <>
                            <dt className="text-sm font-medium text-gray-500 col-span-2 mt-2">Attributes</dt>
                            {Object.entries(selectedMetadata.attributes).map(([key, value]) => (
                              <div key={key}>
                                <dt className="text-sm font-medium text-gray-500 pl-2">{key}</dt>
                                <dd className="text-sm text-gray-900">{String(value)}</dd>
                              </div>
                            ))}
                          </>
                        )}
                      </dl>
                      
                      <button
                        onClick={() => setSelectedMetadataKey(null)}
                        className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Close details
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No metadata available</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Credentials section */}
            <div className="px-4 py-6 bg-white rounded-xl shadow-sm sm:p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="mr-2 h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Your Credentials
                </h2>
                <button
                  onClick={() => setIsProofModalOpen(true)}
                  disabled={!connected}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center shadow-sm"
                  data-demo-target="create-credential"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Credential
                </button>
              </div>
              
              <div className="mt-4 space-y-4" data-demo-target="credentials-list">
                {!connected ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Connect your wallet</h3>
                    <p className="mt-1 text-sm text-gray-500">Connect your Sui wallet to create and manage verifiable credentials.</p>
                  </div>
                ) : credentialsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                  </div>
                ) : allCredentials.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No credentials yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first credential.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setIsProofModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Credential
                      </button>
                    </div>
                  </div>
                ) : (
                  allCredentials.map(cred => (
                    <CredentialCard
                      key={cred.id}
                      id={cred.id}
                      nullifier={cred.nullifier}
                      isRevoked={cred.isRevoked}
                      metadata={{
                        name: cred.name,
                        issuer: cred.issuer,
                        expiration: cred.expiration
                      }}
                      onInspect={() => handleInspectCredential(cred)}
                      onRevoke={() => handleRevokeCredential(cred)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Footer section */}
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">About SuiZkCred</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-600 mb-4">
                SuiZkCred is a zero-knowledge credential platform built on the Sui blockchain. It enables privacy-preserving
                identity verification without exposing personal data.              
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-800 mb-2">Privacy First</h3>
                  <p className="text-sm text-indigo-600">Keep your personal data private while proving claims about your identity.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800 mb-2">Sui Blockchain</h3>
                  <p className="text-sm text-purple-600">Leveraging Sui's speed, security, and smart contract capabilities.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Open Infrastructure</h3>
                  <p className="text-sm text-blue-600">Build applications on top of verifiable, private credential system.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Demo Mode Button */}
      <DemoModeButton />
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SuiZkCred. Built for hack demonstration purposes only.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Proof generation modal */}
      <ProofModal 
        isOpen={isProofModalOpen} 
        onClose={() => setIsProofModalOpen(false)}
        onCredentialCreated={handleCredentialCreated}
        packageId={process.env.NEXT_PUBLIC_PACKAGE_ID}
        registryId={process.env.NEXT_PUBLIC_REGISTRY_ID}
      />
    </div>
  );
}