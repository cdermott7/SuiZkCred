const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function main() {
  const circuitName = 'credential';
  const circuitPath = path.join(__dirname, 'circuits', `${circuitName}.circom`);
  const outputDir = path.join(__dirname, 'wasm');
  
  console.log('Setting up ZK circuit...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Compile the circuit to R1CS and WASM
  try {
    console.log('Compiling circuit to R1CS...');
    const { exec } = require('child_process');
    
    // Run circom to generate R1CS and WASM
    await new Promise((resolve, reject) => {
      exec(`circom ${circuitPath} --r1cs --wasm -o ${outputDir}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Circom execution error: ${error}`);
          reject(error);
          return;
        }
        console.log(stdout);
        resolve();
      });
    });
    
    console.log('Circuit compiled successfully!');
    
    // Generate zKey and verification key
    console.log('Generating proving key (this may take a while)...');
    
    // Step 1: Create a "powers of tau" ceremony
    const ptauName = 'pot12_final.ptau';
    const ptauPath = path.join(outputDir, ptauName);
    
    // Check if we need to download the ptau file
    if (!fs.existsSync(ptauPath)) {
      console.log('Downloading Powers of Tau file...');
      // In a real implementation, we would download a trusted setup from a reliable source
      // For demo purposes, we'll create a small one
      await snarkjs.powersOfTau.new(12, ptauPath, false);
      console.log('Powers of Tau file created.');
    }
    
    // Step 2: Generate the zKey
    const r1csPath = path.join(outputDir, `${circuitName}.r1cs`);
    const zKeyPath = path.join(outputDir, `${circuitName}.zkey`);
    
    console.log('Generating zKey...');
    await snarkjs.zKey.newZKey(r1csPath, ptauPath, zKeyPath);
    
    // Step 3: Export the verification key
    const vKeyPath = path.join(outputDir, `${circuitName}_verification_key.json`);
    const vKey = await snarkjs.zKey.exportVerificationKey(zKeyPath);
    
    fs.writeFileSync(vKeyPath, JSON.stringify(vKey, null, 2));
    
    console.log('Setup completed successfully!');
    console.log(`Circuit WASM: ${path.join(outputDir, `${circuitName}_js/${circuitName}.wasm`)}`);
    console.log(`Circuit zKey: ${zKeyPath}`);
    console.log(`Verification Key: ${vKeyPath}`);
    
    // Generate Sui-compatible verification key bytes
    console.log('Generating Sui verification key bytes...');
    const vKeyBytes = Buffer.from(JSON.stringify(vKey)).toString('hex');
    fs.writeFileSync(path.join(outputDir, `${circuitName}_verification_key.hex`), vKeyBytes);
    console.log(`Verification Key Bytes: ${path.join(outputDir, `${circuitName}_verification_key.hex`)}`);
    
  } catch (error) {
    console.error('Error setting up circuit:', error);
  }
}

main().catch(console.error);