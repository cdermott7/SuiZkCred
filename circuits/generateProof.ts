const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

// Mock snarkjs for now, as we're facing issues with the trusted setup
const snarkjs = {
  groth16: {
    fullProve: async (input, wasmPath, zkeyPath) => {
      console.log('Mock proof generation with input:', JSON.stringify(input, null, 2));
      
      // Calculate the nullifier based on our circuit logic
      const nullifier = BigInt(input.identityNullifier) + BigInt(input.credentialType);
      
      return {
        proof: {
          pi_a: ["12345", "67890", "1"],
          pi_b: [["12345", "67890"], ["12345", "67890"], ["1", "0"]],
          pi_c: ["12345", "67890", "1"],
          protocol: "groth16"
        },
        publicSignals: [
          nullifier.toString(),  // nullifier
          "1"                    // validCredential is hardcoded to 1 in our current circuit
        ]
      };
    },
    verify: async (vkey, publicSignals, proof) => {
      console.log('Mock verification');
      return true;
    }
  }
};

// Define the credential types
const CredentialType = {
  EMAIL_VERIFICATION: 1,
  BASIC_KYC: 2,
  ADVANCED_KYC: 3,
  DAO_MEMBERSHIP: 4,
  EDUCATIONAL_CREDENTIAL: 5
};

// Generate a random field element (for nullifier/trapdoor)
function generateRandomFieldElement() {
  // Generate a random 31-byte integer (not quite p, but close enough for our demo)
  const hex = randomBytes(31).toString('hex');
  return BigInt('0x' + hex).toString();
}

/**
 * Generates a zero-knowledge proof for a credential
 * @param credentialType Type of credential from CredentialType enum
 * @param expirationInDays How many days until the credential expires
 * @param existingIdentity Optional existing identity (nullifier) for the user
 * @returns Promise containing the proof and public signals
 */
async function generateCredentialProof(
  credentialType,
  expirationInDays = 365, // Default to 1 year validity
  existingIdentity
) {
  // Set paths to circuit artifacts
  const wasmPath = path.join(__dirname, 'build', 'credential_js', 'credential.wasm');
  const zkeyPath = path.join(__dirname, 'build', 'credential.zkey');
  
  // Create or use existing identity
  const identityNullifier = existingIdentity?.nullifier || generateRandomFieldElement();
  
  // Calculate timestamps
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + (expirationInDays * 24 * 60 * 60);
  
  // Define input for the circuit
  const input = {
    // Private inputs
    identityNullifier,
    credentialType,
    
    // Public inputs
    currentTimestamp,
    expirationTimestamp
  };
  
  try {
    // Generate witness and produce proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input, 
      wasmPath, 
      zkeyPath
    );
    
    // The nullifier is the first public signal (as defined in the circuit)
    const nullifier = publicSignals[0].toString();
    // The validCredential is the second public signal
    const validCredential = publicSignals[1].toString() === "1";
    
    // Create metadata to store with the credential
    const metadata = {
      credentialType,
      issuanceDate: currentTimestamp,
      expirationDate: expirationTimestamp,
      issuer: "SuiZkCred Demo Issuer"
    };
    
    // Save proof to file
    const proofJson = JSON.stringify({
      proof,
      publicSignals,
      nullifier,
      metadata
    }, null, 2);
    
    const proofOutputPath = path.join(__dirname, 'build', `proof_${Date.now()}.json`);
    fs.writeFileSync(proofOutputPath, proofJson);
    
    console.log('Proof generated successfully!');
    console.log('Nullifier:', nullifier);
    console.log('Valid credential:', validCredential);
    console.log('Proof saved to:', proofOutputPath);
    
    return { proof, publicSignals, nullifier, metadata };
  } catch (error) {
    console.error('Error generating proof:', error);
    throw error;
  }
}

// Function to verify a generated proof
async function verifyCredentialProof(proof, publicSignals) {
  try {
    const vkeyPath = path.join(__dirname, 'build', 'verification_key.json');
    
    // Verify the proof against the verification key
    const verified = await snarkjs.groth16.verify(
      JSON.parse(fs.readFileSync(vkeyPath).toString()),
      publicSignals,
      proof
    );
    
    return verified;
  } catch (error) {
    console.error('Error verifying proof:', error);
    return false;
  }
}

// If this script is run directly
if (require.main === module) {
  // Example usage
  generateCredentialProof(CredentialType.EMAIL_VERIFICATION, 90)
    .then((result) => {
      console.log('Proof generation complete!');
      return verifyCredentialProof(result.proof, result.publicSignals);
    })
    .then((verified) => {
      console.log('Proof verification result:', verified);
    })
    .catch((error) => {
      console.error('Error in proof workflow:', error);
    });
}

module.exports = {
  CredentialType,
  generateCredentialProof,
  verifyCredentialProof
};