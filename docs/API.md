# API Reference

Complete API reference for all `@vbyte/btc-dev` modules.

## Import Patterns

```typescript
// Namespace imports
import { ADDRESS, TX, SCRIPT, SIGHASH, SIGNER, TAPROOT, WITNESS, META, CONST, SCHEMA } from '@vbyte/btc-dev'

// Tree-shaking imports
import { p2wpkh, p2tr } from '@vbyte/btc-dev/address'
import { parse_tx, encode_tx } from '@vbyte/btc-dev/tx'
```

---

## ADDRESS

Create and parse Bitcoin addresses.

### `ADDRESS.p2pkh(pubkey, network)`

Create a P2PKH (legacy) address from a compressed public key.

```typescript
ADDRESS.p2pkh(pubkey: Bytes, network: ChainNetwork): AddressData
```

**Parameters:**
- `pubkey` - Compressed public key (33 bytes)
- `network` - `'main'` or `'test'`

**Returns:** `AddressData` with address string, script, format, network

```typescript
const addr = ADDRESS.p2pkh('02aa...', 'main')
// addr.data = '1...'
// addr.format = 'p2pkh'
```

### `ADDRESS.p2sh(script, network)`

Create a P2SH address from a redeem script.

```typescript
ADDRESS.p2sh(script: Bytes, network: ChainNetwork): AddressData
```

### `ADDRESS.p2wpkh(pubkey, network)`

Create a P2WPKH (native segwit) address from a compressed public key.

```typescript
ADDRESS.p2wpkh(pubkey: Bytes, network: ChainNetwork): AddressData
```

```typescript
const addr = ADDRESS.p2wpkh('02bb...', 'main')
// addr.data = 'bc1q...'
// addr.format = 'p2wpkh'
// addr.version = 0
```

### `ADDRESS.p2wsh(script, network)`

Create a P2WSH address from a witness script.

```typescript
ADDRESS.p2wsh(script: Bytes, network: ChainNetwork): AddressData
```

### `ADDRESS.p2tr(pubkey, network)`

Create a P2TR (taproot) address from an x-only public key.

```typescript
ADDRESS.p2tr(xOnlyPubkey: Bytes, network: ChainNetwork): AddressData
```

**Parameters:**
- `xOnlyPubkey` - x-only public key (32 bytes, no prefix)
- `network` - `'main'` or `'test'`

```typescript
const addr = ADDRESS.p2tr('cc'.repeat(32), 'main')
// addr.data = 'bc1p...'
// addr.format = 'p2tr'
// addr.version = 1
```

### `ADDRESS.get_address(script, network)`

Get the address for a locking script.

```typescript
get_address(script: Bytes, network?: ChainNetwork): string
```

### `ADDRESS.parse_address(address)`

Parse an address string into address info.

```typescript
parse_address(address: string): AddressInfo
```

---

## TX

Transaction creation, encoding, decoding, and parsing.

### `TX.create(template)`

Create a transaction from a template.

```typescript
create_tx(template?: Partial<TxTemplate>): TxData
```

**Parameters:**
- `template.version` - Transaction version (default: 2)
- `template.locktime` - Locktime (default: 0)
- `template.vin` - Array of input templates
- `template.vout` - Array of output templates

```typescript
const tx = TX.create({
  version: 2,
  locktime: 0,
  vin: [{
    txid: 'aa'.repeat(32),
    vout: 0,
    sequence: 0xffffffff,
    prevout: { value: 100000n, script_pk: '0014...' }
  }],
  vout: [{
    value: 90000n,
    script_pk: '0014...'
  }]
})
```

### `TX.parse(txdata, prevouts?)`

Parse transaction data from hex, bytes, or template.

```typescript
parse_tx(txdata: unknown, prevouts?: TxOutputTemplate[]): TxData
```

**Parameters:**
- `txdata` - Raw hex, Uint8Array, or TxTemplate object
- `prevouts` - Optional array of prevout data for inputs

### `TX.decode(txdata, use_segwit?)`

