'use client';

// Import our ZK proof generation utilities
import { generateZKProof, serializeProof } from '../zk/zkutils';
import { generateRealZKProof, prepareProofForSui, preparePublicInputsForSui } from '../zk/realZkProof';

// Define the credential types 
export enum CredentialType {
  EMAIL_VERIFICATION = 1,
  BASIC_KYC = 2,
  ADVANCED_KYC = 3,
  DAO_MEMBERSHIP = 4,
  EDUCATIONAL_CREDENTIAL = 5
}

// Generate a random field element (for nullifier/trapdoor)
export function generateRandomFieldElement(): string {
  // Generate a random 31-byte integer 
  if (typeof window !== 'undefined') {
    // Browser environment
    const array = new Uint8Array(31);
    window.crypto.getRandomValues(array);
    return BigInt('0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')).toString();
  } else {
    // Node.js environment
    const hex = randomBytes(31).toString('hex');
    return BigInt('0x' + hex).toString();
  }
}

/**
 * Generates a zero-knowledge credential proof using our ZK circuit
 */
export async function generateCredentialProof(
  credentialType: CredentialType,
  expirationInDays: number = 365,
  userId?: string,
  existingIdentity?: { nullifier: string }
): Promise<{ 
  proof: any; 
  publicSignals: any; 
  nullifier: string;
  metadata: {
    credentialType: CredentialType;
    issuanceDate: number;
    expirationDate: number;
    issuer: string;
  }
}> {
  // Generate a default userId if not provided
  const userIdToUse = userId || `user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  
  // Calculate timestamps
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + (expirationInDays * 24 * 60 * 60);
  
  // Check if we should use real ZK proofs or mock ones
  const useRealZk = process.env.NEXT_PUBLIC_USE_REAL_ZK === 'true';
  
  try {
    if (useRealZk) {
      console.log('Using real ZK proof generation');
      // Generate a real ZK proof if enabled
      const zkResult = await generateRealZKProof(
        userIdToUse,
        credentialType,
        expirationTimestamp
      );
      
      // Prepare proof for Sui blockchain
      const proofBytes = prepareProofForSui(zkResult.proof);
      const publicInputsBytes = preparePublicInputsForSui(zkResult.publicSignals);
      
      // Store for transaction building
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`proof_${zkResult.nullifier}`, proofBytes);
        window.localStorage.setItem(`public_inputs_${zkResult.nullifier}`, publicInputsBytes);
      }
      
      // Create metadata
      const metadata = {
        credentialType,
        issuanceDate: currentTimestamp,
        expirationDate: expirationTimestamp,
        issuer: "SuiZkCred"
      };
      
      return { 
        proof: zkResult.proof, 
        publicSignals: zkResult.publicSignals, 
        nullifier: zkResult.nullifier, 
        metadata 
      };
    } else {
      console.log('Using mock ZK proof generation');
      // Use mock ZK proof generation
      const { proof, nullifier } = await generateZKProof(
        userIdToUse,
        credentialType,
        expirationTimestamp
      );
      
      // Serialize for blockchain consumption
      const { proofBytes, publicInputsBytes } = serializeProof(proof);
      
      // Store these values for transaction building
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`proof_${nullifier}`, proofBytes);
        window.localStorage.setItem(`public_inputs_${nullifier}`, publicInputsBytes);
      }
      
      // Create metadata
      const metadata = {
        credentialType,
        issuanceDate: currentTimestamp,
        expirationDate: expirationTimestamp,
        issuer: "SuiZkCred"
      };
      
      return { 
        proof: proof.proof, 
        publicSignals: proof.publicSignals, 
        nullifier, 
        metadata 
      };
    }
  } catch (error) {
    console.error('Error in ZK proof generation:', error);
    console.log('Falling back to mock ZK proof generation');
    
    // Fallback to mock ZK proof generation
    const { proof, nullifier } = await generateZKProof(
      userIdToUse,
      credentialType,
      expirationTimestamp
    );
    
    // Serialize for blockchain consumption
    const { proofBytes, publicInputsBytes } = serializeProof(proof);
    
    // Store these values for transaction building
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`proof_${nullifier}`, proofBytes);
      window.localStorage.setItem(`public_inputs_${nullifier}`, publicInputsBytes);
    }
    
    // Create metadata
    const metadata = {
      credentialType,
      issuanceDate: currentTimestamp,
      expirationDate: expirationTimestamp,
      issuer: "SuiZkCred"
    };
    
    return { 
      proof: proof.proof, 
      publicSignals: proof.publicSignals, 
      nullifier, 
      metadata 
    };
  }
}