#!/bin/bash

# Set port to 3001
export PORT=3001

# Copy testnet environment file
cp .env.testnet .env.local

echo "Starting SuiZkCred frontend with Testnet configuration on http://localhost:3001"
echo ""
echo "*************************************************************************"
echo "* NOTE: To enable real ZK proofs:                                      *"
echo "* 1. Run node generate-mock-zk-data.js to generate mock ZK data         *"
echo "* 2. Deploy the verification key using the command printed by the script *"
echo "* 3. Edit .env.testnet and set NEXT_PUBLIC_USE_REAL_ZK=true            *"
echo "* 4. Add the verification key object ID to .env.testnet                 *"
echo "*************************************************************************"
echo ""
npm run dev -- -p 3001