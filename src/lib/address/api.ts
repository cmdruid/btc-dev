import { Buff, type Bytes } from "@vbyte/buff";
import { LOCK_SCRIPT_TYPE } from "@/const.js";
import { get_lock_script_type } from "@/lib/script/lock.js";
import type { AddressInfo, ChainNetwork } from "@/types/index.js";

import { P2PKH } from "./p2pkh.js";
import { P2SH } from "./p2sh.js";
import { P2TR } from "./p2tr.js";
import { P2WPKH } from "./p2wpkh.js";
import { P2WSH } from "./p2wsh.js";
import { get_address_info } from "./util.js";

/**
 * Get the address for a given locking script.
 *
 * @param script - The locking script.
 * @param network - The network to use.
 * @returns The address.
 */
export function get_address(
	script: Bytes,
	network: ChainNetwork = "main",
): string {
	// Convert the script into bytes.
	const bytes = Buff.bytes(script);
	// Get the address configuration.
	const type = get_lock_script_type(bytes);
	// If the script type is not recognized, throw an error.
	if (type === null)
		throw new Error("Unknown or unsupported locking script type");
	// Create the address based on the script type.
	switch (type) {
		case LOCK_SCRIPT_TYPE.P2PKH:
			return P2PKH.encode_address(script, network);
		case LOCK_SCRIPT_TYPE.P2SH:
			return P2SH.encode_address(script, network);
		case LOCK_SCRIPT_TYPE.P2WPKH:
			return P2WPKH.encode_address(script, network);
		case LOCK_SCRIPT_TYPE.P2WSH:
			return P2WSH.encode_address(script, network);
		case LOCK_SCRIPT_TYPE.P2TR:
			return P2TR.encode_address(script, network);
		default:
			throw new Error(`unknown script type: ${type}`);
	}
}

export function parse_address(address: string): AddressInfo {
	return get_address_info(address);
}
