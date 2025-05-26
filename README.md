# SuiZkCred - AI-Powered Zero-Knowledge Credentials on Sui

A privacy-preserving credential framework built on Sui blockchain with AI document analysis.

## 🎯 Overview

SuiZkCred is a **privacy-first** identity verification platform that combines AI document analysis with zero-knowledge proofs on the Sui blockchain. It enables users to create and manage verifiable credentials without revealing their personal information.

### Key Features

- **🤖 AI Document Analysis**: Automatic categorization of 9 credential types using OpenAI/Anthropic/Google AI
- **🔐 Zero-Knowledge Proofs**: Verify identity without revealing sensitive data
- **⛓️ On-Chain Verification**: Smart contract integration with deployed CredentialVerifier
- **🏛️ Self-Custodial Identity**: Users maintain full control of their credentials
- **📄 Document Upload**: Upload and analyze identity documents for verification
- **❌ Revocation Support**: Efficient nullifier-based credential revocation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Sui CLI (optional, for contract interaction)
- OpenAI/Anthropic/Google AI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/cdermott7/SuiZkCred.git
cd SuiZkCred/apps/frontend

# Run the complete setup
./setup-complete.sh

# Or manual setup:
npm install
cp .env.local.example .env.local
# Edit .env.local with your API keys
npm run dev
```

### Configuration

Edit `.env.local` with your credentials:

```bash
# Required: AI API Key (choose one)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Smart Contract (auto-configured)
NEXT_PUBLIC_PACKAGE_ID=0x18a2f5290fa353c2b0a6518232e689d613b5b0cae8295bbb8d805d60cf56a3aa
```

## 🎮 Demo Instructions

### Live Demo

Visit [http://localhost:3000](http://localhost:3000) after setup.

### Demo Flow

1. **Connect Wallet** or use demo mode
2. **Upload Document**: Try sample passport or driver's license
3. **AI Analysis**: Watch real-time AI categorization
4. **Create Credential**: Generate ZK proof and mint on-chain
5. **Verify & Manage**: View, verify, and revoke credentials

## 🏗️ Architecture

### How It Works

1. **📤 Document Upload**: Users upload identity documents
2. **🧠 AI Analysis**: Multi-provider AI categorizes document type with confidence scoring
3. **🔒 ZK Proof Generation**: Creates cryptographic proof without storing personal data
4. **⛓️ On-Chain Minting**: Smart contract verifies proof and mints credential NFT
5. **✅ Verification**: Third parties can verify credentials without seeing underlying data

### Supported Credential Types

1. **Email Verification** - Email confirmation credentials
2. **Basic KYC** - Basic identity verification
3. **Advanced KYC** - Enhanced identity verification
4. **DAO Membership** - Decentralized organization membership
5. **Education** - Diplomas, degrees, certificates
6. **Passport** - Travel document verification
7. **Driver License** - Driving license verification
8. **National ID** - Government identity cards
9. **Proof of Address** - Utility bills, statements

## 📁 Project Structure

```
SuiZkCred/
├── apps/frontend/              # Next.js application
│   ├── src/
│   │   ├── services/          # AI categorization & ZK proofs
│   │   ├── components/        # React components
│   │   ├── utils/            # Contract integration
│   │   └── app/api/          # API routes
│   └── scripts/              # Setup and deployment
├── circuits/                  # ZK circuit definitions
├── contracts/move/           # Sui Move contracts
└── SuiZkCred/               # Deployed contract source
```

## 💻 Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Blockchain**: Sui Move smart contracts
- **AI**: OpenAI GPT-4, Anthropic Claude, Google AI
- **ZK**: Circom circuits with snarkjs
- **Storage**: Encrypted Walrus storage
- **Auth**: Supabase integration

## 📋 Smart Contract

**Deployed Contract**: `0x18a2f5290fa353c2b0a6518232e689d613b5b0cae8295bbb8d805d60cf56a3aa`

### Contract Functions
- `verify_and_mint`: Create credential with ZK proof
- `revoke_credential`: Revoke existing credential
- `is_valid`: Check credential validity

## 🔧 Development

### Local Development

```bash
npm run dev              # Start development server
npm run build           # Build for production
npx tsx scripts/setup-contract.ts  # Initialize contract objects
```

### Environment Setup

See `CONTRACT-INTEGRATION.md` for detailed setup instructions.

## 📚 Documentation

- **[IMPLEMENTATION-COMPLETE.md](./IMPLEMENTATION-COMPLETE.md)** - Complete feature overview
- **[CONTRACT-INTEGRATION.md](./CONTRACT-INTEGRATION.md)** - Smart contract setup
- **[.env.local.example](./apps/frontend/.env.local.example)** - Configuration reference

## 🎯 Use Cases

- **DeFi Identity**: KYC verification for decentralized finance
- **DAO Membership**: Proof of eligibility without doxxing
- **Educational Credentials**: Academic verification system
- **Professional Licenses**: Industry certification management
- **Government ID**: Digital identity for citizen services

## 🛡️ Security & Privacy

- Zero-knowledge proofs ensure data privacy
- Nullifier system prevents credential reuse
- Client-side proof verification
- Encrypted metadata storage
- No personal data stored on-chain

## 🔮 Future Development

- Real ZK circuit implementations
- Production document verification
- Additional AI providers
- Mobile app development
- Enterprise integrations

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the Sui ecosystem**