Decode a raw transaction from hex or bytes.

```typescript
decode_tx(txdata: string | Uint8Array, use_segwit?: boolean): TxDecodedData
```

**Parameters:**
- `txdata` - Raw transaction hex or bytes
- `use_segwit` - Parse witness data (default: true)

### `TX.encode(txdata, use_segwit?)`

Encode a transaction to bytes.

```typescript
encode_tx(txdata: TxData, use_segwit?: boolean): Buff
```

**Parameters:**
- `txdata` - Transaction data object
- `use_segwit` - Include witness data (default: true)

```typescript
const rawTx = TX.encode(tx, true).hex  // With witness
const legacyTx = TX.encode(tx, false).hex  // Without witness
```

### `TX.get_size(txdata)`

Calculate transaction sizes.

```typescript
get_txsize(txdata: string | TxData): TxSize
```

**Returns:**
- `base` - Size without witness (bytes)
- `total` - Total size with witness (bytes)
- `vsize` - Virtual size (vbytes)
- `weight` - Weight units

```typescript
const size = TX.get_size(tx)
console.log(size.vsize)  // Use for fee calculation
```

### `TX.serialize(txdata)`

Serialize transaction to a plain object.

```typescript
serialize_tx(txdata: unknown): Record<string, unknown>
```

---

## SCRIPT

Bitcoin script encoding, decoding, and type detection.

### `SCRIPT.encode(words, varint?)`

Encode script ASM words to bytes.

```typescript
encode_script(words: (string | number | Uint8Array)[], varint?: boolean): Buff
```

**Parameters:**
- `words` - Array of opcodes, hex data, strings, or numbers
- `varint` - Prefix with length varint (default: false)

```typescript
const script = SCRIPT.encode(['OP_DUP', 'OP_HASH160', pubkeyHash, 'OP_EQUALVERIFY', 'OP_CHECKSIG'])
```

### `SCRIPT.decode(script)`

Decode script bytes to ASM words.

```typescript
decode_script(script: Bytes): string[]
```

```typescript
const asm = SCRIPT.decode('76a914...88ac')
// ['OP_DUP', 'OP_HASH160', '...', 'OP_EQUALVERIFY', 'OP_CHECKSIG']
```

### `SCRIPT.parse(script)`

Parse script to info object with both ASM and hex.

```typescript
parse_script(script: Bytes): ScriptInfo
```

### `SCRIPT.get_lock_script_type(script)`

Detect the lock script type.

```typescript
get_lock_script_type(script: Bytes): LockScriptType | null
```

**Returns:** `'p2pkh'` | `'p2sh'` | `'p2wpkh'` | `'p2wsh'` | `'p2tr'` | `'opreturn'` | `null`

```typescript
SCRIPT.get_lock_script_type('0014' + '89'.repeat(20))  // 'p2wpkh'
SCRIPT.get_lock_script_type('5120' + '89'.repeat(32))  // 'p2tr'
```

### `SCRIPT.get_lock_script_version(script)`

Get the witness version of a script.

```typescript
get_lock_script_version(script: Bytes): WitnessVersion | null
```

**Returns:** `0` (segwit v0), `1` (taproot), or `null` (legacy)

### `SCRIPT.is_p2pkh_script(script)`

Check if script is P2PKH.

```typescript
is_p2pkh_script(script: Bytes): boolean
```

### `SCRIPT.is_p2sh_script(script)`

Check if script is P2SH.

```typescript
is_p2sh_script(script: Bytes): boolean
```

### `SCRIPT.is_p2wpkh_script(script)`

Check if script is P2WPKH.

```typescript
is_p2wpkh_script(script: Bytes): boolean
```

### `SCRIPT.is_p2wsh_script(script)`

Check if script is P2WSH.

```typescript
is_p2wsh_script(script: Bytes): boolean
```

### `SCRIPT.is_p2tr_script(script)`

Check if script is P2TR (taproot).

```typescript
is_p2tr_script(script: Bytes): boolean
```

### `SCRIPT.is_opreturn_script(script)`

