pragma circom 2.0.0;

// A simplified credential circuit for testing purposes
template SimpleCredential() {
    // Private inputs
    signal input userId;
    signal input secretSalt;
    
    // Public outputs
    signal output nullifier;
    
    // Simple nullifier calculation
    nullifier <== userId * 1000000 + secretSalt;
}

component main = SimpleCredential();