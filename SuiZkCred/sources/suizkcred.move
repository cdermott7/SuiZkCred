module suizkcred::credential {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::walrus::{Self, Entry, StorageKey};
    use sui::table::{Self, Table};
    use sui::bls12381::bls12381_min_pk_verify; // For verifying BLS signatures
    use sui::event;
    use std::vector;
    
    /// Credential NFT that is minted after proof verification
    struct Credential has key, store {
        id: UID,
        nullifier: String,
        metadata_key: StorageKey,
        credential_type: u64,
        issuer: address,
        issuance_timestamp: u64, 
        expiration_timestamp: u64,
        revoked: bool,
    }
    
    /// Registry to prevent double-using credentials with the same nullifier
    struct NullifierRegistry has key {
        id: UID,
        nullifiers: Table<String, bool>,
        admin: address
    }
    
    /// Merkle tree of revoked credentials (for efficient revocation)
    struct RevocationRegistry has key {
        id: UID,
        merkle_root: vector<u8>,  // Current Merkle root of revoked credentials
        admin: address,
    }
    
    /// Events
    struct CredentialMinted has copy, drop {
        credential_id: address,
        nullifier: String,
        credential_type: u64,
        issuer: address,
        expiration_timestamp: u64,
    }
    
    struct CredentialRevoked has copy, drop {
        credential_id: address,
        nullifier: String,
    }
    
    struct MerkleRootUpdated has copy, drop {
        old_root: vector<u8>,
        new_root: vector<u8>,
    }
    
    /// Error codes
    const EInvalidProof: u64 = 0;
    const EAlreadyRevoked: u64 = 1;
    const ENullifierExists: u64 = 2;
    const EUnauthorized: u64 = 3;
    const EExpiredCredential: u64 = 4;
    const EInvalidSignature: u64 = 5;
    
    /// Creates registry objects during module initialization
    fun init(ctx: &mut TxContext) {
        // Create nullifier registry for preventing double-spend
        let nullifier_registry = NullifierRegistry {
            id: object::new(ctx),
            nullifiers: table::new(ctx),
            admin: tx_context::sender(ctx)
        };
        transfer::share_object(nullifier_registry);
        
        // Create revocation registry with initial empty Merkle root
        let revocation_registry = RevocationRegistry {
            id: object::new(ctx),
            merkle_root: vector::empty<u8>(),
            admin: tx_context::sender(ctx)
        };
        transfer::share_object(revocation_registry);
    }
    
    /// Mint a new credential based on a verified proof
    public fun mint_credential(
        // Nullifier from the ZK proof (public output)
        nullifier: vector<u8>,
        // Proof verification data (for the ZK-SNARK)
        public_inputs: vector<vector<u8>>,
        proof_points: vector<vector<u8>>,
        verification_key: vector<u8>,
        // Additional credential data
        credential_type: u64,
        issuer: address,
        expiration_timestamp: u64,
        // Encrypted metadata for storage
        metadata: vector<u8>,
        // Nullifier registry to check against double-minting
        registry: &mut NullifierRegistry,
        ctx: &mut TxContext
    ): Credential {
        // Convert nullifier to string for storage
        let nullifier_str = string::utf8(nullifier);
        
        // Check that the nullifier hasn't been used before
        assert!(!table::contains(&registry.nullifiers, nullifier_str), ENullifierExists);
        
        // Verify the ZK proof
        // For production, we'd use a proper zk-SNARK verification here
        // This is a simplified version for demonstration purposes
        let is_valid_proof = verify_proof(public_inputs, proof_points, verification_key);
        assert!(is_valid_proof, EInvalidProof);
        
        // Register the nullifier to prevent double-use
        table::add(&mut registry.nullifiers, nullifier_str, true);
        
        // Create a storage key for the encrypted metadata
        let metadata_key = walrus::new_storage_key(ctx);
        
        // Store encrypted metadata in Walrus (Sui's programmable storage)
        let entry = walrus::new_entry(metadata);
        walrus::set(&metadata_key, entry);
        
        // Create the credential NFT object
        let credential = Credential {
            id: object::new(ctx),
            nullifier: nullifier_str,
            metadata_key,
            credential_type,
            issuer,
            issuance_timestamp: tx_context::epoch(ctx),
            expiration_timestamp,
            revoked: false,
        };
        
        // Emit credential minted event
        event::emit(CredentialMinted {
            credential_id: object::uid_to_address(&credential.id),
            nullifier: nullifier_str,
            credential_type,
            issuer,
            expiration_timestamp,
        });
        
        credential
    }
    
    /// Mint and transfer a credential to the sender
    public entry fun mint_and_transfer(
        nullifier: vector<u8>,
        public_inputs: vector<vector<u8>>,
        proof_points: vector<vector<u8>>,
        verification_key: vector<u8>,
        credential_type: u64,
        issuer: address,
        expiration_timestamp: u64,
        metadata: vector<u8>,
        registry: &mut NullifierRegistry,
        ctx: &mut TxContext
    ) {
        let credential = mint_credential(
            nullifier,
            public_inputs,
            proof_points,
            verification_key,
            credential_type,
            issuer,
            expiration_timestamp,
            metadata,
            registry,
            ctx
        );
        transfer::public_transfer(credential, tx_context::sender(ctx));
    }
    
    /// Verify that a credential is valid (not revoked and not expired)
    public fun verify(
        credential: &Credential, 
        revocation_registry: &RevocationRegistry,
        ctx: &TxContext
    ): bool {
        // Check it's not revoked
        if (credential.revoked) return false;
        
        // Check expiration
        if (credential.expiration_timestamp < tx_context::epoch(ctx)) return false;
        
        // Verify it's not in the revocation Merkle tree
        // (In a real implementation, we'd check a Merkle proof here)
        // For simplicity, we're skipping the actual Merkle verification
        
        true
    }
    
    /// Revoke a credential (can only be done by the credential owner)
    public entry fun revoke_credential(
        credential: &mut Credential
    ) {
        credential.revoked = true;
        
        event::emit(CredentialRevoked {
            credential_id: object::uid_to_address(&credential.id),
            nullifier: credential.nullifier,
        });
    }
    
    /// Update the revocation Merkle root (admin only)
    public entry fun update_revocation_merkle_root(
        registry: &mut RevocationRegistry,
        new_root: vector<u8>,
        ctx: &TxContext
    ) {
        // Only admin can update the Merkle root
        assert!(tx_context::sender(ctx) == registry.admin, EUnauthorized);
        
        let old_root = registry.merkle_root;
        registry.merkle_root = new_root;
        
        event::emit(MerkleRootUpdated {
            old_root,
            new_root,
        });
    }
    
    /// Helper function to verify a ZK proof
    fun verify_proof(
        public_inputs: vector<vector<u8>>,
        proof_points: vector<vector<u8>>,
        verification_key: vector<u8>
    ): bool {
        // In a real implementation, we would verify the zk-SNARK proof here
        // For demo purposes, we'll return true for any valid-looking proof
        
        // Check that we have the right number of inputs and proof points
        if (vector::length(&public_inputs) < 1 || vector::length(&proof_points) < 3) {
            return false;
        }
        
        // Placeholder for actual verification - in production, we'd call a crypto library here
        // For example:
        // let serialized_inputs = serialize_public_inputs(public_inputs);
        // bls12381_min_pk_verify(serialized_inputs, proof_points, verification_key)
        
        // For demo purposes, just return true
        true
    }
    
    /// Get the nullifier of a credential
    public fun get_nullifier(credential: &Credential): &String {
        &credential.nullifier
    }
    
    /// Get the metadata key of a credential
    public fun get_metadata_key(credential: &Credential): &StorageKey {
        &credential.metadata_key
    }
    
    /// Get the credential type
    public fun get_credential_type(credential: &Credential): u64 {
        credential.credential_type
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