Check if script is OP_RETURN.

```typescript
is_opreturn_script(script: Bytes): boolean
```

### `SCRIPT.is_valid_script(script)`

Check if a script is valid.

```typescript
is_valid_script(script: string | Uint8Array): boolean
```

---

## SIGHASH

Signature hash calculation for segwit and taproot.

### `SIGHASH.hash_segwit_tx(txdata, options)`

Calculate BIP-143 segwit sighash.

```typescript
hash_segwit_tx(txdata: TxData, options: SigHashOptions): Buff
```

**Options:**
- `txindex` - Input index to sign
- `pubkey` - Public key (for P2WPKH)
- `script` - Redeem script (for P2WSH)
- `sigflag` - Sighash flag (default: 0x01)

### `SIGHASH.hash_taproot_tx(txdata, options)`

Calculate BIP-341 taproot sighash.

```typescript
hash_taproot_tx(txdata: TxData, options: SigHashOptions): Buff
```

**Options:**
- `txindex` - Input index to sign
- `sigflag` - Sighash flag (default: 0x00)
- `extension` - Tapleaf hash for script-path

### Sighash Flags

| Flag | Value | Description |
|------|-------|-------------|
| SIGHASH_DEFAULT | 0x00 | Taproot default (equivalent to ALL) |
| SIGHASH_ALL | 0x01 | Sign all inputs and outputs |
| SIGHASH_NONE | 0x02 | Sign inputs only |
| SIGHASH_SINGLE | 0x03 | Sign only corresponding output |
| SIGHASH_ANYONECANPAY | 0x80 | Sign only own input (combine with above) |

---

## SIGNER

Transaction signing and verification.

### `SIGNER.sign_segwit_tx(seckey, txdata, options)`

Sign a segwit (v0) transaction input.

```typescript
sign_segwit_tx(
  seckey: string,
  txdata: TxData,
  options: SigHashOptions
): string
```

**Parameters:**
- `seckey` - 32-byte secret key as hex (64 characters)
- `txdata` - Transaction data
- `options.txindex` - Input index to sign
- `options.pubkey` - Public key (for P2WPKH)
- `options.script` - Redeem script (for P2WSH)
- `options.sigflag` - Sighash flag (default: 0x01)

**Returns:** DER-encoded ECDSA signature with sighash flag appended

```typescript
const sig = SIGNER.sign_segwit_tx(secretKey, tx, {
  txindex: 0,
  pubkey: publicKey,
  sigflag: 0x01
})
tx.vin[0].witness = [sig, publicKey]
```

### `SIGNER.sign_taproot_tx(seckey, txdata, options)`

Sign a taproot (v1) transaction input.

```typescript
sign_taproot_tx(
  seckey: string,
  txdata: TxData,
  options: SigHashOptions
): string
```

**Parameters:**
- `seckey` - 32-byte secret key as hex (64 characters)
- `txdata` - Transaction data
- `options.txindex` - Input index to sign
- `options.sigflag` - Sighash flag (default: 0x00)
- `options.extension` - Tapleaf hash (for script-path)

**Returns:** 64-byte Schnorr signature (with optional sighash byte if not default)

```typescript
const sig = SIGNER.sign_taproot_tx(tweakedSeckey, tx, {
  txindex: 0,
  sigflag: 0x00
})
tx.vin[0].witness = [sig]
```

### `SIGNER.verify_tx(txdata, options?)`

Verify all signatures in a transaction.

```typescript
verify_tx(
  txdata: TxData | Bytes,
  options?: VerifyOptions
): VerifyResult
```

**Options:**
- `throws` - Throw on verification failure (default: false)

**Returns:**

```typescript
interface VerifyResult {
  valid: boolean
  inputs: InputVerifyResult[]
  error?: string
}

interface InputVerifyResult {
  index: number
  valid: boolean
  type?: string | null
  error?: string
}
```

```typescript
const result = SIGNER.verify_tx(tx)
if (!result.valid) {
  console.log(result.error)
  result.inputs.forEach(input => {
    if (!input.valid) console.log(`Input ${input.index}: ${input.error}`)
  })
}
```

