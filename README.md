# @vbyte/btc-dev

A batteries-included TypeScript toolset for Bitcoin development. Create, sign, and verify Bitcoin transactions with full support for segwit and taproot.

## Features

- **Full Address Support**: P2PKH, P2SH, P2WPKH, P2WSH, P2TR (taproot)
- **Transaction Building**: Create, encode, decode, and parse Bitcoin transactions
- **Signature Hashing**: BIP-143 (segwit) and BIP-341 (taproot) sighash calculation
- **Signing & Verification**: ECDSA (segwit) and Schnorr (taproot) signatures
- **Taproot Scripts**: Merkle tree construction, control blocks, and script-path spends
- **Script Handling**: Encode/decode Bitcoin scripts, lock script detection
- **Metadata Utilities**: Locktime, sequence (BIP-68), outpoints, rune IDs, inscription IDs
- **Type Safety**: Full TypeScript support with strict types
- **Tree-shakeable**: Import only what you need

## Installation

```bash
npm install @vbyte/btc-dev
```

## Quick Start

```typescript
import { ADDRESS, TX, SIGNER } from '@vbyte/btc-dev'

// Create a P2WPKH address from a public key
const address = ADDRESS.p2wpkh(pubkey, 'main')
console.log(address.data)  // bc1q...

// Parse a raw transaction
const tx = TX.parse(txhex)
console.log(tx.vin.length, 'inputs')
console.log(tx.vout.length, 'outputs')

// Sign a segwit transaction
const signature = SIGNER.sign_segwit_tx(secretKey, txdata, {
  txindex: 0,
  pubkey: publicKey,
  sigflag: 0x01  // SIGHASH_ALL
})
```

## Module Overview

| Module | Description |
|--------|-------------|
| `ADDRESS` | Create and parse Bitcoin addresses (P2PKH, P2SH, P2WPKH, P2WSH, P2TR) |
| `TX` | Transaction creation, encoding, decoding, parsing, and validation |
| `SCRIPT` | Bitcoin script encoding, decoding, and lock script detection |
| `SIGHASH` | Signature hash calculation for segwit (BIP-143) and taproot (BIP-341) |
| `SIGNER` | Sign and verify transactions using ECDSA and Schnorr |
| `TAPROOT` | Taproot tree construction, control blocks, and tweaking |
| `WITNESS` | Parse and analyze witness data |
| `META` | Locktime, sequence, outpoints, and reference IDs |

## Import Patterns

```typescript
// Import all namespaces
import { ADDRESS, TX, SCRIPT, SIGHASH, SIGNER, TAPROOT, WITNESS, META } from '@vbyte/btc-dev'

// Tree-shaking: import specific modules
import { p2wpkh, p2tr } from '@vbyte/btc-dev/address'
import { parse_tx, encode_tx } from '@vbyte/btc-dev/tx'
import { sign_segwit_tx, sign_taproot_tx, verify_tx } from '@vbyte/btc-dev/signer'
```

## API Highlights

### Address Creation

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// P2PKH (legacy)
const p2pkh = ADDRESS.p2pkh(pubkey, 'main')

// P2WPKH (native segwit)
const p2wpkh = ADDRESS.p2wpkh(pubkey, 'main')

// P2WSH (segwit script hash)
const p2wsh = ADDRESS.p2wsh(redeemScript, 'main')

// P2TR (taproot)
const p2tr = ADDRESS.p2tr(xOnlyPubkey, 'main')
```

### Transaction Parsing

```typescript
import { TX } from '@vbyte/btc-dev'

// Parse raw transaction hex
const tx = TX.parse(rawTxHex)

// Access transaction data
console.log(tx.version)      // Transaction version
console.log(tx.vin)          // Inputs array
console.log(tx.vout)         // Outputs array
console.log(tx.locktime)     // Locktime

// Encode transaction back to hex
const encoded = TX.encode(tx)
```

### Signing Transactions

```typescript
import { SIGNER } from '@vbyte/btc-dev'

// Sign segwit (v0) transaction input
const segwitSig = SIGNER.sign_segwit_tx(secretKey, txdata, {
  txindex: 0,           // Input index to sign
  pubkey: compressedPubkey,  // For P2WPKH
  sigflag: 0x01         // SIGHASH_ALL
})

