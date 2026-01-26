/**
 * Transaction parsing utilities.
 *
 * Functions for parsing transaction data from various formats
 * (raw hex, bytes, or template objects).
 *
 * @module
 */

import { Assert } from "@vbyte/util";
import type { TxData, TxOutputTemplate } from "@/types/index.js";
import { create_tx, create_tx_output } from "./create.js";
import { decode_tx } from "./decode.js";
import { assert_tx_template } from "./validate.js";

/**
 * Parse transaction data from hex string, bytes, or template object.
 *
 * This is the main entry point for working with transactions. It accepts
 * multiple input formats and returns a normalized TxData object.
 *
 * @param txdata - Transaction as hex string, Uint8Array, or template object
 * @param prevouts - Optional prevout data to attach to inputs
 * @returns Normalized transaction data object
 * @throws {DecodingError} If raw transaction data is malformed
 *
 * @example
 * ```typescript
 * // Parse from hex
 * const tx = parse_tx('0200000001...')
 *
 * // Parse from template with prevouts
 * const tx = parse_tx(template, [
 *   { value: 100000n, script_pk: '0014...' }
 * ])
 * ```
 */
export function parse_tx(
	txdata: unknown,
	prevouts?: TxOutputTemplate[],
): TxData {
	// Define the tx variable.
	let tx: TxData;
	// If the txdata is a string or Uint8Array,
	if (typeof txdata === "string" || txdata instanceof Uint8Array) {
		// Decode the tx.
		tx = decode_tx(txdata);
	} else {
		// Assert the txdata is a valid tx template.
		assert_tx_template(txdata);
		// Create the tx.
		tx = create_tx(txdata);
	}
	// If the prevouts are provided,
	if (prevouts) {
		// Assert the prevouts are a non-empty array.
		Assert.has_items(prevouts, "prevouts must be a non-empty array");
		// Iterate over the inputs.
		for (const [idx, vin] of tx.vin.entries()) {
			// Get the prevout.
			const prevout = prevouts.at(idx);
			// Assert the prevout exists.
			Assert.exists(prevout, `prevout not found for input index: ${idx}`);
			// Create the prevout.
			vin.prevout = create_tx_output(prevout);
		}
	}
	// Return the tx.
	return tx;
}

/**
 * Serialize transaction data to a plain JSON-compatible object.
 *
 * Converts BigInt values to strings for JSON serialization without precision loss.
 * Useful for debugging or API responses.
 *
 * @param txdata - Transaction data in any supported format
 * @returns Plain object with serializable values (values as strings)
 */
export function serialize_tx(txdata: unknown): Record<string, unknown> {
	const tx = parse_tx(txdata);
	const version = tx.version;
	const locktime = tx.locktime;

	const vin: Record<string, unknown>[] = [];
	const vout: Record<string, unknown>[] = [];

	for (const e of tx.vin) {
		if (e.prevout !== null) {
			vin.push({
				script_pk: e.prevout.script_pk,
				value: String(e.prevout.value),
			});
		}
	}

	for (const e of tx.vout) {
		vout.push({
			script_pk: e.script_pk,
			value: String(e.value),
		});
	}

	return { version, locktime, vin, vout };
}