---

## TAPROOT

Taproot tree construction, control blocks, and key tweaking.

### `TAPROOT.get_merkle_root(leaves)`

Get the merkle root of a taproot tree.

```typescript
get_merkle_root(leaves: TapTree): string
```

### `TAPROOT.merkleize(taptree, target?, path?, depth?)`

Process a taproot tree into a merkle proof.

```typescript
merkleize(
  taptree: TapTree,
  target?: string,
  path?: string[],
  depth?: number
): MerkleProof
```

**Returns:** `[root, target, path]`

### `TAPROOT.encode_tapscript(script, version?)`

Encode a script as a tapleaf.

```typescript
encode_tapscript(script: Bytes, version?: number): Buff
```

**Parameters:**
- `script` - The tapscript bytes
- `version` - Leaf version (default: 0xc0)

### `TAPROOT.encode_tapbranch(left, right)`

Encode two leaves/branches into a branch.

```typescript
encode_tapbranch(left: Bytes, right: Bytes): Buff
```

### `TAPROOT.encode_taptweak(pubkey, root?)`

Calculate the taproot tweak.

```typescript
encode_taptweak(pubkey: Bytes, root?: Bytes): Buff
```

### `TAPROOT.build_cblock(pubkey, path, parity?, version?)`

Build a control block for script-path spending.

```typescript
build_cblock(
  pubkey: Bytes,
  path: string[],
  parity?: number,
  version?: number
): Buff
```

### `TAPROOT.parse_cblock(cblock)`

Parse a control block.

```typescript
parse_cblock(cblock: Bytes): ControlBlockData
```

### `TAPROOT.verify_taproot(tapkey, target, cblock)`

Verify a control block proof.

```typescript
verify_taproot(tapkey: Bytes, target: Bytes, cblock: Bytes): boolean
```

### `TAPROOT.create_taproot(config)`

Create a taproot output with optional script tree.

```typescript
create_taproot(config: TaprootConfig): TaprootContext
```

**Parameters:**
- `config.pubkey` - Internal public key (32 bytes, x-only)
- `config.leaves` - Optional array of tapleaf hashes
- `config.target` - Optional target leaf for control block generation
- `config.version` - Leaf version (default: 0xc0)

**Returns:** `TaprootContext` with tapkey, control block, path, and tweaks

```typescript
// Key-path only
const ctx = TAPROOT.create_taproot({ pubkey: internalKey })
console.log(ctx.tapkey)  // Use in P2TR output

// With script tree
const ctx = TAPROOT.create_taproot({
  pubkey: internalKey,
  leaves: [scriptHash1, scriptHash2],
  target: scriptHash1
})
console.log(ctx.cblock)  // Control block for script-path spend
```

### `TAPROOT.parse_taproot_witness(witness)`

Parse a taproot script-path witness and extract spending data.

```typescript
parse_taproot_witness(witness: string[]): {
  cblock: ControlBlock
  params: string[]
  script: string
  tapkey: string
  tweak: string
}
```

**Parameters:**
- `witness` - Array of witness stack elements (hex strings)

**Returns:** Parsed taproot spending data

### `TAPROOT.parse_cblock(cblock)`

Parse a control block into its components.

```typescript
parse_cblock(cblock: Bytes): ControlBlock
```

**Returns:**
- `int_key` - Internal public key (32 bytes hex)
- `path` - Merkle path array
- `parity` - Y-coordinate parity (0x02 or 0x03)
- `version` - Leaf version

```typescript
const { int_key, path, version } = TAPROOT.parse_cblock(controlBlock)
```

### `TAPROOT.parse_cblock_parity(cbits)`

Extract version and parity from control block version byte.

```typescript
parse_cblock_parity(cbits: number): [number, number]
```

**Returns:** Tuple of [version, parity]

```typescript
const [version, parity] = TAPROOT.parse_cblock_parity(0xc1)
// [0xc0, 0x03] - version c0, odd parity
```

