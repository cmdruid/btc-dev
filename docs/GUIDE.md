# @vbyte/btc-dev Guide

Complete guide to Bitcoin development with `@vbyte/btc-dev`.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Addresses](#addresses)
- [Transactions](#transactions)
- [Signing](#signing)
- [Taproot](#taproot)
- [Timelocks](#timelocks)
- [Scripts](#scripts)
- [Witness Data](#witness-data)
- [Import Patterns](#import-patterns)

---

## Installation

### npm

```bash
npm install @vbyte/btc-dev
```

### yarn

```bash
yarn add @vbyte/btc-dev
```

### pnpm

```bash
pnpm add @vbyte/btc-dev
```

### CDN (Browser)

```html
<script src="https://unpkg.com/@vbyte/btc-dev/dist/script.js"></script>
```

### Prerequisites

- Node.js 18 or later
- Basic understanding of Bitcoin concepts (addresses, transactions, UTXOs)

---

## Quick Start

Create a P2WPKH address and sign a transaction in under 3 minutes:

```typescript
import { ADDRESS, TX, SIGNER } from '@vbyte/btc-dev'

// Create a P2WPKH address from a compressed public key
const pubkey = '02e96fe52ef0e22d2f131dd425ce1893073a3c6ad20e8cac36726393dfb4856a4c'
const address = ADDRESS.p2wpkh(pubkey, 'main')
console.log(address.data)  // bc1q...

// Build a transaction
const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: 'aa'.repeat(32),
    vout: 0,
    sequence: 0xffffffff,
    prevout: { value: 100000n, script_pk: address.script.hex }
  }],
  vout: [{
    value: 90000n,
    script_pk: '0014' + '00'.repeat(20)
  }]
})

// Sign and verify
const signature = SIGNER.sign_segwit_tx(secretKey, tx, {
  txindex: 0,
  pubkey: pubkey,
  sigflag: 0x01
})
tx.vin[0].witness = [signature, pubkey]

const result = SIGNER.verify_tx(tx)
console.log('Valid:', result.valid)
```

---

## Addresses

### Address Types Overview

| Type | Prefix (mainnet) | Function | Recommendation |
|------|------------------|----------|----------------|
| P2PKH | `1...` | `ADDRESS.p2pkh()` | Avoid for new projects |
| P2SH | `3...` | `ADDRESS.p2sh()` | Avoid for new projects |
| P2WPKH | `bc1q...` | `ADDRESS.p2wpkh()` | **Recommended** |
| P2WSH | `bc1q...` (longer) | `ADDRESS.p2wsh()` | For complex scripts |
| P2TR | `bc1p...` | `ADDRESS.p2tr()` | Best for privacy |

### P2WPKH (Recommended)

P2WPKH (Pay to Witness Public Key Hash) is the most efficient address type for single-signature use cases:

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// Create from a compressed public key (33 bytes)
const pubkey = '02e96fe52ef0e22d2f131dd425ce1893073a3c6ad20e8cac36726393dfb4856a4c'
const address = ADDRESS.p2wpkh(pubkey, 'main')

console.log(address.data)       // bc1q...
console.log(address.format)     // 'p2wpkh'
console.log(address.network)    // 'main'
console.log(address.version)    // 0
console.log(address.script.hex) // '0014' + pubkey_hash (20 bytes)
```

The scriptPubKey format is: `OP_0 <20-byte-pubkey-hash>` = `0x0014 + HASH160(compressed_pubkey)`

### P2TR (Taproot)

P2TR provides the best privacy since key-path spends look identical:

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// x-only public key (32 bytes, no 02/03 prefix)
const xOnlyPubkey = 'cc'.repeat(32)
const address = ADDRESS.p2tr(xOnlyPubkey, 'main')

console.log(address.data)    // bc1p...
console.log(address.format)  // 'p2tr'
console.log(address.version) // 1
```

**Converting compressed to x-only:**

```typescript
// Compressed key: 02 or 03 prefix + 32 bytes
const compressedKey = '02e96fe52ef0e22d2f131dd425ce1893073a3c6ad20e8cac36726393dfb4856a4c'

// x-only key: just the 32 bytes (no prefix)
const xOnlyKey = compressedKey.slice(2)  // Remove 02/03 prefix
```

### P2WSH (Multisig)

P2WSH allows spending with a witness script:

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// 2-of-3 multisig script
const multisigScript = '5221' + pubkey1 + '21' + pubkey2 + '21' + pubkey3 + '53ae'
const address = ADDRESS.p2wsh(multisigScript, 'main')

console.log(address.data)    // bc1q... (62 characters)
console.log(address.format)  // 'p2wsh'
```

The scriptPubKey format is: `OP_0 <32-byte-script-hash>` = `0x0020 + SHA256(witness_script)`

### Legacy Addresses (P2PKH, P2SH)

For compatibility with old systems only:

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// P2PKH
const p2pkh = ADDRESS.p2pkh(pubkey, 'main')
console.log(p2pkh.data)  // 1...

// P2SH
const p2sh = ADDRESS.p2sh(redeemScript, 'main')
console.log(p2sh.data)   // 3...
```

### Network Prefixes

| Type | Mainnet | Testnet |
|------|---------|---------|
| P2PKH | `1` | `m` or `n` |
| P2SH | `3` | `2` |
| P2WPKH | `bc1q` | `tb1q` |
| P2WSH | `bc1q` | `tb1q` |
| P2TR | `bc1p` | `tb1p` |

```typescript
// Always specify network explicitly
const mainAddr = ADDRESS.p2wpkh(pubkey, 'main')  // bc1q...
const testAddr = ADDRESS.p2wpkh(pubkey, 'test')  // tb1q...
```

### Parsing Addresses

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// Parse address string
const info = ADDRESS.parse_address('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
console.log(info.type)     // 'p2wpkh'
console.log(info.network)  // 'main'
console.log(info.hash)     // pubkey hash

// Get address from scriptPubKey
const scriptPubKey = '0014751e76e8199196d454941c45d1b3a323f1433bd6'
const address = ADDRESS.get_address(scriptPubKey, 'main')
// 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
```

### ScriptPubKey Patterns

Quick reference for identifying address types from scriptPubKey:

| Type | Pattern | Size |
|------|---------|------|
| P2PKH | `76a914{20-bytes}88ac` | 25 bytes |
| P2SH | `a914{20-bytes}87` | 23 bytes |
| P2WPKH | `0014{20-bytes}` | 22 bytes |
| P2WSH | `0020{32-bytes}` | 34 bytes |
| P2TR | `5120{32-bytes}` | 34 bytes |

---

## Transactions

### Transaction Structure

```typescript
interface TxData {
  version: number      // Transaction version (usually 1 or 2)
  locktime: number     // Block height or timestamp lock
  vin: TxInput[]       // Inputs (UTXOs being spent)
  vout: TxOutput[]     // Outputs (new UTXOs created)
}

interface TxInput {
  txid: string         // Previous transaction ID (32 bytes)
  vout: number         // Output index in previous tx
  sequence: number     // Sequence number (for timelocks, RBF)
  script_sig: string | null  // Legacy unlock script
  witness: string[]    // Segwit/taproot witness data
  prevout: TxOutput | null   // Previous output data (for signing)
}

interface TxOutput {
  value: bigint        // Amount in satoshis
  script_pk: string    // Locking script (scriptPubKey)
}
```

### Parsing Transactions

```typescript
import { TX, SCRIPT } from '@vbyte/btc-dev'

const rawTx = '02000000000101...'
const tx = TX.parse(rawTx)

console.log('Version:', tx.version)
console.log('Locktime:', tx.locktime)
console.log('Inputs:', tx.vin.length)
console.log('Outputs:', tx.vout.length)

// Examine inputs
tx.vin.forEach((input, i) => {
  console.log(`Input ${i}:`)
  console.log('  TXID:', input.txid)
  console.log('  Vout:', input.vout)
  console.log('  Sequence:', input.sequence.toString(16))
  console.log('  Witnesses:', input.witness.length)
})

// Examine outputs
tx.vout.forEach((output, i) => {
  const type = SCRIPT.get_lock_script_type(output.script_pk)
  console.log(`Output ${i}:`)
  console.log('  Value:', output.value, 'sats')
  console.log('  Type:', type)
})
```

### Building Transactions

```typescript
import { TX } from '@vbyte/btc-dev'

const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: 'abcd'.repeat(16),    // 32-byte TXID
    vout: 0,                     // First output of that tx
    sequence: 0xffffffff,        // No RBF, no relative timelock
    prevout: {
      value: 100000n,            // Previous output value (for signing)
      script_pk: '0014aa...'     // Previous output script
    }
  }],
  vout: [{
    value: 90000n,               // Amount to send
    script_pk: '0014bb...'       // Recipient's scriptPubKey
  }]
})

// Fee is implicit: 100000 - 90000 = 10000 satoshis
```

**Multiple inputs and outputs:**

```typescript
const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [
    { txid: 'aa...', vout: 0, sequence: 0xffffffff,
      prevout: { value: 50000n, script_pk: '0014...' } },
    { txid: 'bb...', vout: 1, sequence: 0xffffffff,
      prevout: { value: 60000n, script_pk: '0014...' } }
  ],
  vout: [
    { value: 80000n, script_pk: '0014...' },  // Payment
    { value: 25000n, script_pk: '0014...' }   // Change
  ]
})
// Total in: 110000, Total out: 105000, Fee: 5000
```

**RBF (Replace-By-Fee):**

Enable RBF by setting sequence < 0xfffffffe:

```typescript
{
  txid: '...',
  vout: 0,
  sequence: 0xfffffffd  // RBF enabled
}
```

### Encoding Transactions

```typescript
import { TX } from '@vbyte/btc-dev'

// With witness data (for broadcasting)
const signedTxHex = TX.encode(tx, true).hex

// Without witness (for txid calculation)
const legacyTxHex = TX.encode(tx, false).hex
```

### Transaction Sizes and Fees

```typescript
import { TX } from '@vbyte/btc-dev'

const size = TX.get_size(tx)

console.log('Base size:', size.base, 'bytes')     // Without witness
console.log('Total size:', size.total, 'bytes')   // With witness
console.log('Virtual size:', size.vsize, 'vbytes') // For fee calculation
console.log('Weight:', size.weight, 'WU')          // Weight units

// Calculate fee rate
const inputTotal = tx.vin.reduce((sum, vin) => sum + vin.prevout.value, 0n)
const outputTotal = tx.vout.reduce((sum, vout) => sum + vout.value, 0n)
const fee = inputTotal - outputTotal
const feeRate = Number(fee) / size.vsize
console.log(`Fee rate: ${feeRate.toFixed(2)} sat/vB`)
```

**Approximate sizes for common input types:**

| Input Type | Witness Size | vBytes (approx) |
|------------|--------------|-----------------|
| P2WPKH | 107 bytes | 68 vB |
| P2TR key-path | 64 bytes | 57.5 vB |
| P2WSH 2-of-2 | ~220 bytes | ~100 vB |

| Output Type | Size |
|-------------|------|
| P2WPKH | 31 bytes |
| P2TR | 43 bytes |
| P2WSH | 43 bytes |

---

## Signing

### P2WPKH Signing

```typescript
import { TX, SIGNER } from '@vbyte/btc-dev'

// Build unsigned transaction
const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: prevTxid,
    vout: 0,
    sequence: 0xffffffff,
    prevout: {
      value: 100000n,
      script_pk: '0014' + pubkeyHash  // P2WPKH script
    }
  }],
  vout: [{
    value: 90000n,
    script_pk: recipientScript
  }]
})

