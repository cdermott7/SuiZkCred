#!/bin/bash

# Set port to 3001
export PORT=3001

# Ensure ZK directory structure exists
mkdir -p public/zk/wasm/credential_js

# Generate mock ZK data if not already present
if [ ! -f public/zk/wasm/credential_verification_key.json ]; then
  echo "Generating mock ZK data..."
  node generate-mock-zk-data.js
fi

# Create a local .env file with demo settings
cat > .env.local << EOL
# Demo configuration with authentication bypass
NEXT_PUBLIC_SKIP_AUTH=true

# Sui Blockchain Configuration - Testnet values
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x31704da6cfd74cfb890db2032d2f470942412178b258e43a323fa4ca2f4797e2
NEXT_PUBLIC_REGISTRY_ID=0xf24790b54278bea23e8673c65f6ff4a5519b6d331e56cfab22e6a49f8fd3f62f

# ZK simulation mode
NEXT_PUBLIC_USE_REAL_ZK=true

# Demo mode enabled
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_USE_MOCK_WALLET=true
EOL

echo ""
echo "===================================================================================="
echo "  SuiZkCred Demo Mode"
echo "===================================================================================="
echo ""
echo "Starting application with:"
echo "- Authentication bypass enabled (no Supabase connection required)"
echo "- ZK proof simulation enabled (real circuit structure with simulated execution)"
echo "- Sui testnet contract integration"
echo ""
echo "The application will be available at: http://localhost:3001"
echo ""
echo "To use the application:"
echo "1. Click 'Quick Demo Login' or enter any email/password"
echo "2. Create credentials with the simulated ZK proof generation"
echo "3. View and manage your credentials"
echo ""
echo "===================================================================================="
echo ""

npm run dev -- -p 3001