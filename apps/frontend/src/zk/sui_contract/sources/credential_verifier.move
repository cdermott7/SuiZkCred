module 0x0::CredentialVerifier {
    use sui::tx_context::{TxContext, sender};
    use sui::object;
    use sui::transfer;
    use sui::table;
    use sui::groth16;

    // Credential type enums
    const TYPE_EMAIL: u64            = 1;
    const TYPE_BASIC_KYC: u64        = 2;
    const TYPE_ADVANCED_KYC: u64     = 3;
    const TYPE_DAO_MEMBERSHIP: u64   = 4;
    const TYPE_EDUCATION: u64        = 5;
    const TYPE_PASSPORT: u64         = 6;
    const TYPE_DRIVER_LICENSE: u64   = 7;
    const TYPE_NATIONAL_ID: u64      = 8;
    const TYPE_PROOF_OF_ADDRESS: u64 = 9;

    // Error codes
    const E_INVALID_PROOF: u64 = 1;
    const E_TYPE_INVALID:  u64 = 2;
    const E_EXPIRED:       u64 = 3;
    const E_REVOKED:       u64 = 4;

     /// On-chain verifying key resource
    public struct VerifierKey has key, store {
        id: object::UID,
        vk: groth16::PreparedVerifyingKey,
    }

    /// Revocation registry storing nullifiers (now a u64 key)
    public struct RevocationRegistry has key, store {
        id: object::UID,
        nullifiers: table::Table<u64, bool>,
    }

    /// Credential object minted upon successful proof
    public struct Credential has key, store {
        id: object::UID,
        nullifier: u64,
        cred_type: u64,
        expires: u64,
        issuer: address,
    }

    /// 1️⃣ Publish the SNARK verification key
    public entry fun create_key(
        vk_bytes: vector<u8>,
        ctx: &mut TxContext
    ) {
        let pvk = groth16::prepare_verifying_key(&groth16::bn254(), &vk_bytes);
        let id  = object::new(ctx);
        let key = VerifierKey { id, vk: pvk };
        // Transfer the new VerifierKey under the tx sender’s address
        transfer::transfer<VerifierKey>(key, sender(ctx));
    }

    /// 2️⃣ Initialize an empty revocation registry
    public entry fun init_registry(
        ctx: &mut TxContext
    ) {
        let id  = object::new(ctx);
        // Create an empty Table<u64,bool>
        let tab = table::new<u64, bool>(ctx);
        let reg = RevocationRegistry { id, nullifiers: tab };
        transfer::transfer<RevocationRegistry>(reg, sender(ctx));
    }

    /// 3️⃣ Verify a proof, mint a Credential, and mark nullifier
    public entry fun verify_and_mint(
        key: &VerifierKey,
        reg: &mut RevocationRegistry,
        proof_bytes: vector<u8>,
        inputs_bytes: vector<u8>,
        nullifier: u64,
        cred_type: u64,
        expires: u64,
        now_ts: u64,
        ctx: &mut TxContext
    ) {
        // 1. Deserialize and verify proof
        let inputs = groth16::public_proof_inputs_from_bytes(inputs_bytes);
        let proof  = groth16::proof_points_from_bytes(proof_bytes);
        assert!(
            groth16::verify_groth16_proof(&groth16::bn254(), &key.vk, &inputs, &proof),
            E_INVALID_PROOF
        );

        // 2. Semantic checks
        assert!(
            cred_type >= TYPE_EMAIL && cred_type <= TYPE_PROOF_OF_ADDRESS,
            E_TYPE_INVALID
        );
        assert!(expires > now_ts, E_EXPIRED);
        // Check revocation registry
        assert!(!table::contains(&reg.nullifiers, nullifier), E_REVOKED);

        // 3. Record the nullifier
        table::add(&mut reg.nullifiers, nullifier, true);

        // 4. Mint and transfer the Credential
        let cid  = object::new(ctx);
        let cred = Credential {
            id: cid,
            nullifier,
            cred_type,
            expires,
            issuer: sender(ctx),
        };
        transfer::transfer<Credential>(cred, sender(ctx));
    }

    /// 4️⃣ Revoke a credential (burn + mark nullifier)
    public entry fun revoke_credential(
        cred: Credential,
        reg: &mut RevocationRegistry
    ) {
        // Destructure so we can move out the UID and the nullifier
        let Credential { id, nullifier, .. } = cred;
        object::delete(id);  // delete the object ID :contentReference[oaicite:4]{index=4}
        table::add(&mut reg.nullifiers, nullifier, true);
    }

    /// On-chain view: check validity
    public fun is_valid(
        cred: &Credential,
        reg: &RevocationRegistry,
        now_ts: u64
    ): bool {
        cred.expires > now_ts &&
        !table::contains(&reg.nullifiers, cred.nullifier)
    }
}