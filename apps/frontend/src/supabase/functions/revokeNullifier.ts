// Supabase Edge Function to revoke a nullifier

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestParams {
  nullifier: string;
  reason?: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the system key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { nullifier, reason } = await req.json() as RequestParams;

    // Validate inputs
    if (!nullifier) {
      return new Response(
        JSON.stringify({ error: 'Missing nullifier' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if nullifier exists
    const { data: existingData, error: existingError } = await supabase
      .from('nullifiers')
      .select('id, revoked')
      .eq('nullifier', nullifier)
      .maybeSingle();

    if (existingError) {
      return new Response(
        JSON.stringify({ error: `Database error: ${existingError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!existingData?.id) {
      return new Response(
        JSON.stringify({ error: 'Nullifier not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingData.revoked) {
      return new Response(
        JSON.stringify({ error: 'Nullifier already revoked', id: existingData.id }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Revoke the nullifier
    const { data, error } = await supabase
      .from('nullifiers')
      .update({
        revoked: true,
        revocation_reason: reason || 'Manual revocation',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', existingData.id)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Queue a job to update the on-chain Merkle tree
    // This would typically be handled by a separate process or webhook
    // That triggers the updateRevocation.js script

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        message: 'Nullifier revoked. On-chain update will be processed shortly.' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});