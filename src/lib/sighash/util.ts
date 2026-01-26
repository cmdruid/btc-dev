/**
 * Signature hash utility functions.
 *
 * Helper functions for extracting data needed for signature hash calculation.
 *
 * @module
 */

import { Buff } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { sha256 } from "@vbyte/crypto/hash";
import { ValidationError } from "@/error.js";

import type {
	SigHashOptions,
	TxData,
	TxInput,
	TxOutput,
} from "@/types/index.js";

/**
 * Get the prevout (previous output) data for a transaction input.
 *
 * Prevout data includes the value and scriptPubKey from the UTXO being spent.
 * This is required for signature hash calculation.
 *
 * @param vin - Transaction input with prevout data
 * @returns The prevout data (value and script_pk)
 * @throws Error if prevout data is missing
 *
 * @example
 * ```typescript
 * const prevout = get_prevout(txinput)
 * // { value: 50000, script_pk: '0014...' }
 * ```
 */
export function get_prevout(vin: TxInput): TxOutput {
	Assert.exists(
		vin.prevout,
		`Prevout data missing for input: ${String(vin.txid)}`,
	);
	return vin.prevout;
}

/**
 * Extract a transaction input for signing.
 *
 * Retrieves the input to sign either by index or from a provided txinput object.
 * Used internally by sighash functions to get the input being signed.
 *
 * @param txdata - Full transaction data
 * @param config - Options containing either txindex or txinput
 * @returns The transaction input to sign
 * @throws {ValidationError} If txindex is out of bounds
 * @throws {Error} If neither txindex nor txinput is provided
 *
 * @example
 * ```typescript
 * const input = parse_txinput(txdata, { txindex: 0 })
 * // Returns txdata.vin[0]
 * ```
 */
export function parse_txinput(
	txdata: TxData,
	config?: SigHashOptions,
): TxInput {
	let { txindex, txinput } = config ?? {};
	if (txindex !== undefined) {
		if (txindex >= txdata.vin.length) {
			// If index is out of bounds, throw error.
			throw new ValidationError(
				`input index ${txindex} out of bounds. Transaction has ${txdata.vin.length} inputs (indices 0-${txdata.vin.length - 1})`
			);
		}
		txinput = txdata.vin.at(txindex);
	}
	Assert.ok(txinput !== undefined);
	return txinput;
}

/**
 * Extract and hash annex data from a taproot witness.
 *
 * In BIP-341, the annex is an optional element at the end of the witness
 * stack that starts with 0x50. If present, its SHA256 hash is included
 * in the signature hash.
 *
 * @param witness - Witness stack elements (hex strings)
 * @returns SHA256 hash of the annex with varint prefix, or undefined if no annex
 *
 * @example
 * ```typescript
 * // Witness with annex (last element starts with '50')
 * const annex = get_annex_data(['sig', 'script', 'cblock', '50abcd'])
 * // Returns SHA256 hash of the annex
 *
 * // Witness without annex
 * const noAnnex = get_annex_data(['sig', 'script', 'cblock'])
 * // Returns undefined
 * ```
 */
export function get_annex_data(witness?: string[]): Buff | undefined {
	// If no witness exists, return undefined.
	if (witness === undefined) return;
	// If there are less than two elements, return undefined.
	if (witness.length < 2) return;
	// Define the last element as the annex.
	const annex = witness.at(-1);
	// If the annex is a string and starts with '50',
	if (typeof annex === "string" && annex.startsWith("50")) {
		// Convert the annex to a buffer with a varint prefix.
		const bytes = Buff.hex(annex).prefix_varint("be");
		// Return the sha256 of the annex.
		return sha256(bytes);
	}
	// Else, return undefined.
	return undefined;
}
