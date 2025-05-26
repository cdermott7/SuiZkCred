#!/usr/bin/env tsx

/**
 * Contract Setup Script
 * Initializes the VerifierKey and RevocationRegistry objects needed for the contract
 * Run this once after deploying the contract
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { buildCreateVerifierKeyTx, buildInitRevocationRegistryTx } from '../src/utils/contractSetup';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const NETWORK = 'testnet';
const PACKAGE_ID = '0x18a2f5290fa353c2b0a6518232e689d613b5b0cae8295bbb8d805d60cf56a3aa';

async function setupContract() {
  console.log('🚀 Setting up SuiZkCred contract...\n');

  // Initialize Sui client
  const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
  
  // Load or create keypair
  let keypair: Ed25519Keypair;
  const keyPath = path.join(__dirname, '..', '.sui-keypair');
  
  if (fs.existsSync(keyPath)) {
    const keyData = fs.readFileSync(keyPath, 'utf8');
    keypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyData)));
    console.log('✅ Loaded existing keypair');
  } else {
    keypair = new Ed25519Keypair();
    fs.writeFileSync(keyPath, JSON.stringify(Array.from(keypair.getSecretKey())));
    console.log('✅ Created new keypair and saved to', keyPath);
  }

  const address = keypair.getPublicKey().toSuiAddress();
  console.log('📍 Using address:', address);

  // Check balance
  const balance = await client.getBalance({ owner: address });
  console.log('💰 SUI Balance:', parseInt(balance.totalBalance) / 1_000_000_000, 'SUI\n');

  if (parseInt(balance.totalBalance) < 100_000_000) { // Less than 0.1 SUI
    console.log('⚠️  Low balance! Get testnet SUI from: https://testnet.sui.io/gas');
    console.log('   Your address:', address);
    return;
  }

  try {
    // Step 1: Create VerifierKey
    console.log('📋 Step 1: Creating VerifierKey...');
    const verifierKeyTx = buildCreateVerifierKeyTx();
    
    const verifierKeyResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: verifierKeyTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    if (verifierKeyResult.effects?.status?.status !== 'success') {
      throw new Error('Failed to create VerifierKey: ' + verifierKeyResult.effects?.status?.error);
    }

    const verifierKeyId = verifierKeyResult.objectChanges?.find(
      change => change.type === 'created' && change.objectType.includes('VerifierKey')
    )?.objectId;

    if (!verifierKeyId) {
      throw new Error('Could not find VerifierKey object ID in transaction result');
    }

    console.log('✅ VerifierKey created:', verifierKeyId);

    // Step 2: Create RevocationRegistry
    console.log('📋 Step 2: Creating RevocationRegistry...');
    const registryTx = buildInitRevocationRegistryTx();
    
    const registryResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: registryTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    if (registryResult.effects?.status?.status !== 'success') {
      throw new Error('Failed to create RevocationRegistry: ' + registryResult.effects?.status?.error);
    }

    const registryId = registryResult.objectChanges?.find(
      change => change.type === 'created' && change.objectType.includes('RevocationRegistry')
    )?.objectId;

    if (!registryId) {
      throw new Error('Could not find RevocationRegistry object ID in transaction result');
    }

    console.log('✅ RevocationRegistry created:', registryId);

    // Step 3: Update .env.local file
    console.log('\n📋 Step 3: Updating environment variables...');
    
    const envPath = path.join(__dirname, '..', '.env.local');
    const envExamplePath = path.join(__dirname, '..', '.env.local.example');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }

    // Update the environment variables
    envContent = envContent.replace(
      /NEXT_PUBLIC_VERIFICATION_KEY_ID=.*/,
      `NEXT_PUBLIC_VERIFICATION_KEY_ID=${verifierKeyId}`
    );
    envContent = envContent.replace(
      /NEXT_PUBLIC_REGISTRY_ID=.*/,
      `NEXT_PUBLIC_REGISTRY_ID=${registryId}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local with object IDs');

    // Summary
    console.log('\n🎉 Contract setup complete!');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│                          SUMMARY                               │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│ Package ID:        ${PACKAGE_ID} │`);
    console.log(`│ VerifierKey ID:    ${verifierKeyId} │`);
    console.log(`│ Registry ID:       ${registryId} │`);
    console.log(`│ Network:           ${NETWORK}                                    │`);
    console.log(`│ Your Address:      ${address} │`);
    console.log('└─────────────────────────────────────────────────────────────────┘');

    console.log('\n📝 Next steps:');
    console.log('1. Set up your AI API keys in .env.local');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Test credential minting and verification');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupContract().catch(console.error);
}

export { setupContract };