#!/bin/bash

# Generate the mock ZK data
echo "Generating mock ZK data..."
node generate-mock-zk-data.js

# Set port to 3001
export PORT=3001

# Copy testnet environment file with ZK enabled
cp .env.testnet .env.local
echo "NEXT_PUBLIC_USE_REAL_ZK=true" >> .env.local

echo "Starting SuiZkCred frontend with Testnet configuration and ZK enabled on http://localhost:3001"
echo ""
echo "This version performs client-side ZK proof generation and verification!"
echo ""

npm run dev -- -p 3001