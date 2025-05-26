// Supabase Edge Function to create a new nullifier entry

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestParams {
  nullifier: string;
  credentialType: number;
  expirationDate: string; // ISO date string
}

serve(async (req) => {
  try {
    // Create a Supabase client with the system key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { nullifier, credentialType, expirationDate } = await req.json() as RequestParams;

    // Validate inputs
    if (!nullifier) {
      return new Response(
        JSON.stringify({ error: 'Missing nullifier' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if nullifier already exists
    const { data: existingData, error: existingError } = await supabase
      .from('nullifiers')
      .select('id')
      .eq('nullifier', nullifier)
      .maybeSingle();

    if (existingError) {
      return new Response(
        JSON.stringify({ error: `Database error: ${existingError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingData?.id) {
      return new Response(
        JSON.stringify({ error: 'Nullifier already exists', id: existingData.id }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert the new nullifier
    const { data, error } = await supabase
      .from('nullifiers')
      .insert({
        nullifier,
        credential_type: credentialType,
        expiration_date: expirationDate,
        revoked: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});