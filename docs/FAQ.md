# Frequently Asked Questions

Common questions and troubleshooting for `@vbyte/btc-dev`.

## Installation

### Why can't I import the library?

**ESM Only**: This library is ESM-only. Make sure your project is configured for ESM:

```json
// package.json
{
  "type": "module"
}
```

Or use the `.mjs` extension for your files.

### Can I use this with CommonJS?

The library provides a CommonJS build at `dist/main.cjs`, but ESM is recommended. For CommonJS:

```javascript
const { ADDRESS, TX } = require('@vbyte/btc-dev')
```

### Can I use this in a browser?

Yes. Use the UMD bundle:

```html
<script src="https://unpkg.com/@vbyte/btc-dev/dist/script.js"></script>
<script>
  const { ADDRESS, TX } = btcDev
</script>
```

Or use a bundler like Vite, Webpack, or Rollup with the ESM imports.

## TypeScript

### What TypeScript version is required?

TypeScript 5.0 or later is recommended. The library uses strict mode.

### How do I import types?

```typescript
import type { TxData, AddressInfo, SigHashOptions } from '@vbyte/btc-dev'
```

### Why am I getting type errors?

Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2020"
  }
}
```

## Addresses

### Which address type should I use?

- **P2WPKH** (`bc1q...`): Best for single-signature wallets. Good balance of efficiency and compatibility.
- **P2TR** (`bc1p...`): Best for privacy and future-proofing. Some older wallets don't support it yet.
- **P2WSH**: For multisig or complex scripts.
- **P2PKH/P2SH**: Only for legacy compatibility.

### Why does my address look different on testnet?

Testnet uses different prefixes:

| Type | Mainnet | Testnet |
|------|---------|---------|
| P2WPKH | `bc1q...` | `tb1q...` |
| P2TR | `bc1p...` | `tb1p...` |

Always specify the correct network: `'main'` or `'test'`.

### How do I convert a compressed pubkey to x-only for taproot?

Remove the first byte (02 or 03):

```typescript
const compressed = '02e96fe52ef0e22d2f131dd425ce1893073a3c6ad20e8cac36726393dfb4856a4c'
const xOnly = compressed.slice(2)  // Remove 02/03 prefix
```

## Transactions

### Why does my signature verification fail?

Common causes:

1. **Wrong prevout data**: The prevout value and script must match exactly
2. **Wrong pubkey**: For P2WPKH, use the compressed public key
3. **Wrong sighash flag**: Make sure signing and verification use the same flag
4. **Missing witness**: Add the witness data after signing

```typescript
// Check prevout is correct
console.log('Prevout value:', tx.vin[0].prevout.value)
console.log('Prevout script:', tx.vin[0].prevout.script_pk)

// Verify witness is added
console.log('Witness:', tx.vin[0].witness)
```

### How do I calculate the transaction fee?

```typescript
const inputTotal = tx.vin.reduce((sum, vin) => sum + vin.prevout.value, 0n)
const outputTotal = tx.vout.reduce((sum, vout) => sum + vout.value, 0n)
const fee = inputTotal - outputTotal
```

### What's the difference between size, vsize, and weight?

- **Size**: Raw byte count
- **Weight**: Size calculation that discounts witness data (base * 4 + witness)
- **vSize**: Virtual size = weight / 4, used for fee calculation

Always use `vsize` for fee estimation.

### Why is my transaction rejected as "dust"?

Outputs below the dust limit (~546 sats for P2PKH, ~294 for P2WPKH) are rejected. Increase the output value.

### How do I enable RBF (Replace-By-Fee)?

Set sequence to less than 0xfffffffe on at least one input:

```typescript
{
  txid: '...',
  vout: 0,
  sequence: 0xfffffffd  // RBF enabled
}
```

## Signing

### What format should the secret key be?

A 64-character hex string (32 bytes):

```typescript
const secretKey = 'abcd1234...'.repeat(8)  // 64 hex chars
```

### Why do I get "Invalid secret key format"?

The secret key must be:
- A string (not Buffer or Uint8Array)
- Exactly 64 hex characters
- Valid hex (0-9, a-f, A-F)

### What's the difference between segwit and taproot signing?

- **Segwit** (`sign_segwit_tx`): Uses ECDSA signatures, requires compressed pubkey
- **Taproot** (`sign_taproot_tx`): Uses Schnorr signatures, uses x-only pubkeys

### How do I sign multiple inputs?

Sign each input separately:

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

## Taproot

### When should I use key-path vs script-path?

- **Key-path**: Single signer, no complex conditions (cheapest, most private)
- **Script-path**: Multisig, timelocks, or alternative spending conditions

### Do I need to tweak the secret key?

For key-path spending, yes:

```typescript
const taptweak = TAPROOT.encode_taptweak(internalPubkey, merkleRoot)
const tweakedSeckey = TAPROOT.tweak_seckey(internalSeckey, taptweak)
```

For script-path, use the original key for the script, not the tweaked key.

### What's a control block?

A control block proves that a script is part of the taproot tree. It contains:
- Leaf version and parity byte
- Internal public key
- Merkle path (sibling hashes)

## Scripts

### How do I detect the script type of an output?

```typescript
import { SCRIPT } from '@vbyte/btc-dev'

