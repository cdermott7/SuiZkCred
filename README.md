# SuiZkCred - Zero-Knowledge Credentials on Sui

## Hackathon Demo Project

SuiZkCred is a **privacy-first** identity verification platform that leverages zero-knowledge proofs on the Sui blockchain. It allows users to create and manage verifiable credentials without revealing their personal information.

## Key Features

- **Zero-Knowledge Proofs**: Verify identity without revealing sensitive data
- **Self-Custodial Identity**: Users maintain control of their credentials 
- **Document Verification**: Upload identity documents for verification
- **On-Chain Credentials**: Store cryptographic proofs on Sui blockchain
- **Revocation Support**: Easily revoke credentials when needed

## Demo Instructions

### Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Mode

For hackathon presentations, we've included a demo mode:

1. Login with the demo credentials:
   - Email: `demo@example.com`
   - Password: `password123`

2. Create a credential:
   - Click "Create Credential" button
   - Upload a sample document (optional)
   - Fill in the credential details
   - Click "Generate Credential"

3. View and manage your credentials:
   - Inspect credential details
   - Revoke credentials as needed

## How It Works

SuiZkCred employs a privacy-preserving architecture:

1. **Document Upload**: Users verify identity by uploading documents
2. **ZK Proof Generation**: System generates a cryptographic proof without storing the document
3. **On-Chain Storage**: Only the proof is stored on the Sui blockchain, not the personal data
4. **Verification**: Third parties can verify credentials without seeing the underlying data

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain**: Sui (Move)
- **Authentication**: Supabase
- **Storage**: Encrypted client-side storage

## Hackathon Note

This is a demonstration project built for hackathon purposes. While the UI flow and architecture are complete, some components use simulated zero-knowledge proofs rather than actual cryptographic implementations.

## Presentation Tips

When demonstrating the application:

1. **Emphasize Privacy**: Highlight how personal data never leaves the device
2. **Show the Flow**: Create, view, and revoke credentials to show the full lifecycle
3. **Explain On-Chain Aspects**: Point out which data is stored on-chain vs. off-chain
4. **Target Use Cases**: Identity verification for DeFi, DAO membership, educational credentials

## Future Development

Post-hackathon development would include:

- Implementing actual zero-knowledge proof circuits
- Building production-ready document verification
- Integrating with real-world identity verification providers
- Adding more credential types and verification methods

## Original Next.js README

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## License

MIT