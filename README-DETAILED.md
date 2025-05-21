# SuiZkCred - Detailed Setup and Usage Guide

This document provides detailed instructions for setting up, configuring, and using the SuiZkCred frontend application.

## Prerequisites

- Node.js 18+ (recommended Node.js 20)
- npm or yarn
- A Sui wallet browser extension (recommended but not required for demo mode)
- Supabase account (for authentication and database)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/SuiZkCred.git
   cd SuiZkCred/apps/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables
   
   Create a `.env.local` file in the frontend directory with the following variables:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Sui Blockchain Configuration
   NEXT_PUBLIC_PACKAGE_ID=0x123...
   NEXT_PUBLIC_REGISTRY_ID=0x456...
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## Supabase Setup

1. Create a new Supabase project
2. Enable Email/Password authentication in the Auth settings
3. Run the following SQL in the SQL editor to create necessary tables:

```sql
-- Create nullifiers table
CREATE TABLE public.nullifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nullifier TEXT NOT NULL UNIQUE,
    credential_type INTEGER NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_nullifiers_nullifier ON public.nullifiers(nullifier);
CREATE INDEX idx_nullifiers_credential_type ON public.nullifiers(credential_type);

-- Set up RLS (Row Level Security)
ALTER TABLE public.nullifiers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read" ON public.nullifiers
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON public.nullifiers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON public.nullifiers
    FOR UPDATE USING (auth.role() = 'authenticated');
```

## Using the Application

### Demo Mode

1. Log in with the demo credentials:
   - Email: `demo@example.com`
   - Password: `password123`

2. Explore the application using the demo mode button (bottom right corner)

### Creating Your Own Account

1. Click "Don't have an account? Sign up" on the login page
2. Enter your email and password
3. Verify your email (in a production environment)

### Creating a Credential

1. Connect your Sui wallet (if available)
2. Click "Create Credential"
3. Optional: Upload a verification document (passport, driver's license)
4. Fill in the credential details:
   - User ID (e.g., email or other identifier)
   - Credential Display Name
   - Credential Type
   - Validity period
5. Click "Generate Credential"

### Managing Credentials

- View your credentials in the dashboard
- Click on a credential to view its details
- Use the "Revoke" button to revoke a credential

## Environment Modes

### Running in Demo Mode

In demo mode, the application simulates blockchain transactions and zero-knowledge proofs:

```bash
# Enable demo mode
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

### Running with Real Blockchain Connections

For connecting to the actual Sui blockchain:

```bash
# Use testnet
NEXT_PUBLIC_SUI_NETWORK=testnet npm run dev

# Use mainnet (once deployed)
NEXT_PUBLIC_SUI_NETWORK=mainnet npm run dev
```

## Troubleshooting

### Wallet Connection Issues

- Ensure you have a compatible Sui wallet extension installed
- Check that your wallet is on the correct network (testnet/mainnet)
- Try refreshing the page
- In demo mode, wallet connection is simulated

### Authentication Problems

- Clear browser cache and cookies
- Check that Supabase is properly configured
- Try the demo account to verify that authentication is working

### Mock Transaction Errors

- The demo mode uses mock transactions that simulate blockchain interactions
- These will succeed even without a real blockchain connection
- Check the browser console for detailed error information

## Extending the Application

See the `ENHANCEMENT-PLAN.md` file for detailed plans on how to extend and productionize this application.

## License

MIT