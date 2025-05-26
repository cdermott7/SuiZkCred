#!/bin/bash

# SuiZkCred Complete Setup Script
# This script sets up the entire SuiZkCred system with AI integration and ZK proofs

set -e

echo "🚀 SuiZkCred Complete Setup Starting..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the frontend directory.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking dependencies...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Check if Sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo -e "${YELLOW}⚠️  Sui CLI not found. You may need to install it for contract deployment.${NC}"
fi

echo -e "${GREEN}✅ Dependencies check completed${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Installing NPM packages...${NC}"
npm install
echo -e "${GREEN}✅ NPM packages installed${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Setting up environment variables...${NC}"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✅ Created .env.local from example${NC}"
    else
        echo -e "${RED}❌ .env.local.example not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env.local already exists. Skipping copy.${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 4: Contract setup...${NC}"

# Check if TypeScript compiler is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install npm properly.${NC}"
    exit 1
fi

# Try to run the contract setup
echo "Running contract initialization..."
if [ -f "scripts/setup-contract.ts" ]; then
    npx tsx scripts/setup-contract.ts || {
        echo -e "${YELLOW}⚠️  Contract setup failed. You may need to run this manually later.${NC}"
        echo "   Run: npx tsx scripts/setup-contract.ts"
    }
else
    echo -e "${YELLOW}⚠️  Contract setup script not found. Manual setup required.${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 5: Configuration summary${NC}"
echo ""
echo "📄 Your .env.local file configuration:"
echo "─────────────────────────────────────────"
grep -E "^[^#]" .env.local || echo "No configuration found"
echo ""

echo -e "${GREEN}🎉 Setup completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env.local file with the following:"
echo "   - Add your AI API keys (OpenAI, Anthropic, or Google AI)"
echo "   - Verify the contract object IDs are set correctly"
echo ""
echo "2. Start the development server:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Open your browser and navigate to:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "4. Connect your Sui wallet and start creating credentials!"
echo ""

# Show important environment variables that need to be set
echo -e "${YELLOW}⚠️  Important: Make sure these environment variables are set:${NC}"
echo ""
echo "Required for AI functionality:"
echo "- OPENAI_API_KEY=your_openai_api_key"
echo "- ANTHROPIC_API_KEY=your_anthropic_api_key (alternative)"
echo "- GOOGLE_AI_API_KEY=your_google_ai_api_key (alternative)"
echo ""
echo "Required for contract functionality:"
echo "- NEXT_PUBLIC_VERIFICATION_KEY_ID (set by contract setup)"
echo "- NEXT_PUBLIC_REGISTRY_ID (set by contract setup)"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "- See CONTRACT-INTEGRATION.md for detailed setup instructions"
echo "- Check the .env.local.example file for all configuration options"
echo ""

echo -e "${GREEN}✨ Happy coding with SuiZkCred!${NC}"