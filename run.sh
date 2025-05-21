#!/bin/bash

# Set the port to 3001
export PORT=3001

# Set mock mode for demo purposes
export NEXT_PUBLIC_USE_MOCK_WALLET=true
export NEXT_PUBLIC_DEMO_MODE=true

# Run the development server
echo "Starting SuiZkCred frontend on http://localhost:3001"
npm run dev -- -p 3001