/**
 * Script utility functions.
 *
 * Helper functions for script manipulation including size prefixing
 * and public key extraction.
 *
 * @module
 */

import { Buff } from "@vbyte/buff";

/**
 * Prefix a script with its size as a varint.
 *
 * Adds a Bitcoin-style varint length prefix to a script.
 * Used when embedding scripts in transactions.
 *
 * @param script - Script bytes (hex string or Uint8Array)
 * @returns Hex string of the script prefixed with its length
 *
 * @example
 * ```typescript
 * const prefixed = prefix_script_size('76a914...88ac')
 * // Returns: '19' + '76a914...88ac' (0x19 = 25 bytes)
 * ```
 */
export function prefix_script_size(script: string | Uint8Array): string {
	return Buff.bytes(script).prefix_varint("le").hex;
}

/**
 * Extract x-only public keys from a script.
 *
 * Searches for 32-byte public keys followed by signature checking
 * opcodes (OP_CHECKSIG, OP_CHECKSIGVERIFY, or OP_CHECKSIGADD).
 * Useful for analyzing tapscripts to find all signing keys.
 *
 * @param script - Script bytes (hex string or Uint8Array)
 * @returns Array of 32-byte x-only public keys (hex strings)
 *
 * @example
 * ```typescript
 * // Script: <pubkey1> OP_CHECKSIG <pubkey2> OP_CHECKSIGADD
 * const pubkeys = parse_script_pubkeys(script)
 * // Returns: ['abc123...', 'def456...']
 * ```
 */
export function parse_script_pubkeys(script: string | Uint8Array): string[] {
	// Convert the script to a string if it's a Uint8Array
	const scriptHex =
		typeof script === "string" ? script : Buff.bytes(script).hex;

	// Define the regex pattern to match the specified pattern
	// 20 = pushdata byte for 32 bytes (0x20)
	// [0-9a-f]{64} = 32-byte hex string (64 hex characters)
	// (ac|ad|ba) = OP_CHECKSIG (0xac), OP_CHECKSIGVERIFY (0xad), or OP_CHECKSIGADD (0xba)
	const pubkeyPattern = /20([0-9a-f]{64})(ac|ad|ba)/gi;

	// Find all matches in the script
	const matches = [...scriptHex.matchAll(pubkeyPattern)];

	// Extract the public keys from the matches
	return matches.map((match) => match[1]);
}