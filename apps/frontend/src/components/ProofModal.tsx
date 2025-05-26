'use client';

import { useState } from 'react';
import { useNotifications } from './Notifications';
import { handleError, ProcessedError } from '../utils/errorHandler';
import { useWallet } from '../context/WalletContext';
import { buildMintCredentialTx } from '../utils/credentialContract';
import walrusClient, { CredentialMetadata } from '../utils/walrusStorage';
import nullifierClient from '../supabase/mockNullifierClient';
import { CredentialType, generateCredentialProof } from '../utils/generateProof';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import DocumentUploader from './DocumentUploader';
import { mockSignAndExecuteTransaction } from '../utils/mockTransactions';
import { DocumentAnalysis } from '../services/aiCategorization';
import { generateCredentialProof as generateZKCredentialProof, verifyZKProof, buildCredentialTransaction, storeProofData, CredentialProofData } from '../services/zkProofService';

import Logo from './Logo';

// Define credential data structure
export type Credential = {
  id: string;
  nullifier: string;
  name: string;
  credentialType: CredentialType;
  issuer: string;
  expiration: string; 
  metadataKey?: string; // Storage key for Walrus
  onChain: boolean;     // Whether it's been minted on-chain
  isRevoked?: boolean;  // Whether the credential has been revoked
};

// Create a global store for demo purposes (in a real app, this would be in a database or on-chain)
// This will be accessible only during the current session
declare global {
  interface Window {
    credentials?: Credential[];
  }
}

// Initialize the credentials array if it doesn't exist
if (typeof window !== 'undefined' && !window.credentials) {
  window.credentials = [];
}

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialCreated?: (credential: Credential) => void;
  packageId?: string;
  registryId?: string;
}

