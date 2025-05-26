import { supabase } from './supabaseClient';

/**
 * Interface for nullifier data
 */
export interface NullifierData {
  id: string;
  nullifier: string;
  credential_type: number;
  credential_id?: string;
  user_id?: string;
  revoked: boolean;
  expiration_date?: string;
  revocation_reason?: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Client for managing nullifiers in Supabase
 */
export class NullifierClient {
  /**
   * Create a new nullifier entry
   * @param nullifier The nullifier value
   * @param credentialType The type of credential
   * @param expirationDate When the credential expires
   * @returns The created nullifier record
   */
  async createNullifier(
    nullifier: string,
    credentialType: number,
    expirationDate: Date
  ): Promise<NullifierData> {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('createNullifier', {
      body: {
        nullifier,
        credentialType,
        expirationDate: expirationDate.toISOString(),
      },
    });

    if (error) {
      console.error('Error creating nullifier:', error);
      throw error;
    }

    // Fetch the created nullifier to return the full record
    const { data: nullifierData, error: fetchError } = await supabase
      .from('nullifiers')
      .select('*')
      .eq('id', data.id)
      .single();

    if (fetchError) {
      console.error('Error fetching created nullifier:', fetchError);
      throw fetchError;
    }

    return nullifierData;
  }

  /**
   * Revoke a nullifier
   * @param nullifier The nullifier value to revoke
   * @param reason Optional reason for revocation
   * @returns The updated nullifier record
   */
  async revokeNullifier(nullifier: string, reason?: string): Promise<NullifierData> {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('revokeNullifier', {
      body: {
        nullifier,
        reason,
      },
    });

    if (error) {
      console.error('Error revoking nullifier:', error);
      throw error;
    }

    // Fetch the updated nullifier to return the full record
    const { data: nullifierData, error: fetchError } = await supabase
      .from('nullifiers')
      .select('*')
      .eq('id', data.id)
      .single();

    if (fetchError) {
      console.error('Error fetching revoked nullifier:', fetchError);
      throw fetchError;
    }

    return nullifierData;
  }

  /**
   * Check if a nullifier exists and is not revoked
   * @param nullifier The nullifier value to check
   * @returns True if the nullifier is valid (exists and not revoked)
   */
  async checkNullifier(nullifier: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('nullifiers')
      .select('revoked')
      .eq('nullifier', nullifier)
      .maybeSingle();

    if (error) {
      console.error('Error checking nullifier:', error);
      throw error;
    }

    // If nullifier doesn't exist or is revoked, it's not valid
    if (!data || data.revoked) {
      return false;
    }

    return true;
  }

  /**
   * Get all nullifiers for the current user
   * @param includeRevoked Whether to include revoked nullifiers
   * @returns Array of nullifier records
   */
  async getUserNullifiers(includeRevoked: boolean = true): Promise<NullifierData[]> {
    let query = supabase
      .from('nullifiers')
      .select('*');

    if (!includeRevoked) {
      query = query.eq('revoked', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching nullifiers:', error);
      throw error;
    }

    return data || [];
  }
}

// Export singleton instance
export const nullifierClient = new NullifierClient();
export default nullifierClient;