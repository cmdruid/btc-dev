# CHANGELOG

## [2.0.0] - 2026-01-21

### Security Fixes

- **Fixed witness parsing bug**: Added missing `break` statements in switch block in `src/lib/witness/parse.ts` that could cause incorrect script extraction for p2ts and p2wsh witness types.
- **Implemented `verify_tx()` function**: Full signature verification for segwit (ECDSA) and taproot (Schnorr) transactions, supporting all sighash types.
- **Added input validation to sign functions**: Secret key format validation in `sign_segwit_tx()` and `sign_taproot_tx()` to prevent invalid key errors.
- **Added transaction size limits**: Maximum transaction size (4MB), varint size (10MB), and element count (100k) limits in decoder to prevent memory exhaustion attacks.
- **Added taproot tree depth limits**: Maximum depth of 128 levels in merkle tree construction to prevent stack overflow from deeply nested trees.
- **Sanitized error messages**: Removed sensitive data from error messages in address and transaction modules.

### New Features

- **Full signature verification**: `verify_tx()` now returns detailed verification results including per-input status and error messages.
- **Enhanced witness parsing**: Improved annex detection and control block parsing for taproot witnesses.

### Testing

- Added 355+ new tests (total: 575 tests passing)
- **SIGNER module tests**: Essential signing function tests and transaction scenarios
- **WITNESS module tests**: Full witness parsing coverage (p2wpkh, p2wsh, p2tr, p2ts, annex)
- **SCRIPT module tests**: Lock script detection for all standard types (p2pkh, p2sh, p2wpkh, p2wsh, p2tr, opreturn)
- **META module tests**: BIP-65 locktime, BIP-68 sequence, and reference pointer encoding/decoding
- **TX module tests**: Size calculation, essential operations
- **Integration tests**: End-to-end workflows for address creation, transaction building, and signing

### Documentation

- **README.md**: Expanded with installation instructions, quick start guide, module overview, and API examples
- **SECURITY.md**: New security guidelines document covering private key handling, input validation, and best practices
- **EXAMPLES.md**: New examples document with practical code for common Bitcoin development tasks
- **JSDoc**: Added comprehensive documentation to exported functions with @param, @returns, @throws, and @example
- **Type definitions**: Documented all interfaces in `src/types/`
- **Schemas**: Added inline documentation for validation schemas

### Breaking Changes

- `verify_tx()` now returns a `VerifyResult` object instead of a boolean. Access the `.valid` property for boolean result.

## [1.1.8]

- Removed excess logging.

## [1.1.7]

- Removed schema dependency.
- Fixed an issue with the transaction encoder.

## [1.1.6]

- Changed `create_address` to `get_address`, fixed issues with interface.

## [1.1.5]

- Updated exports for Script module.

## [1.1.4]

- Updates to API for Address module.
- Updates to API for Script module.
- Updates to API for TX module.

## [1.1.3]

- Updated transaction utils to have a better input interface.

## [1.1.2]

- Methods `get_tx_output_type` and `get_tx_output_version` have been updated and replaced with `get_script_pk_type` and `get_script_pk_version`.

## [1.1.1]

- Updated `encode_script`

## [1.1.0]

- Public release.