// Sign input 0
const signature = SIGNER.sign_segwit_tx(secretKey, tx, {
  txindex: 0,
  pubkey: compressedPubkey,
  sigflag: 0x01  // SIGHASH_ALL
})

// Add witness
tx.vin[0].witness = [signature, compressedPubkey]
```

### P2WSH Signing (Multisig)

```typescript
import { TX, SIGNER } from '@vbyte/btc-dev'

// 2-of-2 multisig redeem script
const redeemScript = '5221' + pubkey1 + '21' + pubkey2 + '52ae'

// Sign with both keys
const sig1 = SIGNER.sign_segwit_tx(secretKey1, tx, {
  txindex: 0,
  script: redeemScript,
  sigflag: 0x01
})

const sig2 = SIGNER.sign_segwit_tx(secretKey2, tx, {
  txindex: 0,
  script: redeemScript,
  sigflag: 0x01
})

// Build witness: [OP_0, sig1, sig2, redeemScript]
tx.vin[0].witness = ['', sig1, sig2, redeemScript]
```

### Sighash Flags

Control what parts of the transaction the signature commits to:

| Flag | Value | Meaning |
|------|-------|---------|
| SIGHASH_DEFAULT | 0x00 | Taproot default (equivalent to ALL) |
| SIGHASH_ALL | 0x01 | Sign all inputs and outputs (safest) |
| SIGHASH_NONE | 0x02 | Sign inputs only, outputs modifiable |
| SIGHASH_SINGLE | 0x03 | Sign only the output at same index |
| ANYONECANPAY | 0x80 | Sign only own input (combine with above) |

```typescript
// Standard: sign everything
SIGNER.sign_segwit_tx(key, tx, { txindex: 0, sigflag: 0x01 })

