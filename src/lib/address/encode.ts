import { Buff } from "@vbyte/buff";

import { Assert, B58chk, Bech32, Bech32m } from "@vbyte/micro-lib";

import type { AddressFormat, EncoderConfig } from "@/types/address.js";

const ENCODING_REGEX = {
	base58: /^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
	bech32: /^(bc|tb|bcrt)1q[ac-hj-np-z02-9]{6,87}$/,
	bech32m: /^(bc|tb|bcrt)1p[ac-hj-np-z02-9]{6,87}$/,
};

const VERSION = {
	bech32: 0,
	bech32m: 1,
};

/**
 * Decode an address.
 *
 * @param address - The address to decode.
 * @returns The decoded address.
 */
export function decode_address(address: string): EncoderConfig {
	// Get the address format.
	const format = get_address_format(address);
	// If the format is not found, throw an error.
	if (format === null)
		throw new Error(`unrecognized address format: ${address}`);
	// Decode the address based on the format.
	if (format === "base58") return base58_decode(address);
	if (format === "bech32") return bech32_decode(address);
	if (format === "bech32m") return bech32m_decode(address);
	// If we didn't find a matching decoder, throw.
	throw new Error("unable to find a matching address configuration");
}

/**
 * Encode an address.
 *
 * @param address - The address to encode.
 * @returns The encoded address as a string, or null if the address is not
 *          recognized.
 */
export function encode_address(config: EncoderConfig): string {
	// Encode the address based on the format.
	if (config.format === "base58") return base58_encode(config);
	if (config.format === "bech32") return bech32_encode(config);
	if (config.format === "bech32m") return bech32m_encode(config);
	// If the format is not recognized, throw an error.
	throw new Error(`unrecognized encoding format: ${config.format}`);
}

/**
 * Get the encoding type for a given address.
 *
 * @param address - The address to get the encoding type for.
 * @returns The encoding type, or null if the address is not recognized.
 */
function get_address_format(address: string): AddressFormat | null {
	// For each encoding type, check if the address matches the regex.
	for (const [format, regex] of Object.entries(ENCODING_REGEX)) {
		// If the address matches the regex, return the format.
		if (regex.test(address)) return format as AddressFormat;
		// If the address does not match the regex, continue to the next encoding type.
	}
	// If no encoding type matches the address, return null.
	return null;
}

/**
 * Encode data as a base58 string.
 *
 * @param config - The encoder configuration.
 * @returns The encoded base58 string.
 */
function base58_encode(config: EncoderConfig): string {
	// Assert the format is correct.
	Assert.ok(config.format === "base58", "encoding mismatch");
	// Assert the version is specified.
	Assert.exists(config.version, "must specify a version");
	// Convert the data into bytes with a version prefix.
	const bytes = Buff.join([config.version, config.data]);
	// Encode the data as a base58 string.
	return B58chk.encode(bytes);
}

/**
 * Decode data as a base58 string.
 *
 * @param encoded - The base58 string to decode.
 * @returns The decoded data.
 */
function base58_decode(encoded: string): EncoderConfig {
	// Decode the encoded data.
	const bytes = B58chk.decode(encoded);
	// Get the data from the decoded bytes.
	const data = bytes.slice(1);
	// Get the version from the decoded bytes.
	const version = bytes[0];
	// Return the decoded address.
	return { data, format: "base58", version };
}

/**
 * Encode data as a bech32 string.
 *
 * @param config - The encoder configuration.
 * @returns The encoded bech32 string.
 */
function bech32_encode(config: EncoderConfig): string {
	// Assert the format is correct.
	Assert.ok(config.format === "bech32", "encoding mismatch");
	// Assert the prefix is specified.
	Assert.exists(config.prefix, "prefix is required");
	// Convert the data into bytes.
	const bytes = Buff.bytes(config.data);
	// Convert the bytes into words.
	const words = Bech32.to_words(bytes);
	// Encode the data as a bech32 string.
	return Bech32.encode(config.prefix, [VERSION.bech32, ...words]);
}

/**
 * Decode data as a bech32 string.
 *
 * @param encoded - The bech32 string to decode.
 * @returns The decoded data.
 */
function bech32_decode(encoded: string): EncoderConfig {
	// Decode the encoded data.
	const { prefix, words } = Bech32.decode(encoded);
	// Get the version and rest of the words.
	const [version, ...rest] = words;
	// Assert the version is correct.
	Assert.ok(version === VERSION.bech32, "bech32 version mismatch");
	// Convert the rest of the words into bytes.
	const data = Bech32.to_bytes(rest);
	// Return the decoded address.
	return { data, format: "bech32", prefix, version };
}

/**
 * Encode data as a bech32 string.
 *
 * @param config - The encoder configuration.
 * @returns The encoded bech32 string.
 */
function bech32m_encode(config: EncoderConfig): string {
	// Assert the format is correct.
	Assert.ok(config.format === "bech32m", "encoding mismatch");
	// Assert the prefix is specified.
	Assert.exists(config.prefix, "prefix is required");
	// Convert the data into bytes.
	const bytes = Buff.bytes(config.data);
	// Convert the bytes into words.
	const words = Bech32m.to_words(bytes);
	// Encode the data as a bech32m string.
	return Bech32m.encode(config.prefix, [VERSION.bech32m, ...words]);
}

/**
 * Decode data as a bech32 string.
 *
 * @param encoded - The bech32 string to decode.
 * @returns The decoded data.
 */
function bech32m_decode(encoded: string): EncoderConfig {
	// Decode the encoded data.
	const { prefix, words } = Bech32m.decode(encoded);
	// Get the version and rest of the words.
	const [version, ...rest] = words;
	// Assert the version is correct.
	Assert.ok(version === VERSION.bech32m, "bech32m version mismatch");
	// Convert the rest of the words into bytes.
	const data = Bech32m.to_bytes(rest);
	// Return the decoded address.
	return { data, format: "bech32m", prefix, version };
}
