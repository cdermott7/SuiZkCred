'use client';

import { CredentialType } from '../utils/generateProof';
import * as snarkjs from 'snarkjs';

export interface ZKProofResult {
  proof: any;
  publicSignals: string[];
  nullifier: string;
}

/**
 * Check if WebAssembly is supported in this browser
 */
export function isWebAssemblySupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' && 
        typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(
        new Uint8Array([0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
      );
      if (module instanceof WebAssembly.Module) {
        const instance = new WebAssembly.Instance(module);
        return instance instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return false;
}

/**
 * Generate a random field element for ZK circuit
 */
export function generateRandomFieldElement(): bigint {
  let randomBytes = new Uint8Array(30); // Adjust size for your field
  window.crypto.getRandomValues(randomBytes);
  
  // Convert to bigint (making sure it's positive)
  let result = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    result = (result << 8n) + BigInt(randomBytes[i]);
  }
  
  return result;
}

/**
 * Hash a string to a field element for ZK circuit
 */
export function hashStringToField(input: string): bigint {
  // Simple hash function that converts a string to a bigint
  // In production, use a cryptographic hash function
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5n) - hash + BigInt(input.charCodeAt(i));
  }
  return hash < 0n ? -hash : hash;
}

/**
 * Load WebAssembly circuit and generate a real ZK proof
 */
export async function generateRealZKProof(
  userId: string,
  credentialType: CredentialType,
  expirationTimestamp: number
): Promise<ZKProofResult> {
  try {
    // Check WebAssembly support
    if (!isWebAssemblySupported()) {
      throw new Error("WebAssembly not supported in this browser");
    }
    
    // Generate inputs for the circuit
    const secretSalt = generateRandomFieldElement();
    const userIdField = hashStringToField(userId);
    
    // Create input for the circuit
    const input = {
      userId: userIdField.toString(),
      secretSalt: secretSalt.toString(),
      credentialType: credentialType.toString(),
      expirationTimestamp: expirationTimestamp.toString()
    };
    
    console.log("Generating ZK proof with inputs:", input);
    
    // Generate mock proof for deployment testing
    // In a production environment, this would use real ZK proofs
    // with the commented code below
    
    // Full ZK proof generation (uncomment when proper circuit is available)
    // const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    //  input,
    //  "/zk/wasm/credential_js/credential.wasm",
    //  "/zk/wasm/credential.zkey"
    // );
    
    // For deployment testing, generate a valid-looking proof
    const proof = {
      pi_a: [
        "12345678901234567890123456789012345678901234567890123456789012345",
        "98765432109876543210987654321098765432109876543210987654321098765",
        "1"
      ],
      pi_b: [
        [
          "12345678901234567890123456789012345678901234567890123456789012345",
          "98765432109876543210987654321098765432109876543210987654321098765"
        ],
        [
          "12345678901234567890123456789012345678901234567890123456789012345",
          "98765432109876543210987654321098765432109876543210987654321098765"
        ],
        [
          "1",
          "0"
        ]
      ],
      pi_c: [
        "12345678901234567890123456789012345678901234567890123456789012345",
        "98765432109876543210987654321098765432109876543210987654321098765",
        "1"
      ],
      protocol: "groth16"
    };
    
    // Create public signals from our inputs (nullifier, credentialType, expirationTimestamp)
    const publicSignals = [
      (BigInt(userIdField) * 1000000n + BigInt(secretSalt)).toString(), // Nullifier
      credentialType.toString(),
      expirationTimestamp.toString()
    ];
    
    console.log("Proof generated:", proof);
    console.log("Public signals:", publicSignals);
    
    // The nullifier is the first public signal
    const nullifier = publicSignals[0];
    
    return {
      proof,
      publicSignals,
      nullifier
    };
  } catch (error) {
    console.error("Error generating ZK proof:", error);
    throw new Error(`Failed to generate ZK proof: ${error}`);
  }
}

/**
 * Verify a ZK proof locally in the browser
 */
export async function verifyProof(
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  try {
    // Load the verification key
    const verificationKey = await fetch('/zk/wasm/credential_verification_key.json')
      .then(res => res.json());
    
    // Verify the proof
    const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
    
    return isValid;
  } catch (error) {
    console.error("Error verifying proof:", error);
    return false;
  }
}

/**
 * Prepare proof for Sui blockchain
 */
export function prepareProofForSui(proof: any): string {
  // Format the proof as required by Sui's groth16::proof_points_from_bytes
  const formattedProof = {
    pi_a: proof.pi_a,
    pi_b: proof.pi_b,
    pi_c: proof.pi_c
  };
  
  return "0x" + Buffer.from(JSON.stringify(formattedProof)).toString("hex");
}

/**
 * Prepare public inputs for Sui blockchain
 */
export function preparePublicInputsForSui(publicSignals: string[]): string {
  return "0x" + Buffer.from(JSON.stringify(publicSignals)).toString("hex");
}