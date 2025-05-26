pragma circom 2.0.0;

template CredentialVerifier() {
    // Private inputs
    signal input identityNullifier; // User's secret nullifier
    signal input credentialType;    // Type of credential (e.g., 1 = email, 2 = KYC, 3 = DAO membership)
    
    // Public inputs
    signal input currentTimestamp;  // Current Unix timestamp (seconds)
    signal input expirationTimestamp; // When this credential expires
    
    // Public outputs
    signal output nullifier;       // Publicly reveals the credential nullifier (prevents double-use)
    signal output validCredential; // Boolean: 1 if credential is valid
    
    // Simple computation for nullifier
    nullifier <== identityNullifier + credentialType;
    
    // Simple expiration check: credential is valid if expirationTimestamp > currentTimestamp
    validCredential <== expirationTimestamp > currentTimestamp ? 1 : 0;
}

component main = CredentialVerifier();