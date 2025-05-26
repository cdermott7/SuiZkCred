# Contract Integration Setup Guide

## Deployed Contract Information

- **Package ID**: `0x18a2f5290fa353c2b0a6518232e689d613b5b0cae8295bbb8d805d60cf56a3aa`
- **Module**: `CredentialVerifier`
- **Network**: Sui Testnet

## Setup Instructions

### 1. Environment Variables

Copy the environment template and fill in the required values:

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

Edit `.env.local` with the following values:

```bash
# Already set from deployment
NEXT_PUBLIC_PACKAGE_ID=0x18a2f5290fa353c2b0a6518232e689d613b5b0cae8295bbb8d805d60cf56a3aa

# You need to create these objects (see step 2)
NEXT_PUBLIC_VERIFICATION_KEY_ID=<your_verifier_key_object_id>
NEXT_PUBLIC_REGISTRY_ID=<your_registry_object_id>

# Network configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_DEMO_MODE=true
```

### 2. Initialize Contract Objects

Before using the contract, you need to create two objects:

#### A. Create VerifierKey Object

```typescript
import { buildCreateVerifierKeyTx } from './src/utils/contractSetup';

// Create and sign this transaction
const verifierKeyTx = buildCreateVerifierKeyTx();
// Execute and get the object ID from the transaction result
```

#### B. Create RevocationRegistry Object

```typescript
import { buildInitRevocationRegistryTx } from './src/utils/contractSetup';

// Create and sign this transaction
const registryTx = buildInitRevocationRegistryTx();
// Execute and get the object ID from the transaction result
```

### 3. Update Environment Variables

After creating the objects, update your `.env.local` file with the actual object IDs.

## Contract Functions Available

### Core Functions

1. **verify_and_mint**: Create a new credential with ZK proof verification
2. **revoke_credential**: Revoke an existing credential
3. **is_valid**: Check if a credential is still valid

### Helper Functions

- `buildMintCredentialTx()`: Build transaction to mint a new credential
- `buildRevokeCredentialTx()`: Build transaction to revoke a credential  
- `buildVerifyCredentialTx()`: Build transaction to verify a credential
- `generateNullifier()`: Generate a nullifier from input string

## Contract Structure

The deployed contract defines these key structs:

```move
// Verification key for ZK proofs
struct VerifierKey has key, store {
    id: UID,
    vk: PreparedVerifyingKey,
}

// Registry to track revoked credentials
struct RevocationRegistry has key, store {
    id: UID,
    nullifiers: Table<u64, bool>,
}

// The credential object that gets minted
struct Credential has key, store {
    id: UID,
    nullifier: u64,
    cred_type: u64,
    expires: u64,
    issuer: address,
}
```

## Credential Types

- 1: Email
- 2: Basic KYC
- 3: Advanced KYC
- 4: DAO Membership
- 5: Education
- 6: Passport
- 7: Driver License
- 8: National ID
- 9: Proof of Address

## Usage Example

```typescript
import { buildMintCredentialTx, generateNullifier } from './src/utils/contractSetup';

// Generate a credential
const nullifier = generateNullifier("user@example.com");
const credentialType = 1; // Email credential
const expirationTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year

const tx = buildMintCredentialTx(
  nullifier,
  credentialType, 
  expirationTimestamp,
  process.env.NEXT_PUBLIC_PACKAGE_ID,
  process.env.NEXT_PUBLIC_REGISTRY_ID
);

// Sign and execute the transaction with your wallet
```

## Next Steps

1. Set up the environment variables
2. Create the VerifierKey and RevocationRegistry objects
3. Update the frontend to use real ZK proofs instead of mock data
4. Test the full credential lifecycle (mint, verify, revoke)

## Troubleshooting

- Ensure all environment variables are set correctly
- Make sure the VerifierKey and RevocationRegistry objects exist before calling contract functions
- Check that you have enough SUI tokens for gas fees on testnet
- Verify the package ID matches the deployed contract