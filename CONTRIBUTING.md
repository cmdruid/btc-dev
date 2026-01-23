# Contributing to @vbyte/btc-dev

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Reporting Bugs

Before reporting a bug:
1. Search existing [GitHub Issues](https://github.com/cmdruid/btc-dev/issues) to check if it's already reported
2. Update to the latest version and verify the bug still exists
3. Prepare a minimal reproduction case

When reporting:
- Use the bug report template
- Include the library version (`npm list @vbyte/btc-dev`)
- Describe what you expected vs. what happened
- Include a code snippet that reproduces the issue

## Requesting Features

- Check existing issues for similar requests
- Use the feature request template
- Explain the use case and why it benefits the library

## Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Clone and Install

```bash
git clone https://github.com/cmdruid/btc-dev.git
cd btc-dev
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm run script test/path/to/file.ts

# Run the scratch file for experiments
npm run scratch
```

### Building

```bash
# Build the package
npm run build

# Build and test
npm run package

# Type check without building
npm run check
```

### Linting

```bash
npm run lint
```

## Code Style

Follow the coding conventions documented in [docs/CONVENTIONS.md](docs/CONVENTIONS.md).

### Key Points

**ESM-only with .js extensions**

Always use `.js` extensions for local imports, even when importing TypeScript files:

```typescript
// Correct
import { parse_tx } from './parse.js'
import { SCRIPT } from '@/lib/script/index.js'

// Wrong
import { parse_tx } from './parse'
import { SCRIPT } from '@/lib/script/index'
```

**Path aliases**

Use `@/` for imports from `src/`:

```typescript
// Correct
import { LOCK_SCRIPT_TYPE } from '@/const.js'
import type { TxData } from '@/types/index.js'

// Wrong
import { LOCK_SCRIPT_TYPE } from '../../../const.js'
```

**Naming conventions**

- Functions: `snake_case` (e.g., `parse_tx`, `get_address`)
- Namespaces: `UPPERCASE` (e.g., `TX`, `SCRIPT`, `ADDRESS`)
- Types: `PascalCase` (e.g., `TxData`, `AddressInfo`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `LOCK_SCRIPT_TYPE`)

**TypeScript**

- Strict mode is enabled
- No unused parameters allowed
- Prefer explicit types over inference for public APIs
- Use `import type` for type-only imports

**Tests**

- Use `t.plan(n)` to declare expected assertions
- Add new tests to `test/src/tape.ts` or appropriate subdirectory
- Follow existing test patterns in `test/src/`

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Ensure quality**
   ```bash
   npm run check    # Type check
   npm run lint     # Lint check
   npm test         # Run tests
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issues if applicable (`Fixes #123`)

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

6. **PR checklist**
   - [ ] Tests pass (`npm test`)
   - [ ] Types check (`npm run check`)
   - [ ] Lint passes (`npm run lint`)
   - [ ] Documentation updated (if applicable)
   - [ ] Changelog entry added (for significant changes)

## Architecture Overview

The library is organized into 8 namespace-exported modules:

| Module | Purpose |
|--------|---------|
| `ADDRESS` | Bitcoin address creation and parsing |
| `TX` | Transaction create/encode/decode/parse |
| `SCRIPT` | Script encoding, decoding, type detection |
| `SIGHASH` | Signature hash calculation |
| `SIGNER` | Transaction signing and verification |
| `TAPROOT` | Taproot trees and control blocks |
| `WITNESS` | Witness data parsing |
| `META` | Locktime, sequence, reference IDs |

### Module Dependencies

```
TX ─────────────────────────┬──> SCRIPT
                            ├──> ADDRESS
                            ├──> SIGHASH
                            └──> WITNESS

SIGNER ────────────────────────> SIGHASH

ADDRESS ───────────────────────> SCRIPT

TAPROOT ───────────────────────> SCRIPT
```

### Adding New Functions

1. Add the implementation to the appropriate module file
2. Export from the module's `index.ts`
3. Add JSDoc documentation with `@param`, `@returns`, `@throws`, `@example`
4. Add tests
5. Update documentation if it's a public API

## Questions?

- Open a [GitHub Discussion](https://github.com/cmdruid/btc-dev/discussions)
- Check the [FAQ](docs/FAQ.md)
- Review existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the CC-BY-1.0 license.
