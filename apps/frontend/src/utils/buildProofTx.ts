import { TransactionBlock } from '@mysten/sui.js/transactions';

/**
 * Build a transaction to mint a credential with a proof and nullifier
 * @param proof The ZK proof in JSON format
 * @param nullifier The nullifier value generated from the proof
 * @param packageId The package ID of the deployed Move module
 * @returns Transaction object ready for signing
 */
export function buildProofAndMintTx(
  proof: any,
  nullifier: string,
  metadata: string,
  packageId: string = process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0'
): TransactionBlock {
  // Convert nullifier to bytes
  const nullifierBytes = Array.from(new TextEncoder().encode(nullifier));
  
  // Convert metadata to bytes (in a real app, this would be encrypted)
  const metadataBytes = Array.from(new TextEncoder().encode(metadata));
  
  // Create new transaction block
  const tx = new TransactionBlock();
  
  // Call the mint_and_transfer function on the SuiZkCred module
  tx.moveCall({
    target: `${packageId}::credential::mint_and_transfer`,
    arguments: [
      tx.pure(nullifierBytes),
      tx.pure(metadataBytes),
    ],
  });
  
  return tx;
}

/**
 * Verify a credential on-chain
 * @param credentialId The object ID of the credential to verify
 * @param packageId The package ID of the deployed Move module
 * @returns Transaction object for the verification 
 */
export function buildVerifyCredentialTx(
  credentialId: string,
  packageId: string = process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0'
): TransactionBlock {
  const tx = new TransactionBlock();
  
  // Call the verify function
  tx.moveCall({
    target: `${packageId}::credential::verify`,
    arguments: [
      tx.object(credentialId),
    ],
  });
  
  return tx;
}