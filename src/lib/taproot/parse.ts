import { Buff, Stream } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { ECC } from "@vbyte/crypto";
import { DecodingError, ValidationError } from "@/error.js";
import { parse_witness } from "@/lib/witness/parse.js";
import type { ControlBlock } from "@/types/index.js";
import {
	encode_tapbranch,
	encode_tapscript,
	encode_taptweak,
} from "./encode.js";

/**
 * Parse a taproot script-path witness and extract spending data.
 * Computes the tapkey from the control block and verifies the merkle proof.
 *
 * @param witness - Array of witness stack elements (hex strings)
 * @returns Parsed taproot spending data including cblock, params, script, tapkey, and tweak
 * @throws Error if control block or script is missing
 *
 * @example
 * ```typescript
 * const witness = [signature, tapscript, controlBlock]
 * const { tapkey, script, params } = parse_taproot_witness(witness)
 * ```
 */
export function parse_taproot_witness(witness: string[]) {
	const { cblock, params, script } = parse_witness(witness);

	Assert.exists(cblock, "cblock is null");
	Assert.exists(script, "script is null");

	const cblk = parse_cblock(cblock);
	const target = encode_tapscript(script, cblk.version);

	let branch = target.hex;

	for (const leaf of cblk.path) {
		branch = encode_tapbranch(branch, leaf).hex;
	}

	const tweak = encode_taptweak(cblk.int_key, branch);
	const tapkey = ECC.tweak_pubkey(cblk.int_key, tweak, "bip340");

	const hexParams = params.map((e) => Buff.bytes(e).hex);

	return { cblock: cblk, params: hexParams, script, tapkey: tapkey.hex, tweak: tweak.hex };
}

/**
 * Parse a taproot control block into its components.
 * Extracts version, parity, internal pubkey, and merkle path.
 *
 * @param cblock - Control block data (hex string or bytes)
 * @returns Parsed control block with int_key, path, parity, and version
 * @throws Error if control block has invalid format or non-empty remainder
 *
 * @example
 * ```typescript
 * const cblock = 'c0' + internalPubkey + merkleProof
 * const { int_key, path, version, parity } = parse_cblock(cblock)
 * ```
 */
export function parse_cblock(cblock: string | Uint8Array): ControlBlock {
	const buffer = new Stream(cblock);
	const cbyte = buffer.read(1).num;
	const int_key = buffer.read(32).hex;
	const [version, parity] = parse_cblock_parity(cbyte);
	const path = [];
	while (buffer.size >= 32) {
		path.push(buffer.read(32).hex);
	}
	if (buffer.size !== 0) {
		throw new DecodingError(
			`control block has ${buffer.size} extra bytes. Expected: 33 + (32 * path_length) bytes`
		);
	}
	return { int_key, path, parity, version };
}

/**
 * Parse the control block version byte to extract version and parity.
 * Even bytes indicate even parity (0x02), odd bytes indicate odd parity (0x03).
 *
 * @param cbits - Control block version byte
 * @returns Tuple of [version, parity] where version has parity bit cleared
 *
 * @example
 * ```typescript
 * parse_cblock_parity(0xc0) // [0xc0, 0x02] - even
 * parse_cblock_parity(0xc1) // [0xc0, 0x03] - odd
 * ```
 */
export function parse_cblock_parity(cbits: number) {
	return cbits % 2 === 0 ? [cbits, 0x02] : [cbits - 1, 0x03];
}

/**
 * Parse a compressed public key to extract its parity bit.
 * Returns 0 for even y-coordinate (0x02 prefix), 1 for odd (0x03 prefix).
 *
 * @param pubkey - 33-byte compressed public key (hex string or bytes)
 * @returns Parity bit: 0 for even, 1 for odd
 * @throws Error if pubkey is not 33 bytes or has invalid prefix
 *
 * @example
 * ```typescript
 * parse_pubkey_parity('02' + x_coordinate) // 0 (even)
 * parse_pubkey_parity('03' + x_coordinate) // 1 (odd)
 * ```
 */
export function parse_pubkey_parity(pubkey: string | Uint8Array): number {
	Assert.ok(Buff.bytes(pubkey).length === 33, "invalid pubkey size");
	const [parity] = Buff.bytes(pubkey);
	if (parity === 0x02) return 0;
	if (parity === 0x03) return 1;
	throw new ValidationError(
		`invalid pubkey parity prefix: 0x${parity.toString(16)}. Expected 0x02 (even) or 0x03 (odd)`
	);
}
