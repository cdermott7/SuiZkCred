'use client';

// Simplified crypto for the browser
function createMockEncryption(key: string, data: string): { iv: string, data: string } {
  // Simple XOR "encryption" for demo purposes only
  const iv = Math.random().toString(36).substring(2, 18);
  const encryptedData = Array.from(data).map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
  
  return {
    iv,
    data: encryptedData
  };
}

function createMockDecryption(key: string, iv: string, data: string): string {
  // Simple XOR "decryption" for demo purposes only
  return Array.from(data).map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

/**
 * Interface for the Walrus storage key
 */
export interface StorageKey {
  id: string;
  type: string; // 'storage_key'
  walrusId: string;
}

/**
 * Interface for the encrypted metadata
 */
export interface EncryptedMetadata {
  iv: string;
  data: string;
  encryptionVersion: string; // For versioning the encryption scheme
}

/**
 * Interface for the credential metadata
 */
export interface CredentialMetadata {
  name: string;
  credentialType: number;
  issuanceDate: number;
  expirationDate: number;
  issuer: string;
  attributes?: Record<string, any>; // Additional attributes specific to the credential type
}

// Storage key for mock Walrus storage
const WALRUS_STORAGE_KEY = 'suizkcred:walrus';

/**
 * Mock client for interacting with metadata storage
 */
export class WalrusStorageClient {
  private encryptionKey: string | null = null;

  /**
   * Set the encryption key for the client
   * @param key The encryption key to use
   */
  setEncryptionKey(key: string) {
    this.encryptionKey = key;
  }

  /**
   * Get all stored metadata
   */
  private getStorage(): Record<string, EncryptedMetadata> {
    if (typeof window === 'undefined') {
      return {};
    }
    
    const stored = localStorage.getItem(WALRUS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }
  
  /**
   * Save metadata to storage
   */
  private saveStorage(data: Record<string, EncryptedMetadata>): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.setItem(WALRUS_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Store metadata
   * @param metadata The credential metadata to store
   * @param storageKey Optional storage key to use (if null, creates a new one)
   * @returns The storage key for retrieving the metadata
   */
  async storeMetadata(
    metadata: CredentialMetadata,
    storageKey?: StorageKey,
  ): Promise<StorageKey> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    // Encrypt the metadata
    const encryptedMetadata = this.encryptMetadata(metadata);
    
    // Generate a unique ID if not provided
    const walrusId = `walrus-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const id = storageKey?.id || walrusId;
    
    // Create a storage key object
    const newStorageKey: StorageKey = {
      id,
      type: 'storage_key',
      walrusId,
    };
    
    // Store in localStorage
    const storage = this.getStorage();
    storage[walrusId] = encryptedMetadata;
    this.saveStorage(storage);
    
    return newStorageKey;
  }

  /**
   * Retrieve metadata
   * @param storageKey The storage key for the metadata
   * @returns The decrypted credential metadata
   */
  async retrieveMetadata(storageKey: StorageKey): Promise<CredentialMetadata> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }
    
    const storage = this.getStorage();
    const encryptedMetadata = storage[storageKey.walrusId];
    
    if (!encryptedMetadata) {
      // Demo fallback
      return {
        name: 'Demo Credential',
        credentialType: 1,
        issuanceDate: Math.floor(Date.now() / 1000) - 86400, // Yesterday
        expirationDate: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year from now
        issuer: 'SuiZkCred Demo Issuer',
        attributes: {
          userId: 'demo@example.com',
          verifiedOn: new Date().toISOString()
        }
      };
    }
    
    // Decrypt the metadata
    return this.decryptMetadata(encryptedMetadata);
  }

  /**
   * Encrypt metadata for storage
   * @param metadata The credential metadata to encrypt
   * @returns The encrypted metadata
   */
  private encryptMetadata(metadata: CredentialMetadata): EncryptedMetadata {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }
    
    // Convert metadata to string
    const metadataStr = JSON.stringify(metadata);
    
    // Mock encryption
    const { iv, data } = createMockEncryption(this.encryptionKey, metadataStr);
    
    return {
      iv,
      data,
      encryptionVersion: 'mock-v1',
    };
  }

  /**
   * Decrypt metadata from storage
   * @param encryptedMetadata The encrypted metadata
   * @returns The decrypted credential metadata
   */
  private decryptMetadata(encryptedMetadata: EncryptedMetadata): CredentialMetadata {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }
    
    // Mock decryption
    try {
      const decryptedData = createMockDecryption(
        this.encryptionKey,
        encryptedMetadata.iv,
        encryptedMetadata.data
      );
      
      // Parse the decrypted JSON
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt metadata:', error);
      
      // Return demo data on failure
      return {
        name: 'Demo Credential',
        credentialType: 1,
        issuanceDate: Math.floor(Date.now() / 1000) - 86400, // Yesterday
        expirationDate: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year
        issuer: 'SuiZkCred Demo',
        attributes: {
          fallback: true
        }
      };
    }
  }
}

// Create and export a singleton instance
const walrusClient = new WalrusStorageClient();
// Set a default encryption key for demo
walrusClient.setEncryptionKey('demo-encryption-key-12345');

export default walrusClient;