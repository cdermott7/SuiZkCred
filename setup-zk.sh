#!/bin/bash

# Install snarkjs globally if not already installed
if ! command -v snarkjs &> /dev/null; then
  echo "Installing snarkjs globally..."
  npm install -g snarkjs
fi

# Check if circom is installed
if ! command -v circom &> /dev/null; then
  echo "Error: circom is not installed. Please install it first."
  echo "Visit https://docs.circom.io/getting-started/installation/ for instructions."
  exit 1
fi

# Run the ZK setup script
echo "Setting up ZK circuit..."
node src/zk/setup.js

# Create the necessary directories in public
mkdir -p public/zk/wasm

# Copy the necessary files to the public directory
echo "Copying ZK artifacts to public directory..."
cp -r src/zk/wasm/* public/zk/wasm/

echo "ZK setup complete!"
echo ""
echo "To deploy the verification key to Sui testnet, run:"
echo "sui client call --package <PACKAGE_ID> --module credential_verifier --function create_verification_key --args 0x$(cat src/zk/wasm/credential_verification_key.hex) --gas-budget 100000000"
echo ""
echo "Then update .env.testnet with:"
echo "NEXT_PUBLIC_USE_REAL_ZK=true"
echo "NEXT_PUBLIC_VERIFICATION_KEY_ID=<verification_key_object_id>"