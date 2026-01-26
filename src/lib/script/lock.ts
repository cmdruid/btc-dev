/**
 * Locking script type detection utilities.
 *
 * Functions for identifying Bitcoin locking script types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR).
 * These are used to determine how to sign and verify transactions.
 *
 * @module
 */

import { Buff, type Bytes } from "@vbyte/buff";
import { LOCK_SCRIPT_REGEX } from "@/const.js";

import type {
	LockScriptInfo,
	LockScriptType,
	WitnessVersion,
} from "@/types/index.js";

/**
 * Check if a script is an OP_RETURN script.
 *
 * OP_RETURN scripts start with opcode 0x6a and are used for data embedding.
 * These outputs are provably unspendable.
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is an OP_RETURN script
 *
 * @example
 * ```typescript
 * is_return_script('6a0b68656c6c6f20776f726c64') // true (OP_RETURN + "hello world")
 * is_return_script('76a914...88ac') // false (P2PKH)
 * ```
 */
export function is_return_script(script: Bytes): boolean {
	const bytes = Buff.bytes(script);
	return bytes.at(0) === 0x6a;
}

/**
 * Get complete information about a locking script.
 *
 * Returns both the script type and witness version (if applicable).
 *
 * @param script - The locking script (hex string or bytes)
 * @returns Object with type and version properties
 *
 * @example
 * ```typescript
 * get_lock_script_info('0014' + pubkeyHash)
 * // { type: 'p2wpkh', version: 0 }
 *
 * get_lock_script_info('5120' + tapkey)
 * // { type: 'p2tr', version: 1 }
 * ```
 */
export function get_lock_script_info(script: Bytes): LockScriptInfo {
	return {
		type: get_lock_script_type(script),
		version: get_lock_script_version(script),
	};
}

/**
 * Identify the type of a locking script.
 *
 * Checks the script against known patterns for P2PKH, P2SH, P2WPKH, P2WSH,
 * P2TR, and OP_RETURN scripts.
 *
 * @param script - The locking script (hex string or bytes)
 * @returns The script type ('p2pkh', 'p2sh', 'p2wpkh', 'p2wsh', 'p2tr', 'opreturn') or null if unknown
 *
 * @example
 * ```typescript
 * get_lock_script_type('76a914' + hash160 + '88ac') // 'p2pkh'
 * get_lock_script_type('0014' + pubkeyHash)         // 'p2wpkh'
 * get_lock_script_type('5120' + taprootKey)         // 'p2tr'
 * get_lock_script_type('deadbeef')                  // null (unknown)
 * ```
 */
export function get_lock_script_type(script: Bytes): LockScriptType | null {
	// Get the hex string of the script.
	const hex = Buff.bytes(script).hex;
	// Iterate over the lock script regexes.
	for (const [type, regex] of Object.entries(LOCK_SCRIPT_REGEX)) {
		// If the script matches the regex, return the type.
		if (regex.test(hex)) return type as LockScriptType;
	}
	// If the script does not match any regex, return null.
	return null;
}

/**
 * Get the witness version of a locking script.
 *
 * SegWit scripts use version bytes: 0x00 for v0 (P2WPKH/P2WSH), 0x51 for v1 (P2TR).
 * Non-SegWit scripts return null.
 *
 * @param script - The locking script (hex string or bytes)
 * @returns The witness version (0 or 1) or null for non-SegWit scripts
 *
 * @example
 * ```typescript
 * get_lock_script_version('0014' + hash) // 0 (SegWit v0)
 * get_lock_script_version('5120' + key)  // 1 (SegWit v1/Taproot)
 * get_lock_script_version('76a914...')   // null (Legacy P2PKH)
 * ```
 */
export function get_lock_script_version(script: Bytes): WitnessVersion | null {
	// Get the version of the script.
	const version = Buff.bytes(script);
	// Return the version of the script.
	switch (version.at(0)) {
		case 0x00:
			return 0;
		case 0x51:
			return 1;
		default:
			return null;
	}
}

/**
 * Check if a script is a P2PKH (Pay-to-Public-Key-Hash) script.
 *
 * P2PKH is the original Bitcoin address format. Script pattern:
 * OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is P2PKH
 *
 * @example
 * ```typescript
 * is_p2pkh_script('76a914' + hash160 + '88ac') // true
 * ```
 */
export function is_p2pkh_script(script: Bytes): boolean {
	const hex = Buff.bytes(script).hex;
	return LOCK_SCRIPT_REGEX.p2pkh.test(hex);
}

/**
 * Check if a script is a P2SH (Pay-to-Script-Hash) script.
 *
 * P2SH allows spending based on script hash. Script pattern:
 * OP_HASH160 <20 bytes> OP_EQUAL
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is P2SH
 *
 * @example
 * ```typescript
 * is_p2sh_script('a914' + scriptHash + '87') // true
 * ```
 */
export function is_p2sh_script(script: Bytes): boolean {
	const hex = Buff.bytes(script).hex;
	return LOCK_SCRIPT_REGEX.p2sh.test(hex);
}

/**
 * Check if a script is a P2WPKH (Pay-to-Witness-Public-Key-Hash) script.
 *
 * P2WPKH is native SegWit v0 for single-key addresses. Script pattern:
 * OP_0 <20 bytes>
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is P2WPKH
 *
 * @example
 * ```typescript
 * is_p2wpkh_script('0014' + pubkeyHash) // true
 * ```
 */
export function is_p2wpkh_script(script: Bytes): boolean {
	const hex = Buff.bytes(script).hex;
	return LOCK_SCRIPT_REGEX.p2wpkh.test(hex);
}

/**
 * Check if a script is a P2WSH (Pay-to-Witness-Script-Hash) script.
 *
 * P2WSH is native SegWit v0 for script-based addresses. Script pattern:
 * OP_0 <32 bytes>
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is P2WSH
 *
 * @example
 * ```typescript
 * is_p2wsh_script('0020' + sha256Hash) // true
 * ```
 */
export function is_p2wsh_script(script: Bytes): boolean {
	const hex = Buff.bytes(script).hex;
	return LOCK_SCRIPT_REGEX.p2wsh.test(hex);
}

/**
 * Check if a script is a P2TR (Pay-to-Taproot) script.
 *
 * P2TR is SegWit v1 (Taproot). Script pattern:
 * OP_1 <32 bytes>
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is P2TR
 *
 * @example
 * ```typescript
 * is_p2tr_script('5120' + xOnlyPubkey) // true
 * ```
 */
export function is_p2tr_script(script: Bytes): boolean {
	const hex = Buff.bytes(script).hex;
	return LOCK_SCRIPT_REGEX.p2tr.test(hex);
}

/**
 * Check if a script is an OP_RETURN script using regex matching.
 *
 * Alternative to is_return_script() that uses the standard regex pattern.
 *
 * @param script - The script to check (hex string or bytes)
 * @returns True if the script is OP_RETURN
 *
 * @example
 * ```typescript
 * is_opreturn_script('6a' + data) // true
 * ```
 */
export function is_opreturn_script(script: Bytes): boolean {
	const hex = Buff.bytes(script).hex;
	return LOCK_SCRIPT_REGEX.opreturn.test(hex);
}
