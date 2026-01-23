import { Buff, type Bytes } from "@vbyte/buff";
import { Assert } from "@vbyte/micro-lib";
import { hash160 } from "@vbyte/micro-lib/hash";
import { LOCK_SCRIPT_TYPE } from "@/const.js";
import { is_p2wpkh_script } from "@/lib/script/lock.js";
import type { AddressInfo, ChainNetwork } from "@/types/index.js";
import { encode_address } from "./encode.js";
import { get_address_config, get_address_info } from "./util.js";

const ADDRESS_TYPE = LOCK_SCRIPT_TYPE.P2WPKH;

export namespace P2WPKH {
	export const create_address = create_p2wpkh_address;
	export const create_script = create_p2wpkh_script;
	export const encode_address = encode_p2wpkh_address;
	export const encode_script = encode_p2wpkh_script;
	export const decode_address = decode_p2wpkh_address;
	export const decode_script = decode_p2wpkh_script;
}

function create_p2wpkh_address(
	pubkey: Bytes,
	network: ChainNetwork = "main",
): string {
	// Create the p2wpkh script.
	const script = create_p2wpkh_script(pubkey);
	// Encode the script as an address.
	return encode_p2wpkh_address(script, network);
}

function create_p2wpkh_script(pubkey: Bytes): Buff {
	// Convert the public key into bytes.
	const bytes = Buff.bytes(pubkey);
	// Assert the public key is 33 bytes.
	Assert.size(bytes, 33, "invalid pubkey size");
	// Convert the bytes into a hash.
	const hash = hash160(bytes);
	// Return the script.
	return encode_p2wpkh_script(hash);
}

function encode_p2wpkh_script(pk_hash: Bytes): Buff {
	return Buff.join(["0014", pk_hash]);
}

function encode_p2wpkh_address(
	script_pk: Bytes,
	network: ChainNetwork = "main",
): string {
	// Get the public key hash from the script.
	const pk_hash = decode_p2wpkh_script(script_pk);
	// Get the address configuration.
	const config = get_address_config(network, ADDRESS_TYPE);
	// Assert the configuration exists.
	Assert.exists(
		config,
		`unrecognized address config: ${ADDRESS_TYPE} on ${network}`,
	);
	// Assert the payload size is correct.
	Assert.size(
		pk_hash,
		config.size,
		`invalid payload size: ${pk_hash.length} !== ${config.size}`,
	);
	// Encode the address.
	return encode_address({
		data: pk_hash,
		format: "bech32",
		prefix: config.prefix,
	});
}

function decode_p2wpkh_address(address: string): AddressInfo {
	// Parse the address.
	const parsed = get_address_info(address);
	// Assert the address type is correct.
	Assert.ok(
		parsed.type === "p2wpkh",
		`address type mismatch: ${parsed.type} !== ${ADDRESS_TYPE}`,
	);
	// Return the parsed address.
	return parsed;
}

function decode_p2wpkh_script(script: Bytes): Buff {
	// Assert the script is a p2wpkh script.
	Assert.ok(is_p2wpkh_script(script), `invalid p2wpkh script`);
	// Convert the script into bytes.
	const bytes = Buff.bytes(script);
	// Return the public key hash from the script.
	return bytes.slice(2, 22);
}
