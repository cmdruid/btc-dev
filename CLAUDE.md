# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Agent Documentation
Comprehensive documentation for AI-assisted development is available in `.context/`:
- **[QUICKSTART.md](.context/QUICKSTART.md)** - Get productive in <2 minutes
- **[STRUCTURE.md](.context/STRUCTURE.md)** - Understand project organization
- **[CONVENTIONS.md](.context/CONVENTIONS.md)** - Code style and patterns
- **[WORKFLOWS.md](.context/WORKFLOWS.md)** - Common development tasks
- **[GOTCHAS.md](.context/GOTCHAS.md)** - Known issues and solutions

Always start with QUICKSTART.md when beginning work on this codebase.

## Current Status (v1.1.8)
✅ **Tests**: 220/220 passing
✅ **Build**: Working (TypeScript + Rollup)
⚠️ **Coverage**: ~30% (major gaps in critical modules)
🔴 **Production Ready**: NO - Critical modules untested

## Project Overview

This is a Bitcoin development library (`@vbyte/btc-dev` v1.1.8) - an experimental revision of the tapscript library. It provides comprehensive tools for Bitcoin transaction creation, script handling, address generation, and taproot support.

**Key Features:**
- ESM-only TypeScript library (Node 18+)
- 8 core modules: ADDRESS, TX, SCRIPT, SIGHASH, SIGNER, TAPROOT, WITNESS, META
- Tree-shakeable exports with namespace organization
- Comprehensive Bitcoin address support (P2PKH, P2SH, P2WPKH, P2WSH, P2TR)
- Taproot and Segwit transaction support
- Zod schema validation

## Build and Development Commands

```bash
# Install dependencies
npm install

# Build the project (TypeScript + Rollup + path conversion)
npm run build

# Run tests (220 tests using tape + faucet formatter)
npm test
npm run script test/src/tape.ts  # Direct test runner

# Full package build (test + build)
npm run package

# Run a specific test file
npm run script test/path/to/test.ts

# Development scratch file
npm run scratch  # Runs test/scratch.ts

# Release process (with version update)
npm run release
```

## Critical Testing Gaps

🔴 **BEFORE PRODUCTION USE** - These modules need comprehensive tests:

1. **SCRIPT module** (0% coverage) - Core Bitcoin script operations
   - Files: `encode.ts`, `decode.ts`, `lock.ts`, `words.ts`, `util.ts`
   - Risk: Invalid transactions, security vulnerabilities

2. **SIGNER module** (0% coverage) - Cryptographic operations
   - Files: `sign.ts`, `verify.ts`
   - Risk: Invalid signatures, private key exposure

3. **TX creation** (minimal coverage) - Transaction building
   - Files: `create.ts`, `encode.ts`, `validate.ts`, `size.ts`
   - Risk: Malformed transactions, fee calculation errors

4. **WITNESS module** (0% coverage) - Segwit/Taproot data
   - Files: `parse.ts`, `util.ts`
   - Risk: Invalid witness data

5. **META module** (0% coverage) - Transaction metadata
   - Files: `locktime.ts`, `sequence.ts`, `ref.ts`, `scribe.ts`

## Architecture

### Module Structure (Test Coverage Status)
The library is organized into distinct modules, each exported as a namespace:

- **ADDRESS** ✅: Bitcoin address types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR) - Well tested
- **TX** ⚠️: Transaction creation, encoding, decoding, parsing, validation - Partially tested
- **SCRIPT** 🔴: Script encoding, decoding, locking, and word operations - NO TESTS
- **SIGHASH** ✅: Signature hash calculation for segwit and taproot - Well tested
- **SIGNER** 🔴: Signing and verification operations - NO TESTS
- **TAPROOT** ⚠️: Taproot tree construction and encoding - Partially tested
- **WITNESS** 🔴: Witness data parsing and utilities - NO TESTS
- **META** 🔴: Transaction metadata (locktime, sequence, references) - NO TESTS

### Dependencies
- **@noble/curves** 1.9.7 - Elliptic curve cryptography
- **@noble/hashes** 1.8.0 - Cryptographic hash functions
- **@scure/btc-signer** 1.8.1 - Bitcoin signing utilities
- **@vbyte/buff** ^1.0.2 - Buffer utilities
- **zod** ^4.1.5 - Runtime type validation

### Path Aliases
The project uses `@/` as an alias for `src/` in TypeScript. The build process converts these to relative paths.

### Build Process
1. Clean dist directory
2. TypeScript compilation with strict settings
3. Rollup bundling for browser/CDN distribution
4. Path alias resolution (converts `@/` to relative paths)

### Testing
- **Framework**: tape with TAP format
- **Formatter**: faucet (for readable output)
- **Runner**: tsx with custom tsconfig
- **Structure**: `test/src/case/[module]/[feature].test.ts`
- **Main entry**: `test/src/tape.ts`
- **Current status**: 220 tests passing, ~30% coverage estimate
- **Coverage gaps**: See Critical Testing Gaps section above

### TypeScript Configuration
- Strict mode enabled with all strict checks
- Target: ESNext
- Module: NodeNext
- No unused locals/parameters allowed
- Source maps and declarations generated

## Key Development Notes

- **ESM-only package** (`"type": "module"` in package.json) - requires Node 18+
- **Tree-shaking exports** - multiple export paths (e.g., `@vbyte/btc-dev/address`)
- **Build artifacts** - go to `dist/` with TypeScript declarations
- **Path aliases** - `@/` converts to relative paths during build
- **OS compatibility** - build script handles macOS/Linux sed differences
- **TAP format** - tests use TAP format output through faucet formatter
- **Strict TypeScript** - all strict checks enabled, no unused parameters allowed
- **Import requirements** - MUST use `.js` extension for local imports (ESM requirement)

## Development Workflow

1. **Start here**: Read `.context/QUICKSTART.md`
2. **Before changes**: Run `npm test` (should show 220 passing)
3. **Follow patterns**: Use address module as example (well-tested)
4. **Add tests**: REQUIRED for all new code (coverage currently low)
5. **Build**: `npm run package` (test + build)
6. **Common issues**: Check `.context/GOTCHAS.md`

## Security Warnings

⚠️ **NOT PRODUCTION READY** due to insufficient test coverage in critical modules:
- Script operations (could create invalid transactions)
- Signature operations (could expose private keys)
- Transaction creation (could result in loss of funds)

**Recommendation**: Achieve 80%+ test coverage before production use, especially for SCRIPT and SIGNER modules.