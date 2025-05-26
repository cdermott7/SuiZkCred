module suizkcred::credential_verifier {
    use sui::groth16::{Self, PreparedVerifyingKey};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::clock::Clock;
    use suizkcred::credential;
    
    // Resource holding the verification key for credential proofs
    struct CredentialVerificationKey has key, store {
        id: UID,
        vk_bytes: vector<u8>,
        prepared_vk: PreparedVerifyingKey
    }
    
    // Error codes
    const EInvalidProof: u64 = 1;
    
    // Create and share a new verification key
    public entry fun create_verification_key(vk_bytes: vector<u8>, ctx: &mut TxContext) {
        let prepared_vk = groth16::prepare_verifying_key(&groth16::bn254(), &vk_bytes);
        
        let verification_key = CredentialVerificationKey {
            id: object::new(ctx),
            vk_bytes,
            prepared_vk
        };
        
        transfer::share_object(verification_key);
    }
    
    // Verify a credential proof and call the credential module to create a credential
    public entry fun verify_and_create_credential(
        vk: &CredentialVerificationKey,
        proof_bytes: vector<u8>,
        public_inputs_bytes: vector<u8>,
        nullifier: vector<u8>, 
        credential_type: u64,
        expiration_timestamp: u64,
        registry: &mut credential::CredentialRegistry,
        _clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Extract and verify the proof
        let public_inputs = groth16::public_proof_inputs_from_bytes(public_inputs_bytes);
        let proof_points = groth16::proof_points_from_bytes(proof_bytes);
        
        let verified = groth16::verify_groth16_proof(
            &groth16::bn254(), 
            &vk.prepared_vk, 
            &public_inputs, 
            &proof_points
        );
        
        // Require valid proof
        assert!(verified, EInvalidProof);
        
        // Create a real credential
        credential::mint_and_transfer(
            nullifier,
            credential_type,
            expiration_timestamp,
            registry,
            ctx
        );
    }
}