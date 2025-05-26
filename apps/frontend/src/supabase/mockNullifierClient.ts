'use client';

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

// Local storage key for mock nullifier database
const NULLIFIER_STORAGE_KEY = 'suizkcred:nullifiers';

/**
 * Mock client for managing nullifiers in local storage
 */
export class MockNullifierClient {
  // Get stored nullifiers from localStorage
  private getNullifiers(): Record<string, NullifierData> {
    if (typeof window === 'undefined') {
      return {};
    }
    
    const storedData = localStorage.getItem(NULLIFIER_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  }
  
  // Save nullifiers to localStorage
  private saveNullifiers(nullifiers: Record<string, NullifierData>): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.setItem(NULLIFIER_STORAGE_KEY, JSON.stringify(nullifiers));
  }

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
    const nullifiers = this.getNullifiers();
    
    // Check if the nullifier already exists
    if (nullifiers[nullifier]) {
      throw new Error(`Nullifier ${nullifier} already exists`);
    }
    
    // Create a new nullifier record
    const id = `nul_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    const newNullifier: NullifierData = {
      id,
      nullifier,
      credential_type: credentialType,
      revoked: false,
      expiration_date: expirationDate.toISOString(),
      created_at: now,
      updated_at: now
    };
    
    // Store the nullifier
    nullifiers[nullifier] = newNullifier;
    this.saveNullifiers(nullifiers);
    
    return newNullifier;
  }

  /**
   * Revoke a nullifier
   * @param nullifier The nullifier value to revoke
   * @param reason Optional reason for revocation
   * @returns The updated nullifier record
   */
  async revokeNullifier(nullifier: string, reason?: string): Promise<NullifierData> {
    const nullifiers = this.getNullifiers();
    
    // Check if the nullifier exists
    if (!nullifiers[nullifier]) {
      throw new Error(`Nullifier ${nullifier} does not exist`);
    }
    
    // Update the nullifier
    const now = new Date().toISOString();
    nullifiers[nullifier] = {
      ...nullifiers[nullifier],
      revoked: true,
      revocation_reason: reason,
      revoked_at: now,
      updated_at: now
    };
    
    // Save the updated nullifiers
    this.saveNullifiers(nullifiers);
    
    return nullifiers[nullifier];
  }

  /**
   * Check if a nullifier exists and is not revoked
   * @param nullifier The nullifier value to check
   * @returns True if the nullifier is valid (exists and not revoked)
   */
  async checkNullifier(nullifier: string): Promise<boolean> {
    const nullifiers = this.getNullifiers();
    
    // If the nullifier doesn't exist or is revoked, it's not valid
    if (!nullifiers[nullifier] || nullifiers[nullifier].revoked) {
      return false;
    }
    
    return true;
  }

  /**
   * Get all nullifiers
   * @param includeRevoked Whether to include revoked nullifiers
   * @returns Array of nullifier records
   */
  async getUserNullifiers(includeRevoked: boolean = true): Promise<NullifierData[]> {
    const nullifiers = this.getNullifiers();
    
    return Object.values(nullifiers).filter(n => includeRevoked || !n.revoked);
  }
}

// Export singleton instance
export const mockNullifierClient = new MockNullifierClient();
export default mockNullifierClient;