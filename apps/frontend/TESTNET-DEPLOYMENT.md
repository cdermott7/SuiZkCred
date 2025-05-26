# SuiZkCred Testnet Deployment Guide

This document outlines the process for deploying the SuiZkCred application to the Sui testnet with zero-knowledge proof verification.

## Prerequisites

- Sui CLI installed and configured for testnet
- Node.js and npm installed
- Access to a testnet faucet for SUI tokens

## Deployment Steps

### 0. Prerequisites

Make sure you have the following installed:

```bash
# Install circom
npm install -g circom

# Install snarkjs
npm install -g snarkjs
```

### 1. Build and Deploy the Move Package

```bash
# Navigate to the Move package directory
cd /Users/coledermott/SuiZkCred/move

# Build the package
sui move build

# Publish the package to testnet
sui client publish --gas-budget 100000000
```

After publishing, note the following important IDs from the output:
- Package ID: The ID of the deployed Move package
- Registry ID: The ID of the shared CredentialRegistry object
- VerificationKey ID: The ID of the shared CredentialVerificationKey object

### 2. Create a Verification Key on Testnet

```bash
# Get the verification key bytes
node -e "require('./src/zk/setupMockSnark').getMockVerificationKeyHex()"

# Use the output to create a verification key on-chain
sui client call --package <PACKAGE_ID> --module credential_verifier --function create_verification_key --args <VERIFICATION_KEY_BYTES> --gas-budget 100000000
```

Note the object ID of the created verification key.

### 3. Set Up ZK Data

Run the mock ZK data generator to create the necessary files:

```bash
# Run the generator script
node generate-mock-zk-data.js
```

This will:
1. Create a mock verification key that's compatible with Sui
2. Set up the necessary directory structure
3. Print instructions for deploying the verification key

### 4. Deploy the Verification Key

Use the command printed by the setup script to deploy the verification key to the testnet:

```bash
sui client call --package <PACKAGE_ID> --module credential_verifier --function create_verification_key --args 0x<verification_key_hex> --gas-budget 100000000
```

Note the object ID of the created verification key.

### 5. Configure the Frontend for Testnet

Update the `.env.testnet` file with the values obtained from the deployment:

```
NEXT_PUBLIC_PACKAGE_ID=<your_package_id>
NEXT_PUBLIC_REGISTRY_ID=<your_registry_id>
NEXT_PUBLIC_USE_REAL_ZK=true
NEXT_PUBLIC_VERIFICATION_KEY_ID=<your_verification_key_id>
```

### 4. Run the Frontend with Testnet Configuration

```bash
# Start the application with testnet configuration
./run-testnet.sh
```

## Testing the Deployment

1. Open the application at http://localhost:3001
2. Log in with the demo credentials
3. Create a new credential
4. Verify that the credential is created successfully with ZK proof verification
5. Check the transaction on the Sui testnet explorer

## Troubleshooting

If you encounter issues with the ZK verification:

1. Check that the package was deployed correctly
2. Verify that the verification key was created correctly
3. Ensure the environment variables are set correctly
4. Check the browser console for any errors

If zero-knowledge verification fails, the application will fall back to regular credential creation.

## Notes on the Implementation

For this testnet deployment, we're using:

1. **Mock ZK Proofs**: We're generating simulated ZK proofs for demonstration purposes
2. **Simplified Circuit**: Our Circom circuit is simplified to demonstrate the concept
3. **Sui's Groth16 Verification**: We're leveraging Sui's native Groth16 verification capabilities

In a production environment, you would:

1. Use a more sophisticated ZK circuit with proper cryptographic guarantees
2. Conduct a trusted setup ceremony for the proving/verification keys
3. Implement more robust error handling and security measures
4. Add comprehensive testing for the ZK proof generation and verification