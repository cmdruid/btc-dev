import { Buff } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { hash340 } from "@vbyte/crypto/hash";
import { TAPLEAF_DEFAULT_VERSION } from "@/const.js";
import { prefix_script_size } from "@/lib/script/index.js";

const DEFAULT_VERSION = TAPLEAF_DEFAULT_VERSION;

/**
 * Encode a tapscript into a tapleaf hash.
 * Prefixes the script with its size and applies the TapLeaf tagged hash.
 *
 * @param script  - The tapscript to encode (hex string or bytes)
 * @param version - Tapleaf version byte (default: 0xc0)
 * @returns Tapleaf hash as 32-byte Buff
 *
 * @example
 * ```typescript
 * const script = '20' + pubkey + 'ac' // <pubkey> OP_CHECKSIG
 * const tapleaf = encode_tapscript(script)
 * ```
 */
export function encode_tapscript(
	script: string | Uint8Array,
	version = DEFAULT_VERSION,
): Buff {
	const preimg = prefix_script_size(script);
	return encode_tapleaf(preimg, version);
}

/**
 * Encode data into a tapleaf hash using the TapLeaf tagged hash.
 *
 * @param data    - The data to hash (typically size-prefixed script)
 * @param version - Tapleaf version byte (default: 0xc0)
 * @returns Tapleaf hash as 32-byte Buff
 */
export function encode_tapleaf(
	data: string | Uint8Array,
	version = DEFAULT_VERSION,
): Buff {
	const vbyte = encode_leaf_version(version);
	return hash340("TapLeaf", vbyte, data);
}

/**
 * Encode two tapleaf/branch hashes into a tapbranch hash.
 * Combines two children using the TapBranch tagged hash.
 * Children are sorted lexicographically before hashing.
 *
 * @param leaf_a - First child hash (hex string)
 * @param leaf_b - Second child hash (hex string)
 * @returns Tapbranch hash as 32-byte Buff
 */
export function encode_tapbranch(leaf_a: string, leaf_b: string): Buff {
	// Compare leaves in lexical order.
	if (leaf_b < leaf_a) {
		// Swap leaves if needed.
		[leaf_a, leaf_b] = [leaf_b, leaf_a];
	}
	// Return digest of leaves as a branch hash.
	return hash340("TapBranch", leaf_a, leaf_b);
}

/**
 * Encode a tapleaf version byte by masking the parity bit.
 *
 * @param version - Tapleaf version (default: 0xc0)
 * @returns Version with parity bit cleared
 */
export function encode_leaf_version(version = 0xc0): number {
	return version & 0xfe;
}

/**
 * Encode a taproot tweak from an internal pubkey and optional data.
 * Uses the TapTweak tagged hash.
 *
 * @param pubkey - 32-byte internal public key (x-only)
 * @param data   - Optional commitment data (typically merkle root)
 * @returns Taptweak hash as 32-byte Buff
 * @throws Error if pubkey is not 32 bytes
 *
 * @example
 * ```typescript
 * // Key-only spend (no script tree)
 * const tweak = encode_taptweak(internalPubkey)
 *
 * // Script tree spend
 * const tweak = encode_taptweak(internalPubkey, merkleRoot)
 * ```
 */
export function encode_taptweak(
	pubkey: string | Uint8Array,
	data: string | Uint8Array = new Uint8Array(),
): Buff {
	Assert.ok(Buff.bytes(pubkey).length === 32, "pubkey must be 32 bytes");
	return hash340("TapTweak", pubkey, data);
}
