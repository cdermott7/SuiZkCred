module zk_credentials::credential_verifier {
    use sui::groth16;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::vector;
    
    // Resource holding the verification key for credential proofs
    struct CredentialVerificationKey has key, store {
        id: UID,
        vk_bytes: vector<u8>,
        prepared_vk: vector<vector<u8>>
    }
    
    // Represents a verified credential on-chain
    struct Credential has key, store {
        id: UID,
        nullifier: vector<u8>,
        credential_type: u64,
        expiration_timestamp: u64,
        issuer: address
    }
    
    // Revocation registry to track revoked nullifiers
    struct RevocationRegistry has key {
        id: UID,
        revoked_nullifiers: vector<vector<u8>>
    }
    
    // Error codes
    const ECredentialTypeInvalid: u64 = 1;
    const ECredentialExpired: u64 = 2;
    const ECredentialRevoked: u64 = 3;
    const EInvalidProof: u64 = 4;
    
    // Create a new verification key
    public fun create_verification_key(vk_bytes: vector<u8>, ctx: &mut TxContext): CredentialVerificationKey {
        let prepared_vk = groth16::prepare_verifying_key(&groth16::bn254(), &vk_bytes);
        
        CredentialVerificationKey {
            id: object::new(ctx),
            vk_bytes,
            prepared_vk
        }
    }
    
    // Initialize the revocation registry
    public fun initialize_registry(ctx: &mut TxContext) {
        let registry = RevocationRegistry {
            id: object::new(ctx),
            revoked_nullifiers: vector::empty()
        };
        
        transfer::share_object(registry);
    }
    
    // Verify a credential proof and create a credential object if valid
    public fun verify_and_create_credential(
        vk: &CredentialVerificationKey,
        registry: &RevocationRegistry,
        proof_bytes: vector<u8>,
        public_inputs_bytes: vector<u8>,
        current_timestamp: u64,
        ctx: &mut TxContext
    ): Credential {
        // Extract public inputs (nullifier, credential_type, expiration_timestamp)
        let public_inputs = groth16::public_proof_inputs_from_bytes(public_inputs_bytes);
        let proof_points = groth16::proof_points_from_bytes(proof_bytes);
        
        // Verify the proof
        assert!(
            groth16::verify_groth16_proof(&groth16::bn254(), &vk.prepared_vk, &public_inputs, &proof_points),
            EInvalidProof
        );
        
        // Extract the public inputs
        let nullifier = vector::empty<u8>(); // In real implementation, this would be extracted from public_inputs
        let credential_type = 0; // In real implementation, this would be extracted from public_inputs
        let expiration_timestamp = 0; // In real implementation, this would be extracted from public_inputs
        
        // Check if the credential is valid
        assert!(credential_type >= 1 && credential_type <= 5, ECredentialTypeInvalid);
        assert!(expiration_timestamp > current_timestamp, ECredentialExpired);
        
        // Check if the credential has been revoked
        let is_revoked = false;
        let i = 0;
        let len = vector::length(&registry.revoked_nullifiers);
        
        while (i < len) {
            if (vector::get(&registry.revoked_nullifiers, i) == &nullifier) {
                is_revoked = true;
                break
            };
            i = i + 1;
        };
        
        assert!(!is_revoked, ECredentialRevoked);
        
        // Create and return the credential
        Credential {
            id: object::new(ctx),
            nullifier,
            credential_type,
            expiration_timestamp,
            issuer: tx_context::sender(ctx)
        }
    }
    
    // Revoke a credential
    public fun revoke_credential(
        credential: Credential,
        registry: &mut RevocationRegistry,
        _ctx: &mut TxContext
    ) {
        let Credential { id, nullifier, credential_type: _, expiration_timestamp: _, issuer: _ } = credential;
        object::delete(id);
        
        vector::push_back(&mut registry.revoked_nullifiers, nullifier);
    }
    
    // Check if a credential is valid
    public fun is_credential_valid(
        credential: &Credential,
        registry: &RevocationRegistry,
        current_timestamp: u64
    ): bool {
        if (credential.expiration_timestamp <= current_timestamp) {
            return false
        };
        
        // Check if the credential is revoked
        let i = 0;
        let len = vector::length(&registry.revoked_nullifiers);
        
        while (i < len) {
            if (vector::get(&registry.revoked_nullifiers, i) == &credential.nullifier) {
                return false
            };
            i = i + 1;
        };
        
        true
    }
}