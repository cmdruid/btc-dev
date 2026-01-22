# Examples

Practical examples for common Bitcoin development tasks using `@vbyte/btc-dev`.

## Table of Contents

1. [Creating Addresses](#creating-addresses)
2. [Parsing Transactions](#parsing-transactions)
3. [Building Transactions](#building-transactions)
4. [Signing with Segwit](#signing-with-segwit)
5. [Signing with Taproot](#signing-with-taproot)
6. [Working with Scripts](#working-with-scripts)
7. [Decoding Witness Data](#decoding-witness-data)
8. [Using Timelocks](#using-timelocks)

---

## Creating Addresses

### P2PKH (Legacy)

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// From compressed public key (33 bytes)
const pubkey = '02' + 'aa'.repeat(32)
const address = ADDRESS.p2pkh(pubkey, 'main')

console.log(address.data)     // '1...' (mainnet address)
console.log(address.format)   // 'p2pkh'
console.log(address.network)  // 'main'
console.log(address.script.hex)  // scriptPubKey
```

### P2WPKH (Native Segwit)

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

const pubkey = '02' + 'bb'.repeat(32)
const address = ADDRESS.p2wpkh(pubkey, 'main')

console.log(address.data)     // 'bc1q...' (bech32)
console.log(address.format)   // 'p2wpkh'
console.log(address.version)  // 0
```

### P2WSH (Pay to Witness Script Hash)

```typescript
import { ADDRESS, SCRIPT } from '@vbyte/btc-dev'

// Create a 2-of-3 multisig script
const redeemScript = '5221' + pubkey1 + '21' + pubkey2 + '21' + pubkey3 + '53ae'
const address = ADDRESS.p2wsh(redeemScript, 'main')

console.log(address.data)     // 'bc1q...' (bech32, longer)
console.log(address.format)   // 'p2wsh'
```

### P2TR (Taproot)

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// x-only public key (32 bytes, no prefix)
const xOnlyPubkey = 'cc'.repeat(32)
const address = ADDRESS.p2tr(xOnlyPubkey, 'main')

console.log(address.data)     // 'bc1p...' (bech32m)
console.log(address.format)   // 'p2tr'
console.log(address.version)  // 1
```

### Testnet Addresses

```typescript
import { ADDRESS } from '@vbyte/btc-dev'

// Testnet P2WPKH
const testAddr = ADDRESS.p2wpkh(pubkey, 'test')
console.log(testAddr.data)  // 'tb1q...'

// Testnet P2TR
const testTr = ADDRESS.p2tr(xOnlyPubkey, 'test')
console.log(testTr.data)  // 'tb1p...'
```

---

## Parsing Transactions

### Parse Raw Transaction

```typescript
import { TX } from '@vbyte/btc-dev'

const rawTx = '0200000001...'  // hex encoded transaction
const tx = TX.parse(rawTx)

// Access transaction fields
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
  console.log('  Witness elements:', input.witness.length)
})

// Examine outputs
tx.vout.forEach((output, i) => {
  console.log(`Output ${i}:`)
  console.log('  Value:', output.value, 'satoshis')
  console.log('  Script:', output.script_pk)
})
```

### Calculate Transaction Size

```typescript
import { TX } from '@vbyte/btc-dev'

const tx = TX.parse(rawTx)
const size = TX.get_size(tx)

console.log('Base size:', size.base, 'bytes')
console.log('Total size:', size.total, 'bytes')
console.log('Virtual size:', size.vsize, 'vbytes')
console.log('Weight:', size.weight, 'weight units')

// Calculate fee rate
const fee = 10000n  // satoshis
const feeRate = Number(fee) / size.vsize
console.log('Fee rate:', feeRate.toFixed(2), 'sat/vB')
```

---

## Building Transactions

### Create Transaction Template

```typescript
import { TX } from '@vbyte/btc-dev'

// Define transaction template
const template = {
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: 'aa'.repeat(32),
      vout: 0,
      sequence: 0xfffffffe,  // RBF enabled
      prevout: {
        value: 100000n,
        script_pk: '0014' + '89'.repeat(20)  // P2WPKH
      }
    }
  ],
  vout: [
    {
      value: 90000n,
      script_pk: '0014' + 'bb'.repeat(20)  // P2WPKH recipient
    },
    {
      value: 9000n,
      script_pk: '0014' + 'cc'.repeat(20)  // Change output
    }
  ]
}

// Create transaction
const tx = TX.create(template)

// Encode to hex (without witnesses)
const rawTx = TX.encode(tx, false)
console.log('Raw transaction:', rawTx)
```

---

## Signing with Segwit

### P2WPKH Signing

```typescript
import { TX, SIGNER, SIGHASH } from '@vbyte/btc-dev'

// Your secret key (32 bytes hex)
const secretKey = 'dd'.repeat(32)
const publicKey = '02' + 'ee'.repeat(32)  // Corresponding compressed pubkey

// Transaction to sign
const tx = TX.create(template)

// Sign the first input
const signature = SIGNER.sign_segwit_tx(secretKey, tx, {
  txindex: 0,
  pubkey: publicKey,
  sigflag: 0x01  // SIGHASH_ALL
})

// Add witness to transaction
tx.vin[0].witness = [signature, publicKey]

// Verify the signature
const result = SIGNER.verify_tx(tx)
console.log('Valid:', result.valid)

// Encode final transaction
const signedTx = TX.encode(tx, true)  // Include witness
console.log('Signed transaction:', signedTx)
```

### P2WSH Signing (Multisig)

```typescript
import { TX, SIGNER, SCRIPT } from '@vbyte/btc-dev'

// 2-of-2 multisig redeem script
const redeemScript = '5221' + pubkey1 + '21' + pubkey2 + '52ae'

// Sign with first key
const sig1 = SIGNER.sign_segwit_tx(secretKey1, tx, {
  txindex: 0,
  script: redeemScript,
  sigflag: 0x01
})

// Sign with second key
const sig2 = SIGNER.sign_segwit_tx(secretKey2, tx, {
  txindex: 0,
  script: redeemScript,
  sigflag: 0x01
})

// Build witness: [OP_0, sig1, sig2, redeemScript]
tx.vin[0].witness = ['', sig1, sig2, redeemScript]
```

---

## Signing with Taproot

### Key-Path Spend

```typescript
import { TX, SIGNER, TAPROOT } from '@vbyte/btc-dev'

// Internal secret key
const internalSeckey = 'ff'.repeat(32)

// For key-path, tweak the secret key
const taptweak = TAPROOT.encode_taptweak(internalPubkey)
const tweakedSeckey = TAPROOT.tweak_seckey(internalSeckey, taptweak)

// Sign with tweaked key
const signature = SIGNER.sign_taproot_tx(tweakedSeckey, tx, {
  txindex: 0,
  sigflag: 0x00  // SIGHASH_DEFAULT
})

// Witness: just the signature
tx.vin[0].witness = [signature]

// Encode
const signedTx = TX.encode(tx, true)
```

### Script-Path Spend

```typescript
import { TX, SIGNER, TAPROOT, SCRIPT } from '@vbyte/btc-dev'

// Define tapscript: <pubkey> OP_CHECKSIG
const tapscript = '20' + xOnlyPubkey + 'ac'

// Create taproot context with script
const taprootCtx = TAPROOT.create({
  pubkey: internalPubkey,
  leaves: [TAPROOT.encode_tapscript(tapscript)],
  target: TAPROOT.encode_tapscript(tapscript).hex
})

// Sign with the script-path key
const signature = SIGNER.sign_taproot_tx(scriptSeckey, tx, {
  txindex: 0,
  sigflag: 0x00,
  script: tapscript
})

// Witness: [signature, script, control_block]
tx.vin[0].witness = [signature, tapscript, taprootCtx.cblock]
```

---

## Working with Scripts

### Detect Script Type

```typescript
import { SCRIPT } from '@vbyte/btc-dev'

const scripts = [
  '76a914' + '89'.repeat(20) + '88ac',      // P2PKH
  'a914' + '89'.repeat(20) + '87',          // P2SH
  '0014' + '89'.repeat(20),                 // P2WPKH
  '0020' + '89'.repeat(32),                 // P2WSH
  '5120' + '89'.repeat(32),                 // P2TR
  '6a' + '04' + 'deadbeef'                  // OP_RETURN
]

scripts.forEach(script => {
  const type = SCRIPT.get_lock_script_type(script)
  const version = SCRIPT.get_lock_script_version(script)
  console.log(`${script.slice(0, 10)}... -> ${type}, v${version}`)
})
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

---

## Decoding Witness Data

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

---

## Using Timelocks

### Block Height Locktime

```typescript
import { META, TX } from '@vbyte/btc-dev'

// Lock until block 850000
const locktime = META.encode_locktime({
  type: 'heightlock',
  height: 850000
})

const tx = TX.create({
  version: 2,
  locktime,  // Transaction can't be mined until block 850000
  vin: [...],
  vout: [...]
})

// Decode locktime
const decoded = META.decode_locktime(tx.locktime)
console.log(decoded)  // { type: 'heightlock', height: 850000 }
```

### Timestamp Locktime

```typescript
import { META } from '@vbyte/btc-dev'

// Lock until a specific Unix timestamp (must be > 500000000)
const locktime = META.encode_locktime({
  type: 'timelock',
  stamp: 1704067200  // 2024-01-01 00:00:00 UTC
})
```

### Relative Timelock (BIP-68)

```typescript
import { META } from '@vbyte/btc-dev'

// Lock for 144 blocks (~24 hours)
const sequence = META.encode_sequence({
  mode: 'height',
  height: 144
})

// Lock for specific time (in 512-second increments)
const timeSequence = META.encode_sequence({
  mode: 'stamp',
  stamp: 86400  // 24 hours = 86400 seconds
})

// Apply to transaction input
const tx = TX.create({
  vin: [{
    txid: '...',
    vout: 0,
    sequence  // Uses relative timelock
  }],
  vout: [...]
})
```

---

## Complete Example: P2WPKH Transaction

```typescript
import { ADDRESS, TX, SIGNER, SCRIPT } from '@vbyte/btc-dev'
import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'

// Generate keys
const secretKey = randomBytes(32)
const publicKey = secp256k1.getPublicKey(secretKey, true)

// Create receiving address
const address = ADDRESS.p2wpkh(publicKey, 'test')
console.log('Address:', address.data)

// Later, spend from this address
const utxo = {
  txid: 'previous_txid_here'.padEnd(64, '0'),
  vout: 0,
  value: 100000n,
  script_pk: address.script.hex
}

// Build transaction
const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: utxo.txid,
    vout: utxo.vout,
    sequence: 0xffffffff,
    prevout: {
      value: utxo.value,
      script_pk: utxo.script_pk
    }
  }],
  vout: [{
    value: 90000n,
    script_pk: '0014' + '00'.repeat(20)  // Recipient
  }]
})

// Sign
const signature = SIGNER.sign_segwit_tx(
  Buffer.from(secretKey).toString('hex'),
  tx,
  {
    txindex: 0,
    pubkey: Buffer.from(publicKey).toString('hex'),
    sigflag: 0x01
  }
)

// Add witness
tx.vin[0].witness = [signature, Buffer.from(publicKey).toString('hex')]

// Verify
const result = SIGNER.verify_tx(tx)
if (!result.valid) {
  throw new Error('Signature verification failed')
}

// Get final transaction hex
const signedTxHex = TX.encode(tx, true)
console.log('Signed TX:', signedTxHex)

// Calculate size and fee
const size = TX.get_size(tx)
console.log('Virtual size:', size.vsize, 'vbytes')
console.log('Fee:', 100000n - 90000n, 'satoshis')
console.log('Fee rate:', (10000 / size.vsize).toFixed(2), 'sat/vB')
```