### `TAPROOT.parse_pubkey_parity(pubkey)`

Extract parity bit from compressed public key.

```typescript
parse_pubkey_parity(pubkey: Bytes): number
```

**Returns:** 0 for even y-coordinate, 1 for odd

---

## WITNESS

Witness data parsing and analysis.

### `WITNESS.parse(witness)`

Parse witness data from a transaction input.

```typescript
parse_witness(witness: Bytes[]): WitnessData
```

**Returns:**

```typescript
interface WitnessData {
  type: 'p2wpkh' | 'p2wsh' | 'p2tr' | 'p2ts' | null
  version: 0 | 1 | null
  params: string[]
  script: string | null
  cblock: string | null
  annex: string | null
}
```

- `type` - Detected spend type
- `version` - Witness version (0 = segwit, 1 = taproot)
- `params` - Parameters (signatures, pubkeys)
- `script` - Witness script (P2WSH) or tapscript (P2TS)
- `cblock` - Control block (script-path taproot)
- `annex` - Annex data if present

```typescript
const witnessData = WITNESS.parse(tx.vin[0].witness)
console.log(witnessData.type)  // 'p2wpkh'
console.log(witnessData.params[0])  // Signature
```

### `WITNESS.get_witness_type(witness)`

Get the type of a witness stack.

```typescript
get_witness_type(witness: Bytes[]): string | null
```

---

## META

Locktime, sequence, and reference utilities.

### `META.encode_locktime(data)`

Encode locktime data (BIP-65).

```typescript
encode_locktime(data: LocktimeData): number
```

**Parameters:**

```typescript
// Block height lock
{ type: 'heightlock', height: 850000 }

// Timestamp lock (Unix timestamp >= 500000000)
{ type: 'timelock', stamp: 1704067200 }
```

### `META.decode_locktime(locktime)`

Decode a locktime value.

```typescript
decode_locktime(locktime: number): LocktimeData | null
```

```typescript
META.decode_locktime(850000)
// { type: 'heightlock', height: 850000 }
```

### `META.encode_sequence(data)`

Encode sequence data (BIP-68).

```typescript
encode_sequence(data: SequenceConfig): number
```

**Parameters:**

```typescript
// Block height relative lock
{ mode: 'height', height: 144 }  // ~24 hours

// Timestamp relative lock (in seconds, granularity: 512s)
{ mode: 'stamp', stamp: 86400 }  // 24 hours
```

### `META.decode_sequence(sequence)`

Decode a sequence value.

```typescript
decode_sequence(sequence: number | string): SequenceData | null
```

```typescript
META.decode_sequence(144)
// { mode: 'height', height: 144 }
```

### `META.RefPointer`

Reference pointer utilities for outpoints, inscription IDs, and rune IDs.

```typescript
// Outpoint encoding
META.RefPointer.outpoint.encode(txid, vout)
META.RefPointer.outpoint.decode(outpoint)

// Inscription/Record ID
META.RefPointer.record_id.encode(txid, index)
META.RefPointer.record_id.decode(recordId)

// Rune ID
META.RefPointer.rune_id.encode(blockHeight, txIndex)
META.RefPointer.rune_id.decode(runeId)
```

### `META.InscriptionUtil`

Bitcoin inscription (Ordinals) encoding and decoding utilities.

```typescript
// Encode inscriptions to script
META.InscriptionUtil.encode(data: InscriptionData[]): Buff

// Decode inscriptions from script
META.InscriptionUtil.decode(script: Bytes): InscriptionData[]
```

**InscriptionData:**

```typescript
interface InscriptionData {
  mimetype?: string   // Content MIME type (e.g., 'text/plain')
  content?: string    // Content as hex string
  parent?: string     // Parent inscription ID
  delegate?: string   // Delegate inscription ID
  pointer?: number    // Output pointer
  opcode?: number     // Custom opcode
  rune?: string       // Rune name (A-Z only)
  ref?: string        // Reference data
}
```

**Example:**

