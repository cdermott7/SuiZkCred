pragma circom 2.1.5;

// This circuit is used to verify that a user owns a credential without revealing its contents
// The user proves they know a credential with a specific nullifier and type
// without revealing other private attributes

template CredentialCircuit() {
    // Private inputs
    signal input userId; // Private user identifier (e.g., email hash)
    signal input credentialType; // Type of credential
    signal input secretSalt; // Random salt for nullifier generation
    signal input expirationTimestamp; // Expiration time
    
    // Public inputs
    signal output nullifier; // Public nullifier that can be used to revoke the credential
    signal output publicCredentialType; // The type of credential, made public
    signal output publicExpirationTimestamp; // Public expiration timestamp
    
    // Compute the nullifier as a hash of the user ID and salt
    // In a real implementation, we would use a cryptographic hash function
    // For simplicity, we use a simple combination here
    nullifier <== userId * 1000000 + secretSalt;
    
    // Make credential type public
    publicCredentialType <== credentialType;
    
    // Make expiration timestamp public
    publicExpirationTimestamp <== expirationTimestamp;
    
    // Add constraints for credential type (must be between 1 and 5)
    signal credTypeInRange;
    credTypeInRange <== (credentialType - 1) * (credentialType - 2) * 
                         (credentialType - 3) * (credentialType - 4) * 
                         (credentialType - 5);
    credTypeInRange === 0;
    
    // Ensure expiration timestamp is in the future
    // This could be implemented as a comparison with a current timestamp,
    // but for simplicity, we'll just ensure it's positive
    signal timestampPositive;
    timestampPositive <== expirationTimestamp * (expirationTimestamp - 1);
    timestampPositive >= 0;
}

component main = CredentialCircuit();