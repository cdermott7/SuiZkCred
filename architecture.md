# SuiZkCred Architecture

## 1. Project Overview

**SuiZkCred** is a privacy‑preserving credential framework built for Sui Overflow 2025. It enables:

* **Anonymous Credential Issuance**: Trusted issuers generate zk‑SNARK proofs off‑chain and users mint soul‑bound credential NFTs on Sui without revealing personal data.
* **On‑chain Verification & Revocation**: A Move module verifies SNARK proofs, mints anonymous NFTs, and maintains a Merkle‑tree revocation registry.
* **Programmable Storage**: Encrypted user metadata (expiration, pseudonym) resides in Walrus‑backed storage, indexed on‑chain for efficient lookup.
* **Developer DX**: A Next.js frontend, TypeScript SDK, CLI tool, and VS Code extension simplify circuit compilation, proof generation, and integration in consumer dApps.

This document lays out the full architecture using Next.js for the front end and Supabase for database & authentication.

---

## 2. Tech Stack

| Layer              | Technology                      |
| ------------------ | ------------------------------- |
| Frontend           | Next.js (App Router, React 18)  |
| Styling            | Tailwind CSS                    |
| Auth & Persistence | Supabase (Auth + Postgres DB)   |
| ZK Circuits        | Circom 2.0 + SnarkJS            |
| Move Contracts     | Sui Move modules                |
| On‑chain Storage   | Sui Walrus programmable storage |
| SDK & CLI          | TypeScript, Node.js             |
| Dev UX             | VS Code Extension API           |

---

## 3. File & Folder Structure

