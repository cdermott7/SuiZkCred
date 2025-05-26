# SuiZkCred MVP: Granular Step‑by‑Step Build Plan

Each task below is designed to be: incredibly small, testable, and focused on one concern.
Follow in order and verify the **End** state before moving on.

---

## 1. Monorepo Initialization

**Task 1.1: Create root folder & initialize Git**

* **Start:** Empty directory.
* **End:** Git repo initialized (`.git` folder exists).
* **Test:** `git status` shows clean working tree.

**Task 1.2: Configure Yarn Workspaces**

* **Start:** `package.json` missing.
* **End:** Root `package.json` created with `workspaces: ["apps/*","packages/*"]`.
* **Test:** `yarn install` completes with no errors and `yarn workspaces info` lists two workspace patterns.

---

## 2. Frontend Setup (Next.js)

**Task 2.1: Scaffold Next.js App**

* **Start:** `apps/frontend` folder exists and is empty.
* **End:** Run `npx create-next-app@latest . --app --typescript --eslint` inside `apps/frontend`.
* **Test:** `yarn workspace apps-frontend dev` spins up at [http://localhost:3000](http://localhost:3000) with default page.

**Task 2.2: Install Tailwind CSS**

* **Start:** Clean Next.js TS project.
* **End:** Tailwind installed (`npm install -D tailwindcss postcss autoprefixer`), `tailwind.config.js` and globals set.
* **Test:** Add `<div className="text-red-500">Hello</div>` to `page.tsx`; page shows red text.

---

## 3. Supabase Integration

**Task 3.1: Create Supabase Project & Get Keys**

* **Start:** No Supabase config.
* **End:** New Supabase project created; `.env.local` in `apps/frontend` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* **Test:** Environment variables load: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)` prints the URL.

**Task 3.2: Add Supabase Client**

* **Start:** No Supabase client in code.
* **End:** `supabaseClient.ts` created exporting `createClient(...)`.
* **Test:** Import and call `supabase.from('profiles').select('*')` in `getServerSideProps`; no runtime errors.

**Task 3.3: Enable Auth**

* **Start:** Supabase Auth disabled.
* **End:** Configure Email/Password and OAuth providers in Supabase dashboard.
* **Test:** Use `supabaseClient.auth.signIn({ email, password })`; user session returns a valid JWT.

---

## 4. UI: Authentication Flow

**Task 4.1: Build Login Page**

* **Start:** No `/login` route.
* **End:** Create `app/login/page.tsx` with email/password form, calls `signIn`.
* **Test:** Submitting valid creds logs in and redirects to `/dashboard`.

**Task 4.2: Auth Context Provider**

* **Start:** No React context.
* **End:** `AuthContext` provides `user` and `signOut()`; wrap `layout.tsx`.
* **Test:** In `/dashboard`, `useContext(AuthContext).user` prints user email.

---

## 5. Circom Circuit Setup

**Task 5.1: Add Circuits Folder**

* **Start:** No `circuits` directory.
* **End:** `circuits/credential.circom` created with empty ZK circuit stub (e.g., a simple boolean check).
* **Test:** Run `npx snarkjs compile circuits/credential.circom`; no compile errors.

**Task 5.2: Write Compile Script**

* **Start:** Manual compile.
* **End:** `scripts/compile-circuit.sh` compiles and outputs `.wasm` + `.zkey` to `circuits/build/`.
* **Test:** Execute script; confirm `circuits/build/circuit.wasm` exists.

**Task 5.3: Proof Generation Helper**

* **Start:** No helper code.
* **End:** `circuits/generateProof.ts` loads `.wasm` & `.zkey`, runs `snarkjs` to output proof JSON.
* **Test:** `ts-node circuits/generateProof.ts` writes `proof.json` without errors.

---

## 6. Move Module Skeleton

**Task 6.1: Create Move Package**

* **Start:** `contracts/move` empty.
* **End:** `Move.toml` and `src/SuiZkCred.move` stub module with one placeholder function.
* **Test:** `sui move build contracts/move` succeeds.

**Task 6.2: Local Devnet Deployment Script**

* **Start:** Manual deploy.
* **End:** `scripts/deploy-move-local.sh` spins up Sui localnet and publishes the `SuiZkCred` module.
* **Test:** Running script prints module address in localnet.

---

## 7. Frontend → Sui Integration

**Task 7.1: Install Sui Wallet Adapter**

* **Start:** No Sui libs.
* **End:** `@mysten/wallet-adapter-react` and peers installed; `<WalletProvider>` wrapping app.
* **Test:** `useWallet()` returns connector list in console.

**Task 7.2: Build Transaction Helper**

* **Start:** No tx builder.
* **End:** `utils/buildProofTx.ts` exports `buildProofAndMintTx(proof, nullifier)`.
* **Test:** Import helper and call with dummy data; function returns a `Transaction` object.

**Task 7.3: Send Mint Transaction**

* **Start:** UI can’t call Sui.
* **End:** On “Mint” button click, call `signAndExecuteTransaction` with built tx.
* **Test:** Clicking runs wallet popup; transaction succeeds on localnet.

---

## 8. NFT & Storage Inspection

**Task 8.1: Fetch User NFTs**

* **Start:** No NFT list.
* **End:** `useCredentialList()` hook calls RPC to list NFTs by module.
* **Test:** Hook returns an array (possibly empty) without errors.

**Task 8.2: Display `<CredentialCard>`**

* **Start:** No card component.
* **End:** `components/CredentialCard.tsx` renders NFT ID and status.
* **Test:** Pass mock NFT data; card displays `ID: 0x...`.

**Task 8.3: Storage Inspector Component**

* **Start:** No inspector.
* **End:** `components/StorageInspector.tsx` fetches Walrus data by NFT pointer.
* **Test:** With test data in Walrus, inspector shows decrypted metadata.

---

## 9. Supabase Nullifier & Revocation

**Task 9.1: Create `nullifiers` Table**

* **Start:** Empty DB.
* **End:** Supabase SQL adds `nullifiers(id UUID primary key, nullifier TEXT, revoked BOOL)`.
* **Test:** `supabase.from('nullifiers').select()` returns an empty array.

**Task 9.2: Record Nullifier RPC**

* **Start:** No RPC.
* **End:** Supabase Edge Function `createNullifier` inserts new row.
* **Test:** Calling function via fetch inserts a row; `revoked` defaults to `false`.

**Task 9.3: Revocation Script**

* **Start:** Manual revocation.
* **End:** `scripts/updateRevocation.js` reads `nullifiers` where `revoked=true`, computes new Merkle root, and sends tx to Move module.
* **Test:** Mark a row `revoked=true`; script pushes updated root on-chain.

---

## 10. CI / CD Pipeline

**Task 10.1: Circom & Move Tests in CI**

* **Start:** No CI.
* **End:** GitHub Actions job that compiles circuit, runs `snarkjs` sanity check, builds Move module, and runs Move Prover tests.
* **Test:** Pushing to `main` triggers CI passing all steps.

**Task 10.2: Frontend Deploy**

* **Start:** No deployment.
* **End:** Configure Vercel via GitHub integration; Auto-deploy `apps/frontend` on push to `main`.
* **Test:** Merging to `main` publicly updates demo URL.

---

> *After completing all tasks, you will have a minimally viable SuiZkCred flow: user login → proof generation → on-chain mint → storage inspection → revocation.*

Feel free to adjust sequencing or split tasks further as needed!