const type = SCRIPT.get_lock_script_type(scriptPubKey)
// Returns: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'opreturn' | null
```

### How do I create a multisig script?

```typescript
// 2-of-3 multisig
import { SCRIPT } from '@vbyte/btc-dev'

const script = SCRIPT.encode([
  'OP_2',
  pubkey1,
  pubkey2,
  pubkey3,
  'OP_3',
  'OP_CHECKMULTISIG'
])
```

## Error Handling

### What error types does the library throw?

The library provides three custom error classes for better error handling:

```typescript
import { ValidationError, DecodingError, ConfigError } from '@vbyte/btc-dev'

try {
  const tx = TX.decode(malformedData)
} catch (err) {
  if (err instanceof DecodingError) {
    console.log('Malformed data at position:', err.position)
  } else if (err instanceof ValidationError) {
    console.log('Invalid input field:', err.field)
  } else if (err instanceof ConfigError) {
    console.log('Configuration error:', err.message)
  }
}
```

| Error Class | When Thrown | Properties |
|-------------|-------------|------------|
| `ValidationError` | Invalid input format, wrong length, type mismatch | `field?: string` |
| `DecodingError` | Malformed data, truncated input, invalid structure | `position?: number` |
| `ConfigError` | Invalid sigflag, unknown network, bad configuration | - |

### How do I catch specific errors?

Use `instanceof` to check the error type:

```typescript
try {
  SIGNER.sign_segwit_tx('invalid', tx, options)
} catch (err) {
  if (err instanceof ValidationError) {
    // Handle invalid secret key format
    console.log(`Validation failed for: ${err.field}`)
  }
}
```

### Which functions throw which errors?

**ValidationError:**
- `sign_segwit_tx`, `sign_taproot_tx` - Invalid secret key format
- Most functions with input validation

**DecodingError:**
- `decode_tx` - Malformed transaction data
- `decode_script` - Invalid script (truncated pushdata, invalid opcodes)

**ConfigError:**
- `sign_segwit_tx`, `sign_taproot_tx` - Invalid sigflag
- Address functions - Unknown network

### How do I handle errors gracefully?

```typescript
function safeDecode(hexData: string) {
  try {
    return { success: true, data: TX.decode(hexData) }
  } catch (err) {
    if (err instanceof DecodingError) {
      return { success: false, error: `Decode error at ${err.position}: ${err.message}` }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

## Security

### Is this library audited?

The cryptographic operations use audited libraries (`@noble/curves`, `@noble/hashes`). The Bitcoin-specific code has comprehensive tests but hasn't undergone a formal audit.

### How do I securely handle private keys?

See [SECURITY.md](SECURITY.md) for detailed guidelines. Key points:
- Never log or expose secret keys
- Clear from memory when possible
- Use cryptographically secure random number generation

### What transaction size limits are enforced?

- Maximum transaction size: 4MB
- Maximum inputs/outputs: 100,000
- Maximum taproot tree depth: 128

## Debugging

### How do I inspect a raw transaction?

```typescript
import { TX, SCRIPT } from '@vbyte/btc-dev'

const tx = TX.parse(rawTxHex)

console.log('Version:', tx.version)
console.log('Locktime:', tx.locktime)

tx.vin.forEach((vin, i) => {
  console.log(`Input ${i}:`, vin.txid, vin.vout)
})

tx.vout.forEach((vout, i) => {
  const type = SCRIPT.get_lock_script_type(vout.script_pk)
  console.log(`Output ${i}:`, vout.value.toString(), 'sats', type)
})
```

### How do I decode a witness?

```typescript
import { WITNESS } from '@vbyte/btc-dev'

const data = WITNESS.parse(tx.vin[0].witness)
console.log('Type:', data.type)
console.log('Version:', data.version)
console.log('Params:', data.params)
```

## Getting Help

- Check [GitHub Issues](https://github.com/cmdruid/btc-dev/issues)
- Read the [API Reference](API.md)
- See the [Guide](GUIDE.md) for tutorials and examples
