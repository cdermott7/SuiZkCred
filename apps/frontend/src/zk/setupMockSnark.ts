// This file generates mock verification and proof data for use in development
// In a production environment, we would use actual ZK circuits and proofs

// Mock verification key structure
export const generateMockVerificationKey = () => {
  return {
    alpha_g1: {
      x: "0x1a3b65c6f9d257e8635e16b98bfab8b4ba43a48d2f76a9b24c8adbf447559ac",
      y: "0x2d31c3af59f5c4da5ef9e7ea91df2b77617bea5e5c5a79c51cec42a4845a63f"
    },
    beta_g2: {
      x: ["0x29a0ed746a9b7fae37ae97c23c6c84b73a55272f3b1e6d9f80091523a6e6e98", "0x1fef3cc33d0f8c08fe7ed5b00533ba59fd60bd057d4eef778240c4a189c0be1"],
      y: ["0x1e662b2dd59c01387e5ada4d6e2c91befc8030db5e18e76f73897fc4a2d8590", "0x19e0e68f74bc098f27bc795d30ca4fcf207a4a43a3d9a0bd5b8768fb8c3a16b"]
    },
    gamma_g2: {
      x: ["0x5c766d2c74486a53a1a3b75b9ec684e2c0b96657ee9a110ce4d27e65189b4c", "0x30674a9d61528d09a4d673f458c228c88e84951fd5f4b9d5c0ca8e9ca1b0b7e"],
      y: ["0x76df06de04b53e61225376c08c5de2c11df062c673d729e047b24ba7ad8e03", "0xd4afdf8cd2268ade206a1e72e3722f148d81b569d35e6c37a576dd48c9e495"]
    },
    delta_g2: {
      x: ["0x3ad7a469dbe0e2fa66bf91bb8ff179d0d69fcd46e5d3844e65bd8a6cd1e3d7b", "0x17f1eb48c5c4253e07362d868a4bd5ff0699cf4d840f96ca18e9dca9d320c30"],
      y: ["0x2057fdf9efa98e0437e02464839d6333e89cc0cd77edc85b2b410a0b41dfa77", "0x1a76f533c859b86a5f61926f0ea114a44a137d53383faff04cc5e73f8e40d31"]
    },
    ic: [
      {
        x: "0x25aaba68a4e2680157c9f6b6a5eb42e4db9b18de04f837638bcc7a505d13a84",
        y: "0x1529c58d7d2afb1ab34e68a1f0c7c65ca360e5a59a0aad4a86bcd396a34ef47"
      },
      {
        x: "0x3e4e3ab13075bf2759be5b6e5e309e3c9f52d8b0ac6e353fac0a84441ec6f",
        y: "0x1ddee0a9c0d1f8c3f34099dec52a669e8cdf053961d480c60c6768a848349aa"
      },
      {
        x: "0x1234a53c398970b9ae9cb99583429159a88c729f5dd3d0f4010f12dbafd7a9",
        y: "0x1f0e75c0fee5b30686a4752dd3f9f7ea338e3f7240a887c6c73045a4e5f40a9"
      }
    ]
  };
};

// Mock proof structure
export const generateMockProof = (nullifier: string, credentialType: number, expirationTimestamp: number) => {
  return {
    pi_a: [
      "0x14d9c69218a3cb83b3b8fae10ba57d33d2f67f16d7a6ef214d8444bf2ffe5be",
      "0x1a03d31ef9816caf3a48e6bd0c432a3c31ad647478aa2e96020ab327be63a43",
      "0x1"
    ],
    pi_b: [
      [
        "0x276adb9bcc4ba4fce76a2e7ae2fa9cb47e7c7fc5648f3b396933e9e47b1b3d9",
        "0x1ef3223bb719644a482e2ef57234bf080e8749795ae0e4a0f20bf28a7a05ca7"
      ],
      [
        "0x11b0612f4d0cca83fef0b78ceab50adec7b9a29a3ace2e3c1e2e8c21b737fdc",
        "0x2f8efa5ad3175e914572a348c0e77639403a5dd69fc01939f7c24fa7340da25"
      ],
      [
        "0x1",
        "0x0"
      ]
    ],
    pi_c: [
      "0x9f6f79f01f0898b26db079680c9a645dd4ddf38626e07e970b68669e22c5aa",
      "0x1e71fa029f98ef1a8ce0575b9390b95172dfe75ee8dff4b614b3c2476dbf42f",
      "0x1"
    ],
    protocol: "groth16"
  };
};

// Serialize proof for Sui blockchain
export const serializeProofForSui = (proof: any) => {
  // In a real implementation, this would properly serialize the proof for Sui
  // For now, we just convert to a hex string
  return `0x${Buffer.from(JSON.stringify(proof)).toString('hex')}`;
};

// Serialize public inputs for Sui blockchain
export const serializePublicInputsForSui = (nullifier: string, credentialType: number, expirationTimestamp: number) => {
  // In a real implementation, this would properly serialize the inputs for Sui
  // For now, we just convert to a hex string
  const publicInputs = [nullifier, credentialType.toString(), expirationTimestamp.toString()];
  return `0x${Buffer.from(JSON.stringify(publicInputs)).toString('hex')}`;
};

// Generate mock verification key and export as hex for Sui
export const getMockVerificationKeyHex = () => {
  const vk = generateMockVerificationKey();
  return `0x${Buffer.from(JSON.stringify(vk)).toString('hex')}`;
};