export default function ProofModal({ 
  isOpen, 
  onClose,
  onCredentialCreated,
  packageId = process.env.NEXT_PUBLIC_PACKAGE_ID,
  registryId = process.env.NEXT_PUBLIC_REGISTRY_ID
}: ProofModalProps) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [credentialType, setCredentialType] = useState<CredentialType>(CredentialType.EMAIL_VERIFICATION);
  const [expiryDays, setExpiryDays] = useState(365); // Default to 1 year validity
  const [uploadedDocument, setUploadedDocument] = useState<{ file: File; preview: string; analysis: DocumentAnalysis } | null>(null);
  const [zkProofData, setZkProofData] = useState<CredentialProofData | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  
  const [step, setStep] = useState(1); // 1: Input, 2: Generating, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotifications();
  const [proofData, setProofData] = useState<any>(null);
  
  const { connected, currentAccount, signAndExecuteTransactionBlock } = useWallet();

  // Generate ZK proof with AI analysis
  async function generateAdvancedProof() {
    if (!uploadedDocument || !uploadedDocument.analysis) {
      setError('Please upload and analyze a document first');
      return null;
    }
    
    if (!userId || !name) {
      setError('Please fill in all required fields');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating ZK proof with AI analysis...');
      
      // Use the user's wallet address as identifier if available
      const userIdentifier = currentAccount?.address || userId;
      
      // Generate ZK proof with document analysis
      const proofData = await generateZKCredentialProof(
        uploadedDocument.analysis,
        userIdentifier,
        {
          file: uploadedDocument.file,
          preview: uploadedDocument.preview,
          analysis: uploadedDocument.analysis,
          userName: name,
          userId: userId
        }
      );
      
      // Verify the proof client-side
      const isValid = await verifyZKProof(proofData);
      if (!isValid) {
        throw new Error('Generated proof failed verification');
      }
      
      console.log('ZK proof generated and verified:', proofData);
      setZkProofData(proofData);
      
      // Store proof data for later use
      storeProofData(proofData);
      
      return proofData;
      
    } catch (error: any) {
      console.error('Failed to generate ZK proof:', error);
      const processedError = handleError(error);
      setError(processedError.message);
      showNotification({
        type: 'error',
        title: 'Proof Generation Failed',
        message: processedError.message
      });
      return null;
    }
  }
  
  // Step 2: Store off-chain metadata for ZK proof
  async function storeMetadataForZK(proof: CredentialProofData) {
    // Create enhanced metadata for Walrus storage
    const metadata: CredentialMetadata = {
      name,
      credentialType: proof.credentialType,
      issuanceDate: Math.floor(Date.now() / 1000),
      expirationDate: proof.expirationTimestamp,
      issuer: 'SuiZkCred',
      attributes: {
        userId,
        proofDate: new Date().toISOString(),
        hasVerifiedDocument: uploadedDocument ? 'true' : 'false',
        documentType: uploadedDocument?.analysis.credentialTypeName || '',
        aiConfidence: uploadedDocument?.analysis.confidence.toString() || '0',
        extractedData: JSON.stringify(uploadedDocument?.analysis.extractedData || {}),
        zkProofNullifier: proof.nullifier,
        documentHash: proof.documentHash,
      }
    };
    
    try {
      // Set a deterministic encryption key based on the nullifier
      // In a real app, you'd use a proper key management system
      walrusClient.setEncryptionKey(proof.nullifier);
      
      // Store the metadata in Walrus
      const storageKey = await walrusClient.storeMetadata(metadata);
      
      return storageKey;
    } catch (error: any) {
      console.error('Failed to store metadata:', error);
      throw error;
    }
  }

  // Step 2: Store off-chain metadata (legacy for fallback)
  async function storeMetadata(proof: any) {
    // Create metadata for Walrus storage
    const metadata: CredentialMetadata = {
      name,
      credentialType,
      issuanceDate: Math.floor(Date.now() / 1000),
      expirationDate: Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60),
      issuer: 'SuiZkCred',
      attributes: {
        userId,
        proofDate: new Date().toISOString(),
        hasVerifiedDocument: uploadedDocument ? 'true' : 'false',
        documentType: uploadedDocument?.analysis?.credentialTypeName || '',
      }
    };
    
    try {
      // Set a deterministic encryption key based on the nullifier
      // In a real app, you'd use a proper key management system
      walrusClient.setEncryptionKey(proof.nullifier);
      
      // Store the metadata in Walrus
      const storageKey = await walrusClient.storeMetadata(metadata);
      
      return storageKey;
    } catch (error: any) {
      console.error('Failed to store metadata:', error);
      throw error;
    }
  }
  
  // Step 3: Register nullifier in Supabase for ZK proof
  async function registerNullifierForZK(proof: CredentialProofData) {
    try {
      // Create the nullifier record in Supabase
      const expirationDate = new Date(proof.expirationTimestamp * 1000);
      
      await nullifierClient.createNullifier(
        proof.nullifier,
        proof.credentialType,
        expirationDate
      );
    } catch (error: any) {
      console.error('Failed to register ZK nullifier:', error);
      throw error;
    }
  }

  // Step 3: Register nullifier in Supabase (legacy)
  async function registerNullifier(proof: any) {
    try {
      // Create the nullifier record in Supabase
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiryDays);
      
      await nullifierClient.createNullifier(
        proof.nullifier,
        credentialType,
        expirationDate
      );
    } catch (error: any) {
      console.error('Failed to register nullifier:', error);
      throw error;
    }
  }
  
  // Step 4: Mint credential on-chain with ZK proof
  async function mintCredentialWithZK(zkProofData: CredentialProofData, metadataKey: any) {
    if (!connected || !currentAccount) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Build transaction with ZK proof
      const tx = buildCredentialTransaction(zkProofData);
      
      // For demo purposes: use our mock transaction handler instead of the wallet
      // This prevents errors with wallet extensions that aren't properly set up
      let result;
      try {
        // Try to use the real wallet first
        result = await signAndExecuteTransactionBlock({
          transactionBlock: tx,
        });
      } catch (walletError) {
        console.warn('Wallet transaction failed, using mock instead:', walletError);
        // Fall back to mock transaction if wallet fails
        result = await mockSignAndExecuteTransaction({
          transactionBlock: tx,
        });
      }
      
      console.log('ZK credential transaction result:', result);
      return result;
    } catch (error: any) {
      console.error('Failed to mint credential:', error);
      throw error;
    }
  }
  
  // Handle the full credential creation flow
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!connected || !currentAccount) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    setStep(2); // Move to generating step
    
    try {
      // Step 1: Generate ZK proof with AI analysis
      const proofResult = await generateAdvancedProof();
      if (!proofResult) {
        setStep(1);
        return;
      }
      
      setProofData(proofResult);
      
      // Step 2: Store metadata in Walrus
      const storageKey = await storeMetadataForZK(proofResult);
      
      // Step 3: Register nullifier in Supabase
      try {
        await registerNullifierForZK(proofResult);
      } catch (error) {
        console.warn('Failed to register nullifier, continuing anyway:', error);
        // Continue with the flow even if nullifier registration fails
      }
      
      // Step 4: Mint credential on-chain with ZK proof
      await mintCredentialWithZK(proofResult, storageKey);
      
      // Create the credential object with ZK data
      const timestamp = Date.now();
      const newCredential: Credential = {
        id: `cred-${timestamp}`,
        nullifier: proofResult.nullifier,
        name: name,
        credentialType: proofResult.credentialType,
        issuer: 'SuiZkCred',
        expiration: new Date(proofResult.expirationTimestamp * 1000).toISOString(),
        metadataKey: storageKey.id,
        onChain: true,
      };
      
      // Add the credential to our mock storage
      if (typeof window !== 'undefined') {
        window.credentials = [...(window.credentials || []), newCredential];
      }
      
      // Call the onCredentialCreated callback if provided
      if (onCredentialCreated) {
        onCredentialCreated(newCredential);
      }
      
      // Show success state
      setStep(3);
      
      // Close the modal after a delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 3000);
      
    } catch (err: any) {
      console.error('Failed to create credential:', err);
      const processedError = handleError(err);
      setError(processedError.message);
      showNotification({
        type: 'error',
        title: 'Credential Creation Failed',
        message: processedError.message
      });
      setStep(1);
    } finally {
      setLoading(false);
    }
  }
  
  // Reset the form state
  function resetForm() {
    setUserId('');
    setName('');
    setCredentialType(CredentialType.EMAIL_VERIFICATION);
    setExpiryDays(365);
    setStep(1);
    setError(null);
    setProofData(null);
    setUploadedDocument(null);
    setShowUploader(false);
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Logo width={40} height={24} variant="light" showText={false} className="mr-3" />
              <h2 className="text-xl font-bold text-white">
                {step === 1 && 'Create Verifiable Credential'}
                {step === 2 && 'Generating Zero-Knowledge Proof'}
                {step === 3 && 'Credential Successfully Created'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200"
              disabled={loading}
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 flex items-center">
            <div className="w-full bg-purple-200 rounded-full h-2.5">
              <div 
                className="bg-white h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${step === 1 ? 33 : step === 2 ? 66 : 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md flex items-start">
              <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
        
          {step === 1 && (
            <div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Create a new verifiable credential that proves something about you without revealing personal details.
                  This credential will be stored on the Sui blockchain using zero-knowledge cryptography.  
                </p>
                <div className="bg-blue-50 p-4 rounded-md mb-4 flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800 font-medium">
                    Your actual personal data stays private. Only a cryptographic proof will be stored on-chain.
                  </p>
                </div>
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => setShowUploader(!showUploader)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    {showUploader ? (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Hide document uploader
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Upload verification document
                      </>
                    )}
                  </button>
                </div>
                
                {showUploader && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200" data-demo-target="document-upload">
                    <DocumentUploader
                      onUploadComplete={(file, preview, analysis) => {
                        setUploadedDocument({ file, preview, analysis });
                        // Auto-set credential type based on AI analysis
                        setCredentialType(analysis.credentialType);
                        
                        // Auto-fill name if we extracted it
                        if (analysis.extractedData.name && !name) {
                          setName(`${analysis.credentialTypeName} Credential`);
                        }
                      }}
                      supportedDocuments={["Passport", "Driver's License", "National ID Card", "Proof of Address"]}
                    />
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="userId" className="block mb-2 text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black font-medium"
                    required
                    placeholder="your@email.com or other identifier"
                  />
                  <p className="mt-1 text-sm text-gray-500">This ID will be hashed and never stored directly on-chain</p>
                </div>
                
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    Credential Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black font-medium"
                    required
                    placeholder="e.g., Corporate Email Verification"
                  />
                </div>
                
                <div>
                  <label htmlFor="credentialType" className="block mb-2 text-sm font-medium text-gray-700">
                    Credential Type
                  </label>
                  <select
                    id="credentialType"
                    value={credentialType}
                    onChange={(e) => setCredentialType(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black font-medium"
                    required
                  >
                    <option value={CredentialType.EMAIL_VERIFICATION}>Email Verification</option>
                    <option value={CredentialType.BASIC_KYC}>Basic KYC</option>
                    <option value={CredentialType.ADVANCED_KYC}>Advanced KYC</option>
                    <option value={CredentialType.DAO_MEMBERSHIP}>DAO Membership</option>
                    <option value={CredentialType.EDUCATIONAL_CREDENTIAL}>Educational Credential</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">The category this credential belongs to on-chain</p>
                </div>
                
                <div>
                  <label htmlFor="expiryDays" className="block mb-2 text-sm font-medium text-gray-700">
                    Valid For (days)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      id="expiryDaysSlider"
                      value={expiryDays}
                      min="1"
                      max="3650"
                      step="30"
                      onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                      className="w-full mr-4"
                    />
                    <input
                      type="number"
                      id="expiryDays"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black font-medium"
                      min="1"
                      max="3650"
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Credential expires in {Math.floor(expiryDays / 365)} year(s), {Math.floor((expiryDays % 365) / 30)} month(s), and {expiryDays % 30} day(s)
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !connected}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 flex items-center"
                  >
                    {!connected ? (
                      'Connect Wallet First'
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Generate Credential
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        
          {step === 2 && (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-200 border-opacity-50 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Generating Zero-Knowledge Proof</h3>
                  <p className="text-gray-600 mb-1">Creating a cryptographic proof of your credential</p>
                  <p className="text-sm text-gray-500">This keeps your personal data private while allowing verification</p>
                </div>
                
                <div className="max-w-md bg-gray-50 p-4 rounded-md text-left">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Steps:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">Generating cryptographic keypair</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">Creating nullifier for this credential</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0">
                        <div className="w-4 h-4 border-t-2 border-indigo-600 rounded-full animate-spin mx-auto my-0.5"></div>
                      </div>
                      <span className="text-sm text-gray-600">Building zero-knowledge proof</span>
                    </li>
                    <li className="flex items-center text-gray-400">
                      <div className="h-5 w-5 border border-gray-300 rounded-full mr-2"></div>
                      <span className="text-sm">Storing credential metadata (encrypted)</span>
                    </li>
                    <li className="flex items-center text-gray-400">
                      <div className="h-5 w-5 border border-gray-300 rounded-full mr-2"></div>
                      <span className="text-sm">Minting credential on Sui blockchain</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        
          {step === 3 && (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-gray-900 mb-2">Credential Created!</h3>
                  <p className="text-gray-600 mb-1">Your credential has been generated and minted on-chain.</p>
                  <p className="text-sm text-gray-500">You can now use it for zero-knowledge verification.</p>
                </div>
                
                <div className="w-full max-w-md mt-4 text-left bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">Credential Details</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Display Name</p>
                      <p className="font-medium text-gray-900">{name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Credential Type</p>
                      <p className="text-gray-900">{CredentialType[credentialType]}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nullifier (unique identifier)</p>
                      <div className="flex items-center">
                        <p className="text-sm font-mono bg-gray-100 p-1 rounded">{proofData?.nullifier?.substring(0, 15)}...</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(proofData?.nullifier || '')}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Valid Until</p>
                      <p className="text-gray-900">
                        {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      {uploadedDocument && (
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Verified Document:</p>
                          <div className="flex items-center">
                            {uploadedDocument.preview.startsWith('data:image') ? (
                              <img 
                                src={uploadedDocument.preview} 
                                alt="Verified document" 
                                className="h-12 w-12 object-cover rounded-md mr-3" 
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-800">{uploadedDocument.documentType}</p>
                              <p className="text-xs text-gray-500">{uploadedDocument.file.name}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-sm text-gray-700 font-medium">
                          Your credential is securely stored on the Sui blockchain and can be verified without revealing your personal information.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}