// Sign taproot (v1) transaction input
const taprootSig = SIGNER.sign_taproot_tx(secretKey, txdata, {
  txindex: 0,
  sigflag: 0x00         // SIGHASH_DEFAULT (taproot)
})

// Verify all signatures in a transaction
const result = SIGNER.verify_tx(txdata)
if (result.valid) {
  console.log('All signatures valid')
} else {
  console.log('Verification failed:', result.error)
  result.inputs.forEach(input => {
    if (!input.valid) console.log(`Input ${input.index}: ${input.error}`)
  })
}
```

### Taproot Scripts

```typescript
import { TAPROOT } from '@vbyte/btc-dev'

// Create a taproot output with scripts
const taprootCtx = TAPROOT.create({
  pubkey: internalPubkey,
  leaves: [tapleaf1, tapleaf2]  // Script leaves
})

console.log(taprootCtx.tapkey)    // Tweaked public key
console.log(taprootCtx.cblock)    // Control block for script-path
console.log(taprootCtx.taptweak)  // Tweak value

// Verify control block
const isValid = TAPROOT.verify(tapkey, target, cblock)
```

### Script Detection

```typescript
import { SCRIPT } from '@vbyte/btc-dev'

// Detect lock script type
const type = SCRIPT.get_lock_script_type(scriptPubKey)
// Returns: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'opreturn' | null

// Check specific types
SCRIPT.is_p2wpkh_script(script)  // true/false
SCRIPT.is_p2tr_script(script)    // true/false

// Get witness version
const version = SCRIPT.get_lock_script_version(script)
// Returns: 0 (segwit v0), 1 (taproot), or null (legacy)
```

### Witness Parsing

```typescript
import { WITNESS } from '@vbyte/btc-dev'

// Parse witness data from transaction input
const witnessData = WITNESS.parse(witness)

console.log(witnessData.type)     // 'p2wpkh' | 'p2wsh' | 'p2tr' | 'p2ts' | null
console.log(witnessData.version)  // 0 | 1 | null
console.log(witnessData.params)   // Signature and other params
console.log(witnessData.script)   // Witness script (if p2wsh/p2ts)
console.log(witnessData.cblock)   // Control block (if p2ts)
console.log(witnessData.annex)    // Annex data (if present)
```

### Metadata Utilities

```typescript
import { META } from '@vbyte/btc-dev'

// Encode/decode locktime (BIP-65)
const locktime = META.encode_locktime({ type: 'heightlock', height: 800000 })
const decoded = META.decode_locktime(locktime)

// Encode/decode sequence (BIP-68)
const sequence = META.encode_sequence({ mode: 'height', height: 144 })  // ~24 hours
const decodedSeq = META.decode_sequence(sequence)

// Reference pointers
const outpoint = META.RefPointer.outpoint.encode(txid, vout)
const inscriptionId = META.RefPointer.record_id.encode(txid, 0)
const runeId = META.RefPointer.rune_id.encode(840000, 15)
```

## Security Considerations

- Always validate inputs before signing transactions
- Never log or expose secret keys
- Use secure random number generation for key generation
- Verify signatures after signing to ensure correctness
- Be aware of sighash flag implications (ANYONECANPAY, SINGLE, NONE)

See [SECURITY.md](./docs/SECURITY.md) for detailed security guidelines.

## Type Definitions

All types are exported from the main module:

```typescript
import type {
  TxData,
  TxInput,
  TxOutput,
  SigHashOptions,
  AddressData,
  WitnessData,
  TaprootContext
} from '@vbyte/btc-dev'
```

## Dependencies

- `@noble/curves` - Elliptic curve cryptography
- `@noble/hashes` - Cryptographic hash functions
- `@scure/btc-signer` - Bitcoin signing utilities
- `@vbyte/buff` - Buffer manipulation utilities
- `zod` - Runtime validation schemas

## Development

```bash
# Run tests
npm test

# Run specific test file
npm run script test/path/to/file.ts

# Build the package
npm run build

# Build and test
npm run package
```

## License

CC-BY-1.0