// Allow adding more inputs
SIGNER.sign_segwit_tx(key, tx, { txindex: 0, sigflag: 0x81 })  // ALL|ANYONECANPAY

// Sign only one input and its corresponding output
SIGNER.sign_segwit_tx(key, tx, { txindex: 0, sigflag: 0x83 })  // SINGLE|ANYONECANPAY
```

### Verifying Transactions

```typescript
import { SIGNER } from '@vbyte/btc-dev'

const result = SIGNER.verify_tx(tx)

if (result.valid) {
  console.log('All signatures valid')
} else {
  console.log('Verification failed:', result.error)
  result.inputs.forEach(input => {
    if (!input.valid) {
      console.log(`Input ${input.index}: ${input.error}`)
    }
  })
}

// Or throw on failure
try {
  SIGNER.verify_tx(tx, { throws: true })
  console.log('Transaction is valid')
} catch (err) {
  console.log('Invalid:', err.message)
}
```

### Signing Multiple Inputs

```typescript
for (let i = 0; i < tx.vin.length; i++) {
  const sig = SIGNER.sign_segwit_tx(secretKey, tx, {
    txindex: i,
    pubkey: pubkeys[i],
    sigflag: 0x01
  })
  tx.vin[i].witness = [sig, pubkeys[i]]
}
```

---

## Taproot

### Key Concepts

**x-only Public Keys:**

Taproot uses 32-byte "x-only" public keys instead of 33-byte compressed keys:

```typescript
// Compressed (33 bytes): prefix + x-coordinate
const compressed = '02e96fe52ef0e22d2f131dd425ce1893073a3c6ad20e8cac36726393dfb4856a4c'

