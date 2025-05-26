#!/bin/bash

# Exit script if any command fails
set -e

# Set paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_PATH="$PROJECT_ROOT/circuits/credential.circom"
BUILD_DIR="$PROJECT_ROOT/circuits/build"
CIRCUIT_NAME="credential" # Keep the output name as 'credential' to maintain compatibility
POWERS_OF_TAU="powersOfTau28_hez_final_10.ptau" # We'll use a pre-generated Powers of Tau file
PTAU_PATH="$BUILD_DIR/$POWERS_OF_TAU"

# Create build directory if it doesn't exist
mkdir -p $BUILD_DIR

echo "== SuiZkCred Circuit Compiler =="
echo "This script will compile the ZK circuit and generate proving/verification keys"

# Download Powers of Tau file if it doesn't exist
if [ ! -f "$PTAU_PATH" ]; then
  echo "Downloading Powers of Tau file..."
  curl -o "$PTAU_PATH" https://hermez.s3-eu-west-1.amazonaws.com/$POWERS_OF_TAU
fi

# Step 1: Compile circuit to r1cs
echo "1. Compiling circuit to r1cs..."
npx circom $CIRCUIT_PATH --r1cs --wasm --sym -o $BUILD_DIR

# Step 2: Start the Groth16 trusted setup
echo "2. Running the trusted setup phase 1..."
snarkjs groth16 setup $BUILD_DIR/$CIRCUIT_NAME.r1cs $PTAU_PATH $BUILD_DIR/${CIRCUIT_NAME}_0.zkey

# Step 3: Contribute to the ceremony (normally, multiple parties would contribute)
echo "3. Contributing to the phase 2 ceremony..."
echo "SuiZkCred demo contribution" | snarkjs zkey contribute $BUILD_DIR/${CIRCUIT_NAME}_0.zkey $BUILD_DIR/${CIRCUIT_NAME}_1.zkey --name="First contribution" -v

# Step 4: Apply a random beacon
echo "4. Applying a random beacon..."
snarkjs zkey beacon $BUILD_DIR/${CIRCUIT_NAME}_1.zkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey 12345678 10 -n="Final Beacon phase2"

# Step 5: Export the verification key
echo "5. Exporting verification key..."
snarkjs zkey export verificationkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey $BUILD_DIR/verification_key.json

# Step 6: Copy the final zkey to the expected location
echo "6. Finalizing setup..."
cp $BUILD_DIR/${CIRCUIT_NAME}_final.zkey $BUILD_DIR/$CIRCUIT_NAME.zkey

# Print summary
echo "=== Circuit Compilation Complete ==="
echo "R1CS constraints: $(snarkjs r1cs info $BUILD_DIR/$CIRCUIT_NAME.r1cs | grep Constraints | cut -d' ' -f3)"
echo ""
echo "Files generated in $BUILD_DIR:"
ls -la $BUILD_DIR | grep -E 'wasm|zkey|json'
echo ""
echo "You can now generate proofs with:"
echo "  npm run generate-proof"