```bash
/ (monorepo root)
├── apps
│   └── frontend                # Next.js App
│       ├── public             
│       │   └── favicon.ico    
│       ├── src
│       │   ├── components     # Shared UI (Buttons, Modals, Inspectors)
│       │   ├── context        # React contexts (AuthContext, ProofContext)
│       │   ├── hooks          # SWR/useSWR hooks (useUser, useCredential)
│       │   ├── pages          # Next.js pages (/, /login, /dashboard)
│       │   ├── styles         # Global and component CSS
│       │   ├── utils          # helpers (circom compile, Move tx builders)
│       │   └── types          # shared TS interfaces
│       ├── supabase           # Supabase client & helpers
│       │   └── supabaseClient.ts
│       ├── circom             # Local WASM proofs & schema
│       │   ├── circuit.circom
│       │   ├── compile.sh
│       │   └── generateProof.ts
│       ├── move               # Move package for local devnet
│       │   ├── SuiZkCred.move
│       │   └── build.sh
│       ├── scripts            # Misc: deploy, seed data, revoke tree updater
│       ├── .env.local         # SUPABASE_URL, SUPABASE_KEY, SUI_RPC
│       └── package.json
│
├── contracts
│   └── move                   # Production Move modules & tests
│       ├── src
│       │   └── SuiZkCred.move
│       └── tests              # Move prover & unit tests
│
├── circuits                   # ZK circuits & tooling
│   ├── credential.circom
│   ├── trustedSetup.js
│   └── proofs                 # example proofs for CI
│
├── sdk                        # Reusable TS SDK & CLI
│   ├── src
│   │   ├── index.ts           # SDK entrypoint
│   │   ├── issuer.ts          # Circuit compile & proof API
│   │   ├── verifier.ts        # On‑chain proof & NFT mint helpers
│   │   └── storage.ts         # Walrus metadata client
│   ├── bin                    # CLI commands (zkcred-issue, zkcred-revoke)
│   └── package.json
│
├── vscode-extension           # VS Code plugin to inspect credentials
│   ├── src
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 4. Component Responsibilities

| Area            | Description                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| **pages/**      | Next.js routes for user flows: login (Supabase OAuth), dashboard (list credentials), issue page, verify page. |
| **components/** | Reusable UI: <CredentialCard>, <ProofModal>, <StorageInspector>, <NetworkSwitcher>.                           |
| **context/**    | React Context providers:                                                                                      |

* **AuthContext**: holds Supabase user session, refresh logic.
* **ProofContext**: holds proof generation status, lastProof, error state.  |
  \| **hooks/**              | SWR-based data fetching:
* **useUser()**: fetches current profile & anon ID from Supabase.
* **useCredential(id)**: fetch on-chain NFT data & off-chain metadata.  |
  \| **supabaseClient.ts**   | Initializes Supabase client; sets up auth listener; exports `supabase` for queries.             |
  \| **circom/**             | Local compilation & proof generation scripts; outputs `circuit.wasm` and `circuit.zkey`.        |
  \| **move/**               | Move package for devnet: compiles & publishes `SuiZkCred` module locally for testing.          |
  \| **scripts/**            | Automation scripts:
* **deploy.js**: deploy Move module to testnet.
* **updateRevocation.js**: sync new revocations from Supabase to on-chain Merkle.  |
  \| **contracts/**          | Production Move module & test suite (Move Prover checks).                                       |
  \| **circuits/**           | Production-ready circom circuit, trusted setup, proof fixtures for CI.                          |
  \| **sdk/**                | TypeScript library & CLI: enables external dApps to integrate issuance & verification flows.    |
  \| **vscode-extension/**   | VS Code UI to browse a wallet’s credentials & on‑chain state directly in editor.              |

---

## 5. State Management & Service Flow

1. **User Authentication**

   * Supabase Auth → React Context → `AuthContext.user`.
   * Persists JWT in browser; auto‑refresh token.

2. **Credential Issuance**

   1. User clicks “Issue Credential” → opens `<ProofModal>`.
   2. Frontend calls `generateProof()` (in `circom/generateProof.ts`) to compile circuit and produce proof & nullifier.
   3. Frontend calls Supabase function (`RPC` or Edge Function) to record nullifier in Postgres (for off‑chain indexing & revocation).
   4. Frontend invokes Sui Wallet Adapter to send a transaction to the on‑chain Move module, passing proof and nullifier.
   5. Move module verifies proof, mints a credential NFT to the user, and appends nullifier to the on‑chain Merkle revocation tree.

3. **Credential Storage & Lookup**

   * Metadata (expiration, pseudonym) encrypted and stored in Walrus.
   * On‑chain NFT holds pointer (Walrus key) to metadata.
   * `<StorageInspector>` queries Walrus via SDK to decrypt & display metadata.

4. **Revocation & Updates**

   * Admin UI or CLI calls `updateRevocation.js` → reads invalidated nullifiers from Supabase → pushes new Merkle root on-chain.

5. **Verification Flow**

   1. Consumer dApp (or built‑in `/verify` page) takes user proof & NFT ID.
   2. Calls Move module’s verify function (via Sui JSON‑RPC) to confirm on‑chain status (not revoked).
   3. If valid, SDK decrypts Walrus metadata, returns verified attributes to app.

---

## 6. Data & State Locations

| Data Type                  | Location                                 |
| -------------------------- | ---------------------------------------- |
| **Auth Session**           | Supabase Auth (JWT in LocalStorage)      |
| **User Profile**           | Supabase Postgres (`profiles` table)     |
| **Nullifier Registry**     | Supabase Postgres + on‑chain Merkle tree |
| **Credential NFT State**   | Sui blockchain                           |
| **Encrypted Metadata**     | Sui Walrus programmable storage          |
| **Circuit Artifacts**      | Hosted in Git / CI cache (WASM, ZKey)    |
| **SDK Config & Endpoints** | `.env.local` / runtime config            |

---

## 7. Integrations & Connections

1. **Next.js ↔ Supabase**: via `supabaseClient.ts`, SWR hooks, and Supabase Edge Functions.
2. **Next.js ↔ Circom**: local WASM via dynamic import; `generateProof.ts` wraps SnarkJS.
3. **Next.js ↔ Sui RPC**: Sui Wallet Adapter triggers JSON‑RPC calls to Move module.
4. **SDK ↔ Move**: TS functions build & sign transactions, verify proofs in‑code.
5. **Walrus ↔ Frontend**: via SDK’s storage client to fetch & decrypt metadata pointers stored on-chain.
6. **CI/CD**: GitHub Actions pipeline that:

   * Compiles Circom circuit & runs SnarkJS checks
   * Builds Move module & runs Move Prover tests
   * Deploys frontend to Vercel & publishes SDK to npm

---

With this architecture, **SuiZkCred** delivers a cohesive, end‑to‑end privacy credential solution—showcasing Sui’s cryptography, programmable storage, and developer tooling in one cohesive package.
