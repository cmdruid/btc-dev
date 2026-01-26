# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Detailed documentation**: See `docs/` directory ([GUIDE.md](docs/GUIDE.md) for tutorials, [API.md](docs/API.md) for reference)

## Commands

```bash
npm test                              # Run all tests (tape + faucet)
npm run script test/path/to/file.ts   # Run specific test file
npm run build                         # Build (TypeScript + Rollup)
npm run package                       # Test + build
npm run scratch                       # Run test/scratch.ts for experiments
```

## Critical Rules

- **ESM-only**: Always use `.js` extension for local imports (even for .ts files)
- **Path alias**: Use `@/` for src/ imports (converted to relative paths during build)
- **Naming**: camelCase with underscores for functions (`get_address`), UPPERCASE for namespaces (`TX`, `SCRIPT`)
- **Tests**: Use `t.plan(n)` to declare expected assertions, add tests to `test/src/tape.ts`
- **TypeScript**: Strict mode enabled, no unused parameters allowed

## Architecture

Bitcoin development library with 8 namespace-exported modules:

```
src/lib/
├── address/   # P2PKH, P2SH, P2WPKH, P2WSH, P2TR (well-tested, use as pattern)
├── tx/        # Transaction create/encode/decode/parse/validate
├── script/    # Script encoding, decoding, opcodes, locking scripts
├── sighash/   # Signature hash calculation (segwit + taproot)
├── signer/    # Signing and verification
├── taproot/   # Taproot tree construction and control blocks
├── witness/   # Witness data parsing
└── meta/      # Locktime, sequence, references, scribe
```

**Import patterns**:
```typescript
import { TX, SCRIPT, ADDRESS } from '@vbyte/btc-dev'        // Main import
import { P2PKH } from '@vbyte/btc-dev/address'              # Tree-shaking
import { encode_script } from '@/lib/script/encode.js'      // Internal (note .js)
```

**Module dependencies**: TX depends on SCRIPT, ADDRESS, SIGHASH, WITNESS. SIGNER depends on SIGHASH. TAPROOT depends on SCRIPT. ADDRESS depends on SCRIPT.

## Documentation

| Document | Purpose |
|----------|---------|
| [GUIDE.md](docs/GUIDE.md) | Complete tutorial: addresses, transactions, signing, taproot |
| [API.md](docs/API.md) | Complete API reference for all 8 modules |
| [SECURITY.md](docs/SECURITY.md) | Security best practices |
| [CONVENTIONS.md](docs/CONVENTIONS.md) | Coding conventions |
| [FAQ.md](docs/FAQ.md) | Common questions and troubleshooting |

## Test Coverage Status

| Module | Status | Notes |
|--------|--------|-------|
| ADDRESS | ✅ Good | 5 test files, use as pattern |
| SIGHASH | ✅ Good | 5 test files, well tested |
| SCRIPT | ✅ Good | 6 test files (basic, opcodes, size, lock, decode-encode, malformed) |
| TX | ✅ Good | 7 test files (essential, create, encode, error, size) |
| SIGNER | ✅ Good | 3 test files (schnorr, scenarios, sighash-coverage) |
| META | ✅ Good | 3 test files (locktime, sequence, ref) |
| TAPROOT | ✅ Good | 5 test files (tree, unit, parse, depth, cblock) |
| WITNESS | ⚠️ Partial | 2 test files (parse, edge-cases) |

## Key Dependencies

- `@noble/curves`, `@noble/hashes` - Cryptography
- `@scure/btc-signer` - Bitcoin signing utilities
- `@vbyte/buff` - Buffer utilities (use `Buff` class for binary data)
- `zod` - Runtime validation schemas (in `src/schema/`)
