/**
 * P2WSH (Pay-to-Witness-Script-Hash) address utilities.
 *
 * P2WSH is native SegWit v0 for script-based outputs (addresses starting with "bc1q"
 * but longer than P2WPKH). Used for native SegWit multisig and complex scripts.
 *
 * @module
 */

import { Buff, type Bytes } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { sha256 } from "@vbyte/crypto/hash";
import { LOCK_SCRIPT_TYPE } from "@/const.js";
import { is_p2wsh_script } from "@/lib/script/lock.js";
import type { AddressInfo, ChainNetwork } from "@/types/index.js";
import { encode_address } from "./encode.js";
import { get_address_config, get_address_info } from "./util.js";

const ADDRESS_TYPE = LOCK_SCRIPT_TYPE.P2WSH;

/**
 * P2WSH address namespace.
 *
 * @example
 * ```typescript
 * // Create address from witness script
 * const address = P2WSH.create_address(witnessScript, 'main')
 * // Returns: bc1q... (62 characters)
 *
 * // Decode address to get script info
 * const info = P2WSH.decode_address('bc1q...')
 * ```
 */
export namespace P2WSH {
	export const create_address = create_p2wsh_address;
	export const create_script = create_p2wsh_script;
	export const encode_address = encode_p2wsh_address;
	export const encode_script = encode_p2wsh_script;
	export const decode_address = decode_p2wsh_address;
	export const decode_script = decode_p2wsh_script;
}

function create_p2wsh_address(
	script: Bytes,
	network: ChainNetwork = "main",
): string {
	// Create the p2wsh script.
	const wsh_script = create_p2wsh_script(script);
	// Encode the script as an address.
	return encode_p2wsh_address(wsh_script, network);
}

function create_p2wsh_script(script: Bytes): Buff {
	// Convert the script into bytes.
	const bytes = Buff.bytes(script);
	// Convert the bytes into a hash.
	const hash = sha256(bytes);
	// Return the script.
	return encode_p2wsh_script(hash);
}

function encode_p2wsh_script(script_hash: Bytes): Buff {
	return Buff.join(["0020", script_hash]);
}

function encode_p2wsh_address(
	script_pk: Bytes,
	network: ChainNetwork = "main",
): string {
	// Get the script hash from the script.
	const script_hash = decode_p2wsh_script(script_pk);
	// Get the address configuration.
	const config = get_address_config(network, ADDRESS_TYPE);
	// Assert the configuration exists.
	Assert.exists(
		config,
		`unrecognized address config: ${ADDRESS_TYPE} on ${network}`,
	);
	// Assert the payload size is correct.
	Assert.ok(
		script_hash.length === config.size,
		`invalid payload size: ${script_hash.length} !== ${config.size}`,
	);
	// Encode the address.
	return encode_address({
		data: script_hash,
		format: "bech32",
		prefix: config.prefix,
	});
}

function decode_p2wsh_address(address: string): AddressInfo {
	// Parse the address.
	const parsed = get_address_info(address);
	// Assert the address type is correct.
	Assert.ok(
		parsed.type === "p2wsh",
		`address type mismatch: ${parsed.type} !== ${ADDRESS_TYPE}`,
	);
	// Return the parsed address.
	return parsed;
}

function decode_p2wsh_script(script: Bytes): Buff {
	// Assert the script is a p2wsh script.
	Assert.ok(is_p2wsh_script(script), `invalid p2wsh script`);
	// Convert the script into bytes.
	const bytes = Buff.bytes(script);
	// Return the script hash from the script.
	return bytes.slice(2, 34);
}
