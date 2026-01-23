import { Buff } from "@vbyte/buff";
import type {
	AddressConfig,
	AddressConfigEntry,
	AddressInfo,
	ChainNetwork,
	LockScriptType,
} from "@/types/index.js";
import { decode_address } from "./encode.js";
import { get_address_script } from "./script.js";

const CONFIG_TABLE: AddressConfigEntry[] = [
	["1", "p2pkh", "main", 20, "base58", 0x00],
	["3", "p2sh", "main", 20, "base58", 0x05],
	["m", "p2pkh", "testnet", 20, "base58", 0x6f],
	["n", "p2pkh", "testnet", 20, "base58", 0x6f],
	["2", "p2sh", "testnet", 20, "base58", 0xc4],
	["m", "p2pkh", "regtest", 20, "base58", 0x6f],
	["n", "p2pkh", "regtest", 20, "base58", 0x6f],
	["2", "p2sh", "regtest", 20, "base58", 0xc4],
	["bc", "p2wpkh", "main", 20, "bech32", 0],
	["tb", "p2wpkh", "testnet", 20, "bech32", 0],
	["bcrt", "p2wpkh", "regtest", 20, "bech32", 0],
	["bc", "p2wsh", "main", 32, "bech32", 0],
	["tb", "p2wsh", "testnet", 32, "bech32", 0],
	["bcrt", "p2wsh", "regtest", 32, "bech32", 0],
	["bc", "p2tr", "main", 32, "bech32m", 1],
	["tb", "p2tr", "testnet", 32, "bech32m", 1],
	["bcrt", "p2tr", "regtest", 32, "bech32m", 1],
];

/**
 * Lookup an address configuration by its type and network.
 *
 * @param address_network - The network of the address.
 * @param address_type    - The type of the address.
 * @returns The address information, or null if the address is not recognized.
 */
export function get_address_config(
	address_network: ChainNetwork,
	address_type: LockScriptType,
): AddressConfig | null {
	// For each configuration in the table,
	for (const [prefix, type, network, size, format, version] of CONFIG_TABLE) {
		// Check if the address matches the configuration
		if (type === address_type && network === address_network) {
			// Return the address configuration.
			return { type, prefix, network, size, format, version };
		}
	}
	// If no configuration matches the address, return null.
	return null;
}

/**
 * Parse an address into its data and script.
 *
 * @param address - The address to parse.
 * @returns The address data and script.
 */
export function get_address_info(address: string): AddressInfo {
	// Decode the address.
	const dec = decode_address(address);
	// For each configuration in the table,
	for (const [prefix, type, network, size, format, version] of CONFIG_TABLE) {
		// Check if the address matches the configuration
		if (format !== dec.format) continue;
		if (size !== dec.data.length) continue;
		if (version !== dec.version) continue;

		if (dec.prefix) {
			if (prefix !== dec.prefix) continue;
		} else {
			if (!address.startsWith(prefix)) continue;
		}

		// Convert the decoded data into a hex string.
		const data = Buff.bytes(dec.data).hex;
		const script = get_address_script(data, type);
		// Return the address configuration and data.
		return { data, script, type, prefix, network, size, format, version };
	}
	// Otherwise, throw an error
	throw new Error("address configuration is invalid");
}
