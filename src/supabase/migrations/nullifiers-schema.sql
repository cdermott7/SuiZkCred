-- Schema for nullifier tracking and revocation

-- Create nullifiers table
CREATE TABLE IF NOT EXISTS public.nullifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nullifier TEXT NOT NULL UNIQUE,
  credential_type INTEGER NOT NULL,
  credential_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index on nullifier for fast lookups
CREATE INDEX IF NOT EXISTS idx_nullifiers_nullifier ON public.nullifiers(nullifier);

-- Add index on revoked for fast filtering
CREATE INDEX IF NOT EXISTS idx_nullifiers_revoked ON public.nullifiers(revoked);

-- Add index on user_id for filtering by user
CREATE INDEX IF NOT EXISTS idx_nullifiers_user_id ON public.nullifiers(user_id);

-- Create revocation_logs table to track revocation history
CREATE TABLE IF NOT EXISTS public.revocation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nullifier_id UUID REFERENCES public.nullifiers(id) NOT NULL,
  old_merkle_root TEXT,
  new_merkle_root TEXT NOT NULL,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up updated_at trigger on nullifiers table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.nullifiers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security (RLS) policies
ALTER TABLE public.nullifiers ENABLE ROW LEVEL SECURITY;

-- Policy for all users to see non-revoked nullifiers (public view)
CREATE POLICY "Public can view non-revoked nullifiers" ON public.nullifiers
  FOR SELECT
  USING (revoked = false);

-- Policy for authenticated users to see their own nullifiers
CREATE POLICY "Users can see their own nullifiers" ON public.nullifiers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for authenticated users to create their own nullifiers
CREATE POLICY "Users can create nullifiers" ON public.nullifiers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to see all nullifiers
CREATE POLICY "Admins can access all nullifiers" ON public.nullifiers
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users WHERE is_admin = true
  ));

-- This assumes you have an is_admin column in auth.users
-- If not, you'll need to create a separate admins table or use a different approach

-- Grant permissions
GRANT SELECT ON public.nullifiers TO public;
GRANT INSERT, UPDATE ON public.nullifiers TO authenticated;
GRANT ALL ON public.nullifiers TO service_role;