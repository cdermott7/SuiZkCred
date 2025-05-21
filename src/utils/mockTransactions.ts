'use client';

// This file provides mock implementations for blockchain transactions
// It simulates successful transactions without actually interacting with the blockchain

/**
 * Mock function to simulate signing and executing a transaction
 * This avoids errors with the wallet extension by bypassing it completely
 */
export async function mockSignAndExecuteTransaction(options: any): Promise<any> {
  console.log('Mocking transaction execution with options:', options);
  
  // Wait a short time to simulate blockchain latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate occasional transaction failures to make the demo more realistic
  if (Math.random() < 0.05) { // 5% chance of failure
    throw new Error('Transaction simulation failed: network congestion');
  }
  
  // Generate a fake digest for the transaction
  const digest = generateMockDigest();
  
  // Return a mock successful transaction result
  return {
    digest,
    timestamp_ms: Date.now(),
    transaction: {
      data: {
        messageVersion: 1,
        transaction: {
          kind: 'ProgrammableTransaction',
          inputs: [],
          transactions: []
        },
        sender: '0x' + '0'.repeat(64),
        gasData: {
          payment: [],
          owner: '0x' + '0'.repeat(64),
          price: '1000',
          budget: '5000000'
        }
      },
      txSignatures: []
    },
    effects: {
      status: { status: 'success' },
      executedEpoch: '0',
      gasUsed: {
        computationCost: '1000',
        storageCost: '1000',
        storageRebate: '0'
      },
      transactionDigest: digest,
      created: [
        {
          owner: { AddressOwner: '0x' + '0'.repeat(64) },
          reference: {
            objectId: generateMockObjectId(),
            version: '1',
            digest: generateMockDigest()
          }
        }
      ],
      mutated: [],
      deleted: [],
      unwrapped: [],
      wrapped: [],
      gasObject: {
        owner: { AddressOwner: '0x' + '0'.repeat(64) },
        reference: {
          objectId: generateMockObjectId(),
          version: '1',
          digest: generateMockDigest()
        }
      },
      eventsDigest: null,
      dependencies: []
    },
    objectChanges: [],
    balanceChanges: [],
    events: []
  };
}

/**
 * Generate a mock object ID for simulation
 */
function generateMockObjectId(): string {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate a mock digest for transaction simulation
 */
function generateMockDigest(): string {
  return Array.from({ length: 44 }, () => 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[Math.floor(Math.random() * 64)]
  ).join('');
}