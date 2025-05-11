import { TxInput } from './txdata.js'

export type SigHashType = 'segwit' | 'taproot'

export interface SigHashOptions {
  extension     ?: string      // Extend hash with additional commitment (for taproot).
  extflag       ?: number      // Set the extention version flag (future use).
  txindex       ?: number      // Index value of the input you wish to sign for.
  key_version   ?: number      // Set the key version flag (future use).
  pubkey        ?: string      // Verify using this pubkey instead of the tapkey.
  script        ?: string      // Use this script for signing and validation.
  separator_pos ?: number      // If using OP_CODESEPARATOR, specify the latest opcode position.
  sigflag       ?: number      // Set the signature type flag.
  throws        ?: boolean     // Should throw an exception on failure.
  txinput       ?: TxInput     // Use this txinput for signing and validation.
}
