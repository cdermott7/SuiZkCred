'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function VerificationExplainer() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-6 py-3 text-base font-bold text-white bg-green-800 rounded-md hover:bg-green-700 shadow-lg border-2 border-green-400 transition-all duration-200"
        style={{ 
          textShadow: '0 0 10px rgba(51, 255, 51, 0.7)',
          boxShadow: '0 0 15px rgba(0, 255, 0, 0.5)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
          style={{ filter: 'drop-shadow(0 0 5px rgba(0, 255, 0, 0.7))' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        How ZK Verification Works
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600">
          <h2 className="text-xl font-bold text-white">How Zero-Knowledge Verification Works</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <div className="prose max-w-none">
            <h3>The Power of Zero-Knowledge Proofs</h3>
            <p>
              SuiZkCred uses zero-knowledge proofs (ZKPs) to allow you to prove certain facts about yourself 
              without revealing any underlying personal data.
            </p>
            
            <h4>The Verification Process</h4>
            <ol className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-semibold mr-3">1</div>
                <div>
                  <strong>Credential Creation:</strong> When you create a credential, SuiZkCred generates cryptographic values called "nullifiers" 
                  and "trapdoors" based on your identity and the credential type.
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-semibold mr-3">2</div>
                <div>
                  <strong>Zero-Knowledge Proof Generation:</strong> A mathematical proof is created that demonstrates you have the credential 
                  without revealing your private information. This proof is then stored on-chain.
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-semibold mr-3">3</div>
                <div>
                  <strong>On-Chain Verification:</strong> The proof is stored on the Sui blockchain, making it immutable and verifiable by 
                  any application. The proof includes a nullifier that prevents double-usage.
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-semibold mr-3">4</div>
                <div>
                  <strong>Presenting Credentials:</strong> When you need to prove a credential to a third party, they can verify your 
                  on-chain proof without seeing any of your private data.
                </div>
              </li>
            </ol>
            
            <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200">
              <h4 className="text-lg font-semibold mb-2">Technical Details</h4>
              <p className="mb-2">
                SuiZkCred implements Groth16 ZK-SNARKs using the Sui blockchain's native zero-knowledge proof verification capabilities. Our implementation uses real cryptographic zero-knowledge proofs generated with Circom circuits and verified on-chain.
              </p>
              <div className="flex flex-col md:flex-row gap-4 mt-4 mb-2">
                <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-indigo-800 mb-2">Circom Circuit</h5>
                  <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded">
                    <code>
{`pragma circom 2.1.5;

template CredentialCircuit() {
  // Private inputs
  signal input userId;
  signal input credentialType;
  signal input secretSalt;
  signal input expirationTimestamp;
  
  // Public outputs
  signal output nullifier;
  signal output publicCredentialType;
  signal output publicExpirationTimestamp;
  
  // Compute nullifier
  nullifier <== userId * 1000000 + secretSalt;
  
  // Pass through public values
  publicCredentialType <== credentialType;
  publicExpirationTimestamp <== expirationTimestamp;
}`}
                    </code>
                  </pre>
                </div>
                <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-indigo-800 mb-2">Sui Move Contract</h5>
                  <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded">
                    <code>
{`module credential_verifier {
  use sui::groth16;
  
  public fun verify_credential(
    vk: &CredentialVerificationKey,
    proof_bytes: vector<u8>,
    public_inputs_bytes: vector<u8>,
  ): bool {
    let proof_points = groth16::proof_points_from_bytes(proof_bytes);
    let public_inputs = groth16::public_proof_inputs_from_bytes(
      public_inputs_bytes
    );
    
    groth16::verify_groth16_proof(
      &groth16::bn254(), 
      &vk.prepared_vk, 
      &public_inputs, 
      &proof_points
    )
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>
              <p>
                We use a combination of cryptographic techniques to ensure:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Your private data never leaves your device</li>
                <li>On-chain storage is minimal and privacy-preserving</li>
                <li>Verification is efficient and low-cost on Sui</li>
                <li>Credentials can be revoked when necessary</li>
              </ul>
            </div>
            
            <h4 className="mt-6">Data Flow Diagram</h4>
            <div className="my-4 overflow-x-auto">
              <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div className="bg-blue-100 p-3 rounded-md text-center w-64 border border-blue-300">
                    <span className="block font-bold text-blue-800">User Device</span>
                    <span className="text-sm font-medium text-blue-700">Private data &amp; secret keys</span>
                  </div>
                  <div className="w-8 h-8 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="bg-green-100 p-3 rounded-md text-center w-64 border border-green-300">
                    <span className="block font-bold text-green-800">ZK Proof Generator</span>
                    <span className="text-sm font-medium text-green-700">Creates proof without seeing data</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="bg-yellow-100 p-3 rounded-md text-center w-64 border border-yellow-300">
                    <span className="block font-bold text-yellow-800">Private Metadata Storage</span>
                    <span className="text-sm font-medium text-yellow-700">Encrypted off-chain data</span>
                  </div>
                  <div className="w-8 h-8 flex-shrink-0 rotate-90">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-md text-center w-64 border border-purple-300">
                    <span className="block font-bold text-purple-800">Sui Blockchain</span>
                    <span className="text-sm font-medium text-purple-700">Public ZK proof &amp; nullifier</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-red-100 p-3 rounded-md text-center w-64 border border-red-300">
                    <span className="block font-bold text-red-800">Verifier/Application</span>
                    <span className="text-sm font-medium text-red-700">Confirms credential is valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}