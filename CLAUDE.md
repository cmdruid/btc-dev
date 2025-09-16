# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Agent Documentation
Comprehensive documentation for AI-assisted development is available in `docs/agent/`:
- **[QUICKSTART.md](docs/agent/QUICKSTART.md)** - Get productive in <2 minutes
- **[STRUCTURE.md](docs/agent/STRUCTURE.md)** - Understand project organization
- **[CONVENTIONS.md](docs/agent/CONVENTIONS.md)** - Code style and patterns
- **[WORKFLOWS.md](docs/agent/WORKFLOWS.md)** - Common development tasks
- **[GOTCHAS.md](docs/agent/GOTCHAS.md)** - Known issues and solutions

Always start with QUICKSTART.md when beginning work on this codebase.

## Project Overview

This is a Bitcoin development library (`@vbyte/btc-dev`) - an experimental revision of the tapscript library. It provides comprehensive tools for Bitcoin transaction creation, script handling, address generation, and taproot support.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Build the project (TypeScript + Rollup)
npm run build

# Run tests (uses tape test framework with faucet for output)
npm test
npm run script test/src/tape.ts  # Direct test runner

# Full package build (test + build)
npm run package

# Run a specific test file
npm run script test/path/to/test.ts

# Development scratch file
npm run scratch  # Runs test/scratch.ts

# Release process
npm run release
```

## Architecture

### Module Structure
The library is organized into distinct modules, each exported as a namespace:
- **ADDRESS**: Bitcoin address types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR)
- **TX**: Transaction creation, encoding, decoding, parsing, validation
- **SCRIPT**: Script encoding, decoding, locking, and word operations
- **SIGHASH**: Signature hash calculation for segwit and taproot
- **SIGNER**: Signing and verification operations
- **TAPROOT**: Taproot tree construction and encoding
- **WITNESS**: Witness data parsing and utilities
- **META**: Transaction metadata (locktime, sequence, references)

### Path Aliases
The project uses `@/` as an alias for `src/` in TypeScript. The build process converts these to relative paths.

### Build Process
1. Clean dist directory
2. TypeScript compilation with strict settings
3. Rollup bundling for browser/CDN distribution
4. Path alias resolution (converts `@/` to relative paths)

### Testing
- Test framework: tape
- Test runner: tsx with custom tsconfig
- Test structure: `test/src/case/[module]/[feature].test.ts`
- Main test entry: `test/src/tape.ts`

### TypeScript Configuration
- Strict mode enabled with all strict checks
- Target: ESNext
- Module: NodeNext
- No unused locals/parameters allowed
- Source maps and declarations generated

## Key Development Notes

- This is an ESM-only package (`"type": "module"` in package.json)
- The library provides multiple export paths for tree-shaking (e.g., `@vbyte/btc-dev/address`)
- Build artifacts go to `dist/` with TypeScript declarations
- The build script handles OS-specific sed commands for macOS/Linux compatibility
- Tests use TAP format output through the faucet formatter