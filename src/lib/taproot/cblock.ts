/**
 * Taproot control block utilities.
 *
 * Functions for creating and verifying taproot control blocks,
 * which are used for script-path spending in BIP-341.
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
 * @module
 */

import { Buff, type Bytes } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { ECC } from "@vbyte/crypto";
import { TAPLEAF_DEFAULT_VERSION } from "@/const.js";
import * as Schema from "@/schema/index.js";
import type { TaprootConfig, TaprootContext } from "@/types/index.js";

import { encode_tapbranch, encode_taptweak } from "./encode.js";

import { parse_cblock, parse_pubkey_parity } from "./parse.js";
import { merkleize } from "./tree.js";

const DEFAULT_VERSION = TAPLEAF_DEFAULT_VERSION;

/**
 * Create a taproot output with optional script tree.
 *
 * Computes the tweaked public key (tapkey) and control block for
 * spending via key-path or script-path.
 *
 * @param config - Taproot configuration with internal key and optional leaves
 * @returns Taproot context with tapkey, control block, and merkle path
 *
 * @example
 * ```typescript
 * // Key-path only (no scripts)
 * const ctx = create_taproot({ pubkey: internalKey })
 *
 * // With script tree
 * const ctx = create_taproot({
 *   pubkey: internalKey,
 *   leaves: [leaf1, leaf2],
 *   target: targetLeafHash
 * })
 * ```
 */
export function create_taproot(config: TaprootConfig): TaprootContext {
	Schema.taproot.config.parse(config);

	const { pubkey, version = DEFAULT_VERSION } = config;

	const leaves = config.leaves ?? [];

	const target =
		config.target !== undefined ? Buff.bytes(config.target).hex : undefined;

	let path: string[] = [],
		taproot: string | undefined;

	if (leaves.length > 0) {
		// Merkelize the leaves into a root hash (with proof).
		const [root, _, proofs] = merkleize(leaves, target);
		// Get the control path from the merkelized output.
		path = proofs;
		// Get the tapped key from the internal key.
		taproot = root;
	} else {
		// Get the tapped key from the single tapleaf.
		taproot = target;
	}

	const taptweak = encode_taptweak(pubkey, taproot);
	const twk_key = ECC.tweak_pubkey(pubkey, taptweak, "ecdsa");
	const parity = parse_pubkey_parity(twk_key);
	const tapkey = ECC.serialize_pubkey(twk_key, "bip340");
	// Get the block version / parity bit.
	const cbit = Buff.num(version + parity);
	// Stack the initial control block data.
	const block: Bytes[] = [cbit, Buff.bytes(pubkey)];
	// If there is more than one path, add to block.
	if (path.length > 0) {
		block.push(...path);
	}
	// Merge the data together into one array.
	const cblock = Buff.join(block);

	return {
		int_key: Buff.bytes(pubkey).hex,
		path,
		parity,
		taproot: taproot ?? null,
		cblock: cblock.hex,
		tapkey: tapkey.hex,
		taptweak: taptweak.hex,
	};
}

/**
 * Verify a taproot control block against a tapkey and target leaf.
 *
 * Reconstructs the tapkey from the control block's internal key,
 * merkle path, and target leaf hash, then compares to the expected tapkey.
 *
 * @param tapkey - Expected taproot output key (32 bytes, x-only)
 * @param target - Target leaf hash being verified
 * @param cblock - Control block containing parity, internal key, and path
 * @returns True if the control block is valid for this tapkey and target
 *
 * @example
 * ```typescript
 * const isValid = verify_taproot(tapkey, leafHash, controlBlock)
 * if (!isValid) {
 *   throw new Error('Control block verification failed')
 * }
 * ```
 */
export function verify_taproot(
	tapkey: string,
	target: string,
	cblock: string,
): boolean {
	Assert.ok(Buff.bytes(tapkey).length === 32, "tapkey must be 32 bytes");
	const { parity, path, int_key } = parse_cblock(cblock);

	const ext_key = Buff.join([parity, tapkey]);

	let branch = Buff.bytes(target).hex;

	for (const leaf of path) {
		branch = encode_tapbranch(branch, leaf).hex;
	}

	const tap_tweak = encode_taptweak(int_key, branch);
	const tweaked_key = ECC.tweak_pubkey(int_key, tap_tweak, "ecdsa");

	return ext_key.hex === tweaked_key.hex;
}