// x-only (32 bytes): just the x-coordinate
const xOnly = compressed.slice(2)
```

**Tweaking:**

The internal key is "tweaked" with the merkle root of scripts to produce the taproot output key:

```
taproot_output_key = internal_key + tweak * G
tweak = tagged_hash("TapTweak", internal_key || merkle_root)
```

### Key-Path Spending

The simplest taproot usage: spending with just a signature.

```typescript
import { TX, SIGNER, TAPROOT, ADDRESS } from '@vbyte/btc-dev'

// Internal public key (32 bytes, x-only)
const internalPubkey = 'cc'.repeat(32)

// For key-path only (no scripts), tweak with empty root
const taptweak = TAPROOT.encode_taptweak(internalPubkey)

// Build transaction
const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: '...',
    vout: 0,
    sequence: 0xffffffff,
    prevout: {
      value: 100000n,
      script_pk: '5120' + tweakedPubkey  // P2TR script
    }
  }],
  vout: [{
    value: 90000n,
    script_pk: '5120...'
  }]
})

// Tweak the secret key for signing
const tweakedSeckey = TAPROOT.tweak_seckey(internalSeckey, taptweak)

// Sign
const signature = SIGNER.sign_taproot_tx(tweakedSeckey, tx, {
  txindex: 0,
  sigflag: 0x00  // SIGHASH_DEFAULT
})

// Key-path witness is just the signature
tx.vin[0].witness = [signature]
```

### Script-Path Spending

Spend by revealing a script from the taproot tree.

**Tapscripts:**

Tapscripts are Bitcoin scripts with BIP-342 modifications:

```typescript
import { TAPROOT } from '@vbyte/btc-dev'

// Simple tapscript: <pubkey> OP_CHECKSIG
const tapscript = '20' + xOnlyPubkey + 'ac'

// Encode as a tapleaf
const tapleaf = TAPROOT.encode_tapscript(tapscript)
```

**Building a Taproot Tree:**

```typescript
import { TAPROOT } from '@vbyte/btc-dev'

// Define scripts
const script1 = '20' + pubkey1 + 'ac'  // <pk1> OP_CHECKSIG
const script2 = '20' + pubkey2 + 'ac'  // <pk2> OP_CHECKSIG

// Encode as tapleaves
const leaf1 = TAPROOT.encode_tapscript(script1)
const leaf2 = TAPROOT.encode_tapscript(script2)

// Build the tree
const tree = [leaf1.hex, leaf2.hex]

// Get merkle root
const [root, target, path] = TAPROOT.merkleize(tree, leaf1.hex)
console.log('Root:', root)
```

**Complex Trees:**

Trees can be nested for more scripts:

```typescript
// Balanced tree with 4 scripts
const tree = [
  [leaf1, leaf2],  // Left branch
  [leaf3, leaf4]   // Right branch
]

