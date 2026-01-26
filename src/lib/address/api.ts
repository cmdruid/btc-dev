import { Buff, type Bytes } from "@vbyte/buff";
import { LOCK_SCRIPT_TYPE } from "@/const.js";
import { ConfigError } from "@/error.js";
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
		throw new ConfigError("Unknown or unsupported locking script type");
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
			throw new ConfigError(`unknown script type: ${type}`);
	}
}

/**
 * Parse a Bitcoin address and return its information.
 *
 * Analyzes the address format and extracts type, network, and data.
 * Supports all standard address formats: P2PKH, P2SH, P2WPKH, P2WSH, P2TR.
 *
 * @param address - The Bitcoin address to parse
 * @returns Address information including type, network, format, and data
 * @throws Error if the address format is invalid or unrecognized
 *
 * @example
 * ```typescript
 * // Parse a mainnet P2WPKH address
 * const info = parse_address('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
 * // { type: 'p2wpkh', network: 'main', format: 'bech32', data: '751e76e8199196d454941c45d1b3a323f1433bd6' }
 *
 * // Parse a testnet P2TR address
 * const info = parse_address('tb1p...')
 * // { type: 'p2tr', network: 'testnet', format: 'bech32m', data: '...' }
 * ```
 */
export function parse_address(address: string): AddressInfo {
	return get_address_info(address);
}