```typescript
import { META } from '@vbyte/btc-dev'
import { Buff } from '@vbyte/buff'

// Create inscription
const script = META.InscriptionUtil.encode([{
  mimetype: 'text/plain',
  content: Buff.str('Hello, Bitcoin!').hex
}])

// Decode inscription from witness script
const inscriptions = META.InscriptionUtil.decode(witnessScript)
console.log(inscriptions[0].mimetype)  // 'text/plain'
```

---

## Error Classes

The library provides custom error classes for better error handling.

### `ValidationError`

Thrown when input validation fails (invalid format, wrong length, type mismatch).

```typescript
import { ValidationError } from '@vbyte/btc-dev'

class ValidationError extends Error {
  name: 'ValidationError'
  field?: string  // The field that failed validation
}
```

**Common scenarios:**
- Invalid secret key format in signing functions
- Wrong pubkey length
- Missing required fields

```typescript
try {
  SIGNER.sign_segwit_tx('invalid', tx, options)
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(`Invalid ${err.field}: ${err.message}`)
  }
}
```

### `DecodingError`

Thrown when decoding or parsing malformed data fails.

```typescript
import { DecodingError } from '@vbyte/btc-dev'

class DecodingError extends Error {
  name: 'DecodingError'
  position?: number  // Byte position where error occurred
}
```

**Common scenarios:**
- Truncated transaction data
- Invalid script opcodes
- Malformed witness data

```typescript
try {
  TX.decode(malformedHex)
} catch (err) {
  if (err instanceof DecodingError) {
    console.log(`Decode error at position ${err.position}: ${err.message}`)
  }
}
```

### `ConfigError`

Thrown when configuration is invalid.

```typescript
import { ConfigError } from '@vbyte/btc-dev'

class ConfigError extends Error {
  name: 'ConfigError'
}
```

**Common scenarios:**
- Invalid sighash flag
- Unknown network type
- Incompatible option combinations

```typescript
try {
  SIGNER.sign_taproot_tx(seckey, tx, { sigflag: 0xFF })
} catch (err) {
  if (err instanceof ConfigError) {
    console.log(`Config error: ${err.message}`)
  }
}
```

---

## CONST

Constants used throughout the library.

### Transaction Defaults

```typescript
CONST.DEFAULT.VERSION     // 2 - Default transaction version
CONST.DEFAULT.LOCKTIME    // 0 - Default locktime
CONST.DEFAULT.SEQUENCE    // 0xffffffff - Default sequence (no RBF, no timelock)
```

### Coinbase Constants

```typescript
CONST.COINBASE.TXID   // '00'.repeat(32) - Coinbase previous txid (all zeros)
CONST.COINBASE.VOUT   // 0xffffffff - Coinbase previous vout
```

### Script Types

```typescript
CONST.LOCK_SCRIPT_TYPE   // { P2PKH, P2SH, P2WPKH, P2WSH, P2TR, OPRETURN }
CONST.SPEND_SCRIPT_TYPE  // { P2PKH, P2SH, P2WPKH, P2WSH, P2TR, P2TS }
CONST.LOCK_SCRIPT_REGEX  // Regex patterns for each script type
```

### Sighash Flags

```typescript
CONST.SIGHASH_DEFAULT  // 0x01 - Default sighash (SIGHASH_ALL)
CONST.SIGHASH_SEGWIT   // [0x01, 0x02, 0x03, 0x81, 0x82, 0x83] - Valid segwit flags
CONST.SIGHASH_TAPROOT  // [0x00, ...SIGHASH_SEGWIT] - Valid taproot flags (includes DEFAULT)
```

### Taproot Constants

```typescript
CONST.TAPLEAF_DEFAULT_VERSION  // 0xc0 - Default tapleaf version
CONST.TAPLEAF_VERSIONS         // Array of all valid tapleaf versions
```

### Size Limits

```typescript
CONST.MAX_SCRIPT_SIZE  // 10,000 - Bitcoin consensus script size limit
CONST.MAX_VARINT_SIZE  // 520,000 - Maximum varint payload size
CONST.OP_1_OFFSET      // 0x50 - Offset to convert 1-16 to OP_1-OP_16
```

