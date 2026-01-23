# @vbyte/btc-dev

[![npm version](https://img.shields.io/npm/v/@vbyte/btc-dev.svg)](https://www.npmjs.com/package/@vbyte/btc-dev)
[![License: CC-BY-1.0](https://img.shields.io/badge/License-CC--BY--1.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A batteries-included TypeScript toolset for Bitcoin development. Create, sign, and verify Bitcoin transactions with full support for segwit and taproot.

## Installation

```bash
npm install @vbyte/btc-dev
```

## Quick Example

```typescript
import { ADDRESS, TX, SIGNER } from '@vbyte/btc-dev'

// Create a P2WPKH address
const address = ADDRESS.p2wpkh(pubkey, 'main')
console.log(address.data)  // bc1q...

// Parse a transaction
const tx = TX.parse(rawTxHex)

// Sign and verify
const signature = SIGNER.sign_segwit_tx(secretKey, tx, {
  txindex: 0,
  pubkey,
  sigflag: 0x01
})
const result = SIGNER.verify_tx(tx)
```

## Modules

| Module | Description |
|--------|-------------|
| `ADDRESS` | Create and parse addresses (P2PKH, P2SH, P2WPKH, P2WSH, P2TR) |
| `TX` | Transaction creation, encoding, decoding, parsing |
| `SCRIPT` | Script encoding, decoding, type detection |
| `SIGHASH` | Signature hash calculation (BIP-143, BIP-341) |
| `SIGNER` | Sign and verify transactions (ECDSA, Schnorr) |
| `TAPROOT` | Taproot trees, control blocks, tweaking |
| `WITNESS` | Witness data parsing and analysis |
| `META` | Locktime, sequence, reference IDs |

## Documentation

- **[Guide](docs/GUIDE.md)** - Complete tutorial covering addresses, transactions, signing, and taproot
- **[API Reference](docs/API.md)** - Full function reference for all modules
- **[Security](docs/SECURITY.md)** - Best practices for production use
- **[FAQ](docs/FAQ.md)** - Common questions and troubleshooting
- **[Conventions](docs/CONVENTIONS.md)** - Coding conventions for contributors

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Dependencies

- [@noble/curves](https://github.com/paulmillr/noble-curves) - Elliptic curve cryptography
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) - Cryptographic hash functions
- [@scure/btc-signer](https://github.com/paulmillr/scure-btc-signer) - Bitcoin signing utilities
- [@vbyte/buff](https://www.npmjs.com/package/@vbyte/buff) - Buffer manipulation
- [zod](https://zod.dev) - Runtime validation

## License

[CC-BY-1.0](LICENSE)
