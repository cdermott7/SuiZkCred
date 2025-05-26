module suizkcred::credential {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::vector;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    
    // Error codes
    const ECredentialTypeInvalid: u64 = 1;
    const ECredentialExpired: u64 = 2;
    const ECredentialRevoked: u64 = 3;
    const ENullifierExists: u64 = 4;
    
    // Represents a verifiable credential
    struct Credential has key, store {
        id: UID,
        nullifier: vector<u8>,
        credential_type: u64,
        expiration_timestamp: u64,
        issuer: address,
        revoked: bool
    }
    
    // Registry for all credentials
    struct CredentialRegistry has key {
        id: UID,
        // Maps nullifier to whether it's been used
        nullifiers: Table<vector<u8>, bool>
    }
    
    // Create the registry (called once)
    fun init(ctx: &mut TxContext) {
        let registry = CredentialRegistry {
            id: object::new(ctx),
            nullifiers: table::new(ctx)
        };
        
        transfer::share_object(registry);
    }
    
    // Creates a new credential
    public entry fun mint_and_transfer(
        nullifier: vector<u8>,
        credential_type: u64,
        expiration_timestamp: u64,
        registry: &mut CredentialRegistry,
        ctx: &mut TxContext
    ) {
        // Check if credential type is valid (1-5)
        assert!(credential_type >= 1 && credential_type <= 5, ECredentialTypeInvalid);
        
        // Check that nullifier hasn't been used before
        assert!(!table::contains(&registry.nullifiers, nullifier), ENullifierExists);
        
        // Create the credential
        let credential = Credential {
            id: object::new(ctx),
            nullifier,
            credential_type,
            expiration_timestamp,
            issuer: tx_context::sender(ctx),
            revoked: false
        };
        
        // Register the nullifier
        table::add(&mut registry.nullifiers, *&credential.nullifier, false);
        
        // Transfer the credential to sender
        transfer::transfer(credential, tx_context::sender(ctx));
    }
    
    // Verifies a credential is valid (not expired, not revoked)
    public fun verify(credential: &Credential, clock: &Clock): bool {
        // Check if expired
        let current_time = clock::timestamp_ms(clock) / 1000; // Convert to seconds
        if (credential.expiration_timestamp <= current_time) {
            return false
        };
        
        // Check if revoked
        if (credential.revoked) {
            return false
        };
        
        true
    }
    
    // Revokes a credential
    public entry fun revoke(credential: &mut Credential, registry: &mut CredentialRegistry) {
        credential.revoked = true;
        table::add(&mut registry.nullifiers, *&credential.nullifier, true);
    }
    
    // Get credential info as string for display
    public fun get_credential_info(credential: &Credential): String {
        let info = string::utf8(b"Credential Type: ");
        string::append(&mut info, credential_type_to_string(credential.credential_type));
        string::append(&mut info, string::utf8(b", Revoked: "));
        string::append(&mut info, if (credential.revoked) { string::utf8(b"Yes") } else { string::utf8(b"No") });
        
        info
    }
    
    // Convert credential type to string
    fun credential_type_to_string(cred_type: u64): String {
        if (cred_type == 1) { return string::utf8(b"Email Verification") };
        if (cred_type == 2) { return string::utf8(b"Basic KYC") };
        if (cred_type == 3) { return string::utf8(b"Advanced KYC") };
        if (cred_type == 4) { return string::utf8(b"DAO Membership") };
        if (cred_type == 5) { return string::utf8(b"Educational Credential") };
        
        string::utf8(b"Unknown")
    }
}