### Transaction Size Components

```typescript
CONST.TX_SIZE.GLOBAL_BASE  // 8 - Base size without witness
CONST.TX_SIZE.GLOBAL_WIT   // 10 - Base size with witness
CONST.TX_SIZE.TXIN_BASE    // 40 - Input base size (32+4+4)
CONST.TX_SIZE.TXOUT_BASE   // 8 - Output base size
```

---

## SCHEMA

Zod validation schemas for runtime type checking.

### Transaction Schemas

```typescript
SCHEMA.tx.txid       // 32-byte hex string
SCHEMA.tx.output     // { value: bigint, script_pk: string }
SCHEMA.tx.input      // Transaction input schema
SCHEMA.tx.template   // Transaction template for creation
```

### Taproot Schemas

```typescript
SCHEMA.taproot.taptree  // Single leaf or array of leaves
SCHEMA.taproot.config   // { pubkey, leaves?, target?, version? }
```

### Usage

```typescript
import { SCHEMA } from '@vbyte/btc-dev'

// Validate transaction template
const result = SCHEMA.tx.template.safeParse(userInput)
if (!result.success) {
  console.error(result.error.issues)
}

// Validate taproot config
SCHEMA.taproot.config.parse({
  pubkey: '02'.repeat(32),
  leaves: ['aa'.repeat(32)]
})
```

---

## Type Definitions

### Core Types

```typescript
type ChainNetwork = 'main' | 'test'
type LockScriptType = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'opreturn'
type WitnessVersion = 0 | 1

interface TxData {
  version: number
  locktime: number
  vin: TxInput[]
  vout: TxOutput[]
}

interface TxInput {
  txid: string
  vout: number
  sequence: number
  script_sig: string | null
  witness: string[]
  prevout: TxOutput | null
  coinbase: string | null
}

interface TxOutput {
  value: bigint
  script_pk: string
}

interface TxSize {
  base: number
  total: number
  vsize: number
  weight: number
}

interface AddressData {
  data: string      // The address string
  format: string    // Address format
  network: string   // Network name
  script: Buff      // scriptPubKey
  version?: number  // Witness version
}

interface SigHashOptions {
  txindex?: number
  txinput?: TxInput
  pubkey?: string
  script?: string
  sigflag?: number
  extension?: string
}

interface WitnessData {
  type: 'p2wpkh' | 'p2wsh' | 'p2tr' | 'p2ts' | null
  version: 0 | 1 | null
  params: string[]
  script: string | null
  cblock: string | null
  annex: string | null
}

interface LocktimeData {
  type: 'heightlock' | 'timelock'
  height?: number
  stamp?: number
}

interface SequenceData {
  mode: 'height' | 'stamp'
  height?: number
  stamp?: number
}

interface ControlBlock {
  int_key: string     // Internal public key (32 bytes hex)
  path: string[]      // Merkle path
  parity: number      // Y-coordinate parity (0x02 or 0x03)
  version: number     // Tapleaf version
}

interface TaprootConfig {
  pubkey: string      // Internal public key (32 bytes)
  leaves?: string[][] // Optional tapleaf hashes
  target?: string     // Target leaf for control block
  version?: number    // Leaf version (default: 0xc0)
}

interface TaprootContext {
  int_key: string     // Internal public key
  path: string[]      // Merkle proof path
  parity: number      // Output key parity
  taproot: string | null  // Merkle root
  cblock: string      // Control block hex
  tapkey: string      // Tweaked output key
  taptweak: string    // Tweak value
}

interface InscriptionData {
  mimetype?: string   // Content MIME type
  content?: string    // Content as hex string
  parent?: string     // Parent inscription ID
  delegate?: string   // Delegate inscription ID
  pointer?: number    // Output pointer
  opcode?: number     // Custom opcode
  rune?: string       // Rune name (A-Z only)
  ref?: string        // Reference data
}
```
