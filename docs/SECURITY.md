# Security Guidelines

This document outlines security best practices when using `@vbyte/btc-dev` for Bitcoin development.

## Private Key Handling

### Never expose secret keys

```typescript
// WRONG - Never log secret keys
console.log('Secret key:', secretKey)

// WRONG - Never include in error messages
throw new Error(`Failed to sign with key: ${secretKey}`)

// CORRECT - Use secure handling
const signature = SIGNER.sign_segwit_tx(secretKey, txdata, options)
// Clear from memory when possible
secretKey = null
```

### Secure key generation

- Always use cryptographically secure random number generators
- Never use predictable seeds or weak entropy sources
- Consider using hardware security modules (HSMs) for production systems

```typescript
// Use @noble/curves for key generation
import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'

const secretKey = randomBytes(32)
const publicKey = secp256k1.getPublicKey(secretKey)
```

### Memory handling

- Clear sensitive data from memory after use
- Be aware that JavaScript garbage collection may not immediately clear values
- For high-security applications, consider using typed arrays that can be zeroed

## Input Validation

### Secret key validation

The library validates secret key format:

```typescript
// The library will throw on invalid key format
SIGNER.sign_segwit_tx('invalid', txdata, options)
// Error: Invalid secret key format: expected 32-byte hex string (64 characters)

// Valid format: 64 hex characters (32 bytes)
const validKey = 'a'.repeat(64)
SIGNER.sign_segwit_tx(validKey, txdata, options)
```

### Transaction validation

Always validate transaction data before signing:

```typescript
// The library performs validation
TX.assert_tx_data(txdata)  // Throws on invalid
TX.assert_tx_template(template)  // Throws on invalid

// Validate at boundaries
if (!tx.vin.every(vin => vin.prevout !== null)) {
  throw new Error('Missing prevout data for input')
}
```

### Script validation

Validate scripts before using them:

```typescript
// Check script type
const type = SCRIPT.get_lock_script_type(script)
if (type === null) {
  throw new Error('Unknown or invalid script type')
}

// Validate script structure
if (!SCRIPT.is_valid_script(script)) {
  throw new Error('Invalid script')
}
```

## Sighash Flags

Understanding sighash flags is critical for security:

| Flag | Value | Meaning |
|------|-------|---------|
| SIGHASH_ALL | 0x01 | Sign all inputs and outputs (default, safest) |
| SIGHASH_NONE | 0x02 | Sign inputs only, outputs can be modified |
| SIGHASH_SINGLE | 0x03 | Sign only the output at the same index |
| SIGHASH_ANYONECANPAY | 0x80 | Only sign own input, others can be added |

### Recommended usage

```typescript
// Default: SIGHASH_ALL - signs all inputs and outputs
const safeSig = SIGNER.sign_segwit_tx(key, txdata, {
  txindex: 0,
  sigflag: 0x01  // SIGHASH_ALL
})

// DANGEROUS: SIGHASH_NONE - outputs can be changed
// Only use if you understand the implications
const dangerousSig = SIGNER.sign_segwit_tx(key, txdata, {
  txindex: 0,
  sigflag: 0x02  // SIGHASH_NONE - anyone can redirect funds!
})
```

### Taproot sighash

```typescript
// Taproot default (0x00) is equivalent to SIGHASH_ALL
const taprootSig = SIGNER.sign_taproot_tx(key, txdata, {
  txindex: 0,
  sigflag: 0x00  // SIGHASH_DEFAULT
})
```

## Transaction Size Limits

The library enforces limits to prevent denial-of-service attacks:

- **Maximum transaction size**: 4MB (Bitcoin consensus limit)
- **Maximum varint size**: 10MB (prevents memory exhaustion)
- **Maximum inputs/outputs**: 100,000 per transaction
- **Maximum taproot tree depth**: 128 levels

These limits are enforced automatically during decoding.

## Network Selection

Always explicitly specify the network:

```typescript
// CORRECT - Explicit network
const mainnetAddr = ADDRESS.p2wpkh(pubkey, 'main')
const testnetAddr = ADDRESS.p2wpkh(pubkey, 'test')

// Be careful not to mix networks
if (network === 'main') {
  // Production code path
} else {
  // Test code path
}
```

## Signature Verification

Always verify signatures after signing:

```typescript
// Sign the transaction
const signature = SIGNER.sign_segwit_tx(secretKey, txdata, options)

// Verify the signature is valid
txdata.vin[0].witness = [signature, pubkey]
const result = SIGNER.verify_tx(txdata)

if (!result.valid) {
  throw new Error('Signature verification failed: ' + result.error)
}
```

## Known Limitations

1. **OP_CODESEPARATOR**: Not fully supported in segwit scripts. The library will throw if encountered.

2. **P2SH-wrapped scripts**: Legacy P2SH spending is not fully implemented. Use native segwit (P2WPKH/P2WSH) instead.

3. **Multi-signature**: Complex multi-sig scripts require manual construction and may need custom handling.

## Dependency Security

This library depends on:

- `@noble/curves` - Audited, well-maintained cryptographic library
- `@noble/hashes` - Audited, well-maintained hash functions
- `@scure/btc-signer` - From the same author as @noble libraries

Keep dependencies updated:

```bash
npm audit
npm update
```

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email the maintainer directly with details
3. Include steps to reproduce if possible
4. Allow reasonable time for a fix before disclosure

## Security Checklist

Before deploying to production:

- [ ] All secret keys are securely generated
- [ ] No secret keys are logged or exposed
- [ ] Transaction data is validated before signing
- [ ] Signature verification is performed after signing
- [ ] Correct sighash flags are used for the use case
- [ ] Network is explicitly specified
- [ ] Dependencies are up to date
- [ ] Error messages don't leak sensitive data