const [root] = TAPROOT.merkleize(tree)
```

**Building a Control Block:**

To spend via script-path, you need a control block proving the script is in the tree:

```typescript
import { TAPROOT } from '@vbyte/btc-dev'

// Merkleize and get path to target script
const targetLeaf = TAPROOT.encode_tapscript(script1).hex
const [root, target, path] = TAPROOT.merkleize(tree, targetLeaf)

// Build control block
const cblock = TAPROOT.build_cblock(
  internalPubkey,
  path,
  0,     // parity (0 or 1)
  0xc0   // leaf version
)

console.log(cblock.hex)
// Structure: <version|parity> || <internal_pubkey> || <merkle_path>
```

**Signing Script-Path:**

```typescript
import { SIGNER, TAPROOT } from '@vbyte/btc-dev'

// The tapleaf hash is the "extension" for signing
const tapleafHash = TAPROOT.encode_tapscript(script).hex

// Sign with the script's key (NOT the tweaked key)
const signature = SIGNER.sign_taproot_tx(scriptSeckey, tx, {
  txindex: 0,
  sigflag: 0x00,
  extension: tapleafHash  // Commits to the script being used
})

// Script-path witness: [signature(s), script, control_block]
tx.vin[0].witness = [signature, script, cblock.hex]
```

### Control Block Structure

The control block proves a script is in the taproot tree:

```
<1 byte: leaf_version | output_key_parity>
<32 bytes: internal_public_key>
<32*n bytes: merkle path (sibling hashes)>
```

**Parsing:**

```typescript
import { TAPROOT } from '@vbyte/btc-dev'

const data = TAPROOT.parse_cblock(cblockHex)

console.log(data.version)   // Leaf version (usually 0xc0)
console.log(data.parity)    // Output key parity (0 or 1)
console.log(data.pubkey)    // Internal public key
console.log(data.path)      // Merkle path array
```

**Verifying:**

```typescript
import { TAPROOT } from '@vbyte/btc-dev'

const tapkey = taprootOutputKey
const target = TAPROOT.encode_tapscript(script).hex
const isValid = TAPROOT.verify_taproot(tapkey, target, cblock)

if (!isValid) {
  throw new Error('Control block verification failed')
}
```

### Sighash in Taproot

Taproot uses different sighash types (BIP-341):

| Flag | Value | Description |
|------|-------|-------------|
| SIGHASH_DEFAULT | 0x00 | Same as ALL, but signature is 64 bytes |
| SIGHASH_ALL | 0x01 | Sign all inputs and outputs |
| SIGHASH_NONE | 0x02 | Sign inputs only |
| SIGHASH_SINGLE | 0x03 | Sign corresponding output only |
| ANYONECANPAY | 0x80 | Sign only this input |

The default (0x00) produces 64-byte signatures. Any other flag produces 65-byte signatures.

```typescript
// Default: 64-byte signature
const sig = SIGNER.sign_taproot_tx(key, tx, { txindex: 0, sigflag: 0x00 })
console.log(sig.length)  // 128 hex chars = 64 bytes

// SIGHASH_ALL: 65-byte signature
const sig2 = SIGNER.sign_taproot_tx(key, tx, { txindex: 0, sigflag: 0x01 })
console.log(sig2.length)  // 130 hex chars = 65 bytes
```

### Best Practices

**Key-Path vs Script-Path:**
- **Key-path** when possible (cheapest, most private)
- **Script-path** for complex conditions, multisig, or fallback conditions

**Tree Design:**
- Put most-likely-used scripts closer to root (shorter proofs)
- Balance the tree for equal-probability scripts
- Maximum tree depth: 128 levels

**Privacy:**
- Key-path spends don't reveal script existence
- Script-path reveals only the used script, not others
- Use randomized internal keys for unlinkability

---

## Timelocks

### Transaction-Level Locktime (BIP-65)

```typescript
import { META, TX } from '@vbyte/btc-dev'

// Lock until block 850000
const locktime = META.encode_locktime({
  type: 'heightlock',
  height: 850000
})

const tx = TX.create({
  version: 2,
  locktime,  // Can't be mined before block 850000
  vin: [...],
  vout: [...]
})

// Decode locktime
const decoded = META.decode_locktime(tx.locktime)
console.log(decoded)  // { type: 'heightlock', height: 850000 }
```

**Timestamp Locktime:**

```typescript
import { META } from '@vbyte/btc-dev'

