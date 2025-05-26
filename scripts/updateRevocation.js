#!/usr/bin/env node

/**
 * This script updates the on-chain Merkle tree with revoked credential nullifiers
 * It reads revoked nullifiers from Supabase and computes a new Merkle root
 */

const { createClient } = require('@supabase/supabase-js');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Keypair, Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { keccak256 } = require('@noble/hashes/sha3');
const { MerkleTree } = require('merkletreejs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sui client initialization
const rpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('testnet');
const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
const revocationRegistryId = process.env.NEXT_PUBLIC_REVOCATION_REGISTRY_ID;
const privateKeyHex = process.env.SUI_ADMIN_PRIVATE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!packageId || !revocationRegistryId || !privateKeyHex) {
  console.error('Missing Sui configuration in .env.local');
  process.exit(1);
}

/**
 * Fetches revoked nullifiers from Supabase
 * @returns {Promise<string[]>} Array of nullifier strings
 */
async function fetchRevokedNullifiers() {
  try {
    // Query the nullifiers table for revoked credentials
    const { data, error } = await supabase
      .from('nullifiers')
      .select('nullifier')
      .eq('revoked', true);

    if (error) {
      throw error;
    }

    console.log(`Found ${data.length} revoked nullifiers`);
    return data.map(row => row.nullifier);
  } catch (error) {
    console.error('Error fetching revoked nullifiers:', error);
    throw error;
  }
}

/**
 * Builds a Merkle tree from nullifiers and returns the root
 * @param {string[]} nullifiers Array of nullifier strings
 * @returns {Buffer} Merkle root as a Buffer
 */
function buildMerkleTree(nullifiers) {
  // If no nullifiers, return empty buffer
  if (nullifiers.length === 0) {
    return Buffer.alloc(32, 0);
  }

  // Hash function for the Merkle tree
  const hashFn = (data) => {
    return Buffer.from(keccak256(Buffer.from(data, 'hex')));
  };

  // Create leaves by hashing each nullifier
  const leaves = nullifiers.map(nullifier => 
    hashFn(nullifier.startsWith('0x') ? nullifier.slice(2) : nullifier)
  );

  // Build the Merkle tree
  const tree = new MerkleTree(leaves, hashFn, { sortPairs: true });
  
  // Get the Merkle root
  const root = tree.getRoot();
  
  console.log(`Computed Merkle root: 0x${root.toString('hex')}`);
  
  // Save the tree for later verification
  fs.writeFileSync(
    path.resolve(__dirname, '../data/revocation_tree.json'),
    JSON.stringify({
      root: `0x${root.toString('hex')}`,
      nullifiers,
      timestamp: new Date().toISOString(),
    }, null, 2)
  );
  
  return root;
}

/**
 * Updates the on-chain revocation Merkle root
 * @param {Buffer} merkleRoot The new Merkle root
 */
async function updateOnChainMerkleRoot(merkleRoot) {
  try {
    // Initialize Sui client
    const suiClient = new SuiClient({ url: rpcUrl });
    
    // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKeyHex, 'hex'));
    
    // Build the transaction
    const tx = new TransactionBlock();
    
    // Call the update_revocation_merkle_root function
    tx.moveCall({
      target: `${packageId}::credential::update_revocation_merkle_root`,
      arguments: [
        tx.object(revocationRegistryId),
        tx.pure(Array.from(merkleRoot)),
      ],
    });
    
    // Sign and execute the transaction
    const result = await suiClient.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    console.log('Transaction executed:', result.digest);
    
    // Check if transaction succeeded
    if (result.effects?.status?.status === 'success') {
      console.log('Successfully updated revocation Merkle root on-chain!');
      
      // Extract events for logging
      const events = result.events || [];
      for (const event of events) {
        if (event.type.includes('MerkleRootUpdated')) {
          console.log('Merkle root updated event:', event);
        }
      }
    } else {
      console.error('Transaction failed:', result.effects?.status);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating on-chain Merkle root:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting revocation update process...');
    
    // Create data directory if it doesn't exist
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Fetch revoked nullifiers from Supabase
    const nullifiers = await fetchRevokedNullifiers();
    
    // Build Merkle tree and get root
    const merkleRoot = buildMerkleTree(nullifiers);
    
    // Update on-chain Merkle root
    await updateOnChainMerkleRoot(merkleRoot);
    
    console.log('Revocation update completed successfully!');
  } catch (error) {
    console.error('Revocation update failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();