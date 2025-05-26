# SuiZkCred Deployment

## Contract Deployment

The SuiZkCred contract has been successfully deployed to the Sui Devnet.

### Deployment Details

- **Package ID**: `0xe00132aafb392b45f43a13054c7c8589f5c7f7bd4393d6b4dd3ff7c8ad44eb12`
- **Module Name**: `credential`
- **Network**: Sui Devnet

### Deployed Functionality

The contract implements the following main functions:

1. **mint_credential**: Creates a new credential with a nullifier and returns it
2. **mint_and_transfer**: Mints a credential and transfers it to the sender
3. **revoke**: Revokes a credential
4. **verify**: Checks if a credential is valid (not revoked and not expired)

### Sample Credential

A sample credential has been created with the following details:

- **Credential ID**: `0x53cc6654c6cd54546edfddd4f486c36df4ab50821cfc579027ebbe9b1a4831c1`
- **Nullifier**: "TestNullifier"
- **Credential Type**: 1
- **Revoked**: Yes

### Usage Examples

To mint a new credential:

```bash
sui client call --package 0xe00132aafb392b45f43a13054c7c8589f5c7f7bd4393d6b4dd3ff7c8ad44eb12 --module credential --function mint_and_transfer --args "[84, 101, 115, 116, 78, 117, 108, 108, 105, 102, 105, 101, 114]" 1 1747936671 --gas-budget 10000000
```

To revoke a credential:

```bash
sui client call --package 0xe00132aafb392b45f43a13054c7c8589f5c7f7bd4393d6b4dd3ff7c8ad44eb12 --module credential --function revoke --args <CREDENTIAL_ID> --gas-budget 10000000
```

## Future Improvements

1. Implement nullifier registry to prevent reuse of the same nullifier
2. Add Merkle tree for efficient revocation checks
3. Integration with Walrus storage for larger metadata
4. Connect with ZK proof verification

## Notes

This is a simplified version of the contract for demonstration purposes. Additional features planned:

- ZK proof verification
- Nullifier registry
- Revocation Merkle tree

The contract is currently deployed on Devnet for testing purposes.