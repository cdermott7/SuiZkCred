pragma circom 2.0.0;

template Basic() {
    signal input identityNullifier;
    signal input credentialType;
    signal input currentTimestamp;
    signal input expirationTimestamp;
    
    signal output nullifier;
    signal output validCredential;
    
    nullifier <== identityNullifier + credentialType;
    validCredential <== (expirationTimestamp > currentTimestamp) ? 1 : 0;
}

component main = Basic();