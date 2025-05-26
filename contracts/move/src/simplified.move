/// A simplified credential module for demonstration purposes
module suizkcred::zk_credential {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    
    /// Simple credential structure
    public struct Credential has key, store {
        id: UID,
        nullifier: String,
        credential_type: u64,
        issuer: address,
        expiration_timestamp: u64,
        revoked: bool,
    }
    
    /// Mint a new credential
    public fun mint(
        nullifier: vector<u8>,
        credential_type: u64,
        expiration_timestamp: u64,
        ctx: &mut TxContext
    ): Credential {
        let nullifier_str = string::utf8(nullifier);
        
        Credential {
            id: object::new(ctx),
            nullifier: nullifier_str,
            credential_type,
            issuer: tx_context::sender(ctx),
            expiration_timestamp,
            revoked: false,
        }
    }
    
    /// Mint and transfer a credential to the sender
    public entry fun mint_and_transfer(
        nullifier: vector<u8>,
        credential_type: u64,
        expiration_timestamp: u64,
        ctx: &mut TxContext
    ) {
        let credential = mint(
            nullifier,
            credential_type,
            expiration_timestamp,
            ctx
        );
        transfer::public_transfer(credential, tx_context::sender(ctx));
    }
    
    /// Revoke a credential
    public entry fun revoke(
        credential: &mut Credential
    ) {
        credential.revoked = true;
    }
    
    /// Verify that a credential is valid
    public fun verify(
        credential: &Credential,
        ctx: &TxContext
    ): bool {
        !credential.revoked && 
        credential.expiration_timestamp > tx_context::epoch(ctx)
    }
    
    /// Get the credential type
    public fun get_credential_type(credential: &Credential): u64 {
        credential.credential_type
    }
    
    /// Get the nullifier
    public fun get_nullifier(credential: &Credential): &String {
        &credential.nullifier
    }
    
    /// Get the expiration timestamp
    public fun get_expiration(credential: &Credential): u64 {
        credential.expiration_timestamp
    }
    
    /// Check if a credential is revoked
    public fun is_revoked(credential: &Credential): bool {
        credential.revoked
    }
    
    /// Check if a credential is expired
    public fun is_expired(credential: &Credential, ctx: &TxContext): bool {
        credential.expiration_timestamp < tx_context::epoch(ctx)
    }
}