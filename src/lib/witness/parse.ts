/**
 * Witness data parsing utilities.
 *
 * Functions for analyzing and parsing SegWit witness data to determine
 * spend type (P2WPKH, P2WSH, P2TR, P2TS) and extract relevant components.
 *
 * @module
 */

import { Buff, type Bytes } from "@vbyte/buff";
import { TAPLEAF_VERSIONS } from "@/const.js";
import { is_valid_script } from "@/lib/script/decode.js";

import type {
	SpendScriptType,
	WitnessData,
	WitnessVersion,
} from "@/types/index.js";

/**
 * Parse witness data to determine spend type and extract components.
 *
 * Analyzes witness stack to identify:
 * - P2WPKH: 2 elements (signature + pubkey)
 * - P2WSH: Multiple elements with witness script
 * - P2TR: Single Schnorr signature (key-path spend)
 * - P2TS: Taproot script-path spend (with control block)
 *
 * Also extracts annex data (BIP-341) and control block if present.
 *
 * @param witness - Array of witness elements as bytes
 * @returns Parsed witness data with type, version, params, script, etc.
 *
 * @example
 * ```typescript
 * const witnessData = parse_witness([signature, pubkey])
 * console.log(witnessData.type) // 'p2wpkh'
 * console.log(witnessData.version) // 0
 * ```
 */
export function parse_witness(witness: Bytes[]): WitnessData {
	// Parse the witness data.
	const elems = witness.map((e) => Buff.bytes(e));
	const stack = witness.map((e) => Buff.bytes(e).hex);
	const annex = parse_annex_data(elems);
	if (annex !== null) elems.pop();
	const cblock = parse_cblock_data(elems);
	if (cblock !== null) elems.pop();
	const type = parse_witness_type(elems, cblock);
	const version = parse_witness_version(type);
	const script = parse_witness_script(elems, type);
	if (script !== null) elems.pop();
	const params = elems.map((e) => e.hex);
	return { annex, cblock, params, script, stack, type, version };
}

function parse_annex_data(data: Uint8Array[]): string | null {
	// Get the last element of the array.
	const elem = data.at(-1);
	// Check if the element fits the annex format.
	if (data.length > 1 && elem instanceof Uint8Array && elem[0] === 0x50) {
		// Return the element.
		return new Buff(elem).hex;
	} else {
		// Return null.
		return null;
	}
}

function parse_cblock_data(data: Uint8Array[]): string | null {
	const elem = data.at(-1);
	if (
		data.length > 1 &&
		elem instanceof Uint8Array &&
		elem.length > 32 &&
		TAPLEAF_VERSIONS.includes(elem[0] & 0xfe)
	) {
		// Return the element.
		return new Buff(elem).hex;
	} else {
		// Return null.
		return null;
	}
}

function parse_witness_script(
	elems: Uint8Array[],
	type: SpendScriptType | null,
) {
	let script: Uint8Array | undefined;
	switch (type) {
		case "p2ts":
			script = elems.at(-1);
			break;
		case "p2wsh":
			script = elems.at(-1);
			break;
	}
	return script !== undefined ? new Buff(script).hex : null;
}

function parse_witness_type(
	elems: Uint8Array[],
	cblock: string | null,
): SpendScriptType | null {
	// Get the important elements of the witness.
	const param_0 = elems.at(0),
		param_1 = elems.at(1),
		param_x = elems.at(-1);
	// If the cblock is present and the last element exists:
	if (cblock !== null && param_x !== undefined) {
		return "p2ts";
		// If the witness elements match the profile of a p2w-pkh:
		// ECDSA signatures are 71-73 bytes (DER-encoded), Schnorr are 64-65 bytes
	} else if (
		elems.length === 2 &&
		param_0 !== undefined &&
		param_1 !== undefined &&
		param_0.length >= 71 &&
		param_0.length <= 73 &&
		param_1.length === 33
	) {
		return "p2wpkh";
		// If the witness elements match the profile of a p2tr-pk (Schnorr 64 or 65 bytes):
	} else if (
		elems.length === 1 &&
		param_0 !== undefined &&
		(param_0.length === 64 || param_0.length === 65)
	) {
		return "p2tr";
		// If there is at least two witness elements:
	} else if (
		elems.length > 1 &&
		param_x !== undefined &&
		is_valid_script(param_x)
	) {
		return "p2wsh";
		// If the witness elements don't match any known profile:
	} else {
		return null;
	}
}

function parse_witness_version(
	type: SpendScriptType | null,
): WitnessVersion | null {
	if (type === null) return null;
	if (type.startsWith("p2w")) return 0;
	if (type.startsWith("p2t")) return 1;
	return null;
}
