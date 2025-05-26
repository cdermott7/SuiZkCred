# SuiZkCred

A privacy-preserving credential framework built on Sui blockchain.

## Overview

SuiZkCred enables:

- **Anonymous Credential Issuance**: Trusted issuers generate zk-SNARK proofs off-chain and users mint soul-bound credential NFTs on Sui without revealing personal data.
- **On-chain Verification & Revocation**: A Move module verifies SNARK proofs, mints anonymous NFTs, and maintains a Merkle-tree revocation registry.
- **Programmable Storage**: Encrypted user metadata (expiration, pseudonym) resides in Walrus-backed storage, indexed on-chain for efficient lookup.
- **Developer DX**: A Next.js frontend, TypeScript SDK, CLI tool, and VS Code extension simplify circuit compilation, proof generation, and integration in consumer dApps.

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Sui CLI

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/SuiZkCred.git
   cd SuiZkCred
   ```

2. Install dependencies
   ```bash
   yarn install
   ```

3. Set up your environment variables
   Copy `.env.local.example` to `.env.local` in the `apps/frontend` directory and fill in your Supabase and Sui credentials.

4. Start the development server
   ```bash
   yarn dev
   ```

## Project Structure

- `apps/frontend`: Next.js application with React 18 and Tailwind CSS
- `circuits`: ZK circuit definitions using Circom 2.0
- `contracts/move`: Sui Move module for on-chain verification and NFT minting
- `scripts`: Utility scripts for deployment, compilation, etc.

## Features

- Self-sovereign identity through zero-knowledge proofs
- Privacy-preserving credential verification
- Efficient on-chain revocation through Merkle trees
- Encrypted metadata storage via Sui Walrus
- User-friendly interfaces for credential management

## License

This project is licensed under the MIT License - see the LICENSE file for details.