// Lock until a specific Unix timestamp (must be > 500000000)
const locktime = META.encode_locktime({
  type: 'timelock',
  stamp: 1704067200  // 2024-01-01 00:00:00 UTC
})
```

### Input-Level Relative Timelock (BIP-68)

```typescript
import { META, TX } from '@vbyte/btc-dev'

// Wait 144 blocks (~24 hours) after input confirms
const sequence = META.encode_sequence({
  mode: 'height',
  height: 144
})

const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: '...',
    vout: 0,
    sequence  // Relative timelock on this input
  }],
  vout: [...]
})
```

**Time-based relative locktime:**

```typescript
// Lock for specific time (in 512-second increments)
const sequence = META.encode_sequence({
  mode: 'stamp',
  stamp: 86400  // 24 hours = 86400 seconds
})
```

---

## Scripts

### Detect Script Type

```typescript
import { SCRIPT } from '@vbyte/btc-dev'

const type = SCRIPT.get_lock_script_type(scriptPubKey)
// Returns: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'opreturn' | null

const version = SCRIPT.get_lock_script_version(scriptPubKey)
// Returns: 0 (segwit v0), 1 (taproot), or null (legacy)

// Type-specific checks
SCRIPT.is_p2wpkh_script(script)  // true/false
SCRIPT.is_p2tr_script(script)    // true/false
```

### Encode/Decode Scripts

```typescript
import { SCRIPT } from '@vbyte/btc-dev'

// Decode script to ASM
const asm = SCRIPT.decode(scriptHex)
console.log(asm)  // ['OP_DUP', 'OP_HASH160', '89...', 'OP_EQUALVERIFY', 'OP_CHECKSIG']

// Encode ASM to hex
const hex = SCRIPT.encode(['OP_1', pubkey1, pubkey2, 'OP_2', 'OP_CHECKMULTISIG'])
console.log(hex)
```

### Create Multisig Script

```typescript
import { SCRIPT } from '@vbyte/btc-dev'

// 2-of-3 multisig
const script = SCRIPT.encode([
  'OP_2',
  pubkey1,
  pubkey2,
  pubkey3,
  'OP_3',
  'OP_CHECKMULTISIG'
])
```

---

## Witness Data

### Parse Witness Data

```typescript
import { WITNESS, TX } from '@vbyte/btc-dev'

const tx = TX.parse(rawTx)

tx.vin.forEach((input, i) => {
  if (input.witness.length === 0) {
    console.log(`Input ${i}: No witness (legacy)`)
    return
  }

  const witnessData = WITNESS.parse(input.witness)

  console.log(`Input ${i}:`)
  console.log('  Type:', witnessData.type)
  console.log('  Version:', witnessData.version)
  console.log('  Params:', witnessData.params.length)

  if (witnessData.script) {
    console.log('  Script:', witnessData.script)
  }
  if (witnessData.cblock) {
    console.log('  Control block:', witnessData.cblock)
  }
  if (witnessData.annex) {
    console.log('  Annex:', witnessData.annex)
  }
})
```

### Witness Types

| Type | Description | Witness Stack |
|------|-------------|---------------|
| `p2wpkh` | Segwit single-sig | `[signature, pubkey]` |
| `p2wsh` | Segwit script | `[...args, script]` |
| `p2tr` | Taproot key-path | `[signature]` |
| `p2ts` | Taproot script-path | `[...args, script, cblock]` |

---

## Import Patterns

### Namespace Imports (Recommended)

```typescript
import { ADDRESS, TX, SIGNER, SCRIPT, TAPROOT, SIGHASH, WITNESS, META } from '@vbyte/btc-dev'
```

### Tree-Shaking Imports

For smaller bundles, import specific functions:

```typescript
import { p2wpkh, p2tr } from '@vbyte/btc-dev/address'
import { parse_tx, encode_tx, create_tx } from '@vbyte/btc-dev/tx'
import { sign_segwit_tx, verify_tx } from '@vbyte/btc-dev/signer'
```

### Type Imports

```typescript
import type {
  TxData,
  TxInput,
  TxOutput,
  TxTemplate,
  AddressInfo,
  SigHashOptions,
  WitnessData,
  ChainNetwork
} from '@vbyte/btc-dev'
```

---

## Next Steps

- [API Reference](API.md) - Complete function documentation
- [Security Guide](SECURITY.md) - Best practices for production
- [FAQ](FAQ.md) - Common questions and troubleshooting
