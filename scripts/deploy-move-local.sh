#!/bin/bash

# Exit script if any command fails
set -e

# Store the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOVE_DIR="$PROJECT_ROOT/contracts/move"

# Ensure local Sui network is running
echo "Checking if local Sui network is running..."
if ! sui client ping; then
  echo "Starting local Sui network..."
  sui start &
  # Wait for network to start
  sleep 5
  echo "Local Sui network started."
else
  echo "Local Sui network is already running."
fi

# Build the Move package
echo "Building Move package..."
cd $MOVE_DIR
sui move build

# Deploy the package to the local network
echo "Publishing Move package to local network..."
RESULT=$(sui client publish --gas-budget 100000000)
echo "$RESULT"

# Extract the package ID from the publish result
PACKAGE_ID=$(echo "$RESULT" | grep -oP 'packageId: \K0x[0-9a-f]+')
echo "Successfully published package with ID: $PACKAGE_ID"

# Update the Move.toml with the package ID
sed -i.bak "s/0x0/$PACKAGE_ID/g" "$MOVE_DIR/Move.toml"
echo "Updated Move.toml with package ID: $PACKAGE_ID"

echo ""
echo "==== Deployment Summary ===="
echo "Package ID: $PACKAGE_ID"
echo ""
echo "To use the simplified_credential module, call the following functions:"
echo "- mint_and_transfer"
echo "- revoke"
echo ""
echo "Example:"
echo "sui client call --package $PACKAGE_ID --module simplified_credential --function mint_and_transfer --args [some_nullifier_bytes] 1 [timestamp] --gas-budget 10000000"