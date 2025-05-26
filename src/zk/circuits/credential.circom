pragma circom 2.0.0;

/*
 * This circuit takes a user ID (private) and credential type (public)
 * and creates a nullifier that can be used to track the credential
 * without revealing the user's identity
 */
template NullifierHasher() {
    // Private inputs
    signal input userId;
    signal input secretSalt;

    // Public inputs
    signal input credentialType;
    signal input expirationTimestamp;
    
    // Output signals
    signal output nullifier;
    signal output publicCredentialType;
    signal output publicExpirationTimestamp;
    
    // Simply pass through the credential type and expiration (they're public)
    publicCredentialType <== credentialType;
    publicExpirationTimestamp <== expirationTimestamp;
    
    // Compute the nullifier as a simple function of userId and salt
    // In a production system, we would use a stronger hash function
    nullifier <== userId * 1000000 + secretSalt;
    
    // Check credential type constraints (1-5)
    signal credTypeValid;
    credTypeValid <== (credentialType >= 1) * (credentialType <= 5); 
    credTypeValid === 1;
    
    // Check expiration timestamp is in the future
    // We could add more constraints in a real system
    signal expirationValid;
    expirationValid <== (expirationTimestamp > 0); 
    expirationValid === 1;
}

component main {public [credentialType, expirationTimestamp]} = NullifierHasher();