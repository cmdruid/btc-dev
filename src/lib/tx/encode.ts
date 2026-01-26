/**
 * Transaction encoding utilities.
 *
 * Functions for serializing transaction data into raw bytes for
 * broadcasting or signature hash calculation.
 *
 * @module
 */

import { Buff } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { COINBASE } from "@/const.js";
import type { TxData, TxInput, TxOutput } from "@/types/index.js";
import { assert_tx_data } from "./validate.js";

/**
 * Encode a complete transaction to raw bytes.
 *
 * @param txdata - Transaction data object
 * @param use_segwit - Include witness data (default: true)
 * @returns Serialized transaction as Buff
 *
 * @example
 * ```typescript
 * const rawTx = encode_tx(txdata)
 * console.log(rawTx.hex) // Transaction hex for broadcasting
 * ```
 */
export function encode_tx(txdata: TxData, use_segwit = true): Buff {
	// Assert the txdata is a valid tx data object.
	assert_tx_data(txdata);
	// Unpack the transaction data.
	const { version, vin, vout, locktime } = txdata;
	// Create a buffer for the transaction.
	const buffer: Buff[] = [encode_tx_version(version)];
	// If the transaction is a segwit transaction,
	if (use_segwit) {
		// Add the segwit marker to the buffer.
		buffer.push(Buff.hex("0001"));
	}
	// Add the inputs to the buffer.
	buffer.push(encode_tx_inputs(vin));
	// Add the outputs to the buffer.
	buffer.push(encode_tx_outputs(vout));
	// If the transaction is a segwit transaction,
	if (use_segwit) {
		// For each input in the transaction,
		for (const input of vin) {
			// Add the witness data to the buffer.
			buffer.push(encode_vin_witness(input.witness));
		}
	}
	// Add the locktime to the buffer.
	buffer.push(encode_tx_locktime(locktime));
	// Return the buffer as a single payload.
	return Buff.join(buffer);
}

/**
 * Encode transaction version as 4-byte little-endian.
 * @param num - Version number (typically 1 or 2)
 * @returns Encoded version bytes
 */
export function encode_tx_version(num: number): Buff {
	// Encode the transaction version as a 4-byte little-endian number.
	return Buff.num(num, 4).reverse();
}

/**
 * Encode input txid as 32-byte little-endian.
 * @param txid - Transaction ID (64 hex characters)
 * @returns Encoded txid bytes (reversed for wire format)
 */
export function encode_txin_txid(txid: string): Buff {
	// Encode the transaction ID as a 32-byte little-endian number.
	return Buff.hex(txid, 32).reverse();
}

/**
 * Encode input vout index as 4-byte little-endian.
 * @param vout - Output index being spent
 * @returns Encoded vout bytes
 */
export function encode_txin_vout(vout: number): Buff {
	// Encode the output index as a 4-byte little-endian number.
	return Buff.num(vout, 4).reverse();
}

/**
 * Encode input sequence number as 4-byte little-endian.
 * @param sequence - Sequence number (affects RBF and relative timelocks)
 * @returns Encoded sequence bytes
 */
export function encode_txin_sequence(sequence: number): Buff {
	// Encode the sequence number as a 4-byte little-endian number.
	return Buff.num(sequence, 4).reverse();
}

/**
 * Encode all transaction inputs with varint length prefix.
 * @param vin - Array of transaction inputs
 * @returns Encoded inputs with count prefix
 */
export function encode_tx_inputs(vin: TxInput[]): Buff {
	// Create a buffer for the inputs, starting with the array length.
	const raw: Buff[] = [Buff.create_varint(vin.length, "le")];
	// For each input in the array,
	for (const input of vin) {
		// Encode the input, and add it to the buffer.
		raw.push(encode_vin(input));
	}
	// Return the buffer as a single payload.
	return Buff.join(raw);
}

/**
 * Encode a single transaction input.
 * Handles both coinbase and regular inputs.
 * @param txin - Transaction input
 * @returns Encoded input (txid + vout + scriptSig + sequence)
 */
export function encode_vin(txin: TxInput): Buff {
	// If the input is a coinbase,
	if (txin.coinbase !== null) {
		// Encode and return the coinbase as a single payload.
		return Buff.join([
			encode_txin_txid(COINBASE.TXID),
			encode_txin_vout(COINBASE.VOUT),
			encode_script_data(txin.coinbase),
			encode_txin_sequence(txin.sequence),
		]);
	} else {
		// Encode and return the input as a single payload.
		return Buff.join([
			encode_txin_txid(txin.txid),
			encode_txin_vout(txin.vout),
			encode_script_data(txin.script_sig),
			encode_txin_sequence(txin.sequence),
		]);
	}
}

/**
 * Encode output value as 8-byte little-endian.
 * @param value - Amount in satoshis
 * @returns Encoded value bytes
 */
export function encode_vout_value(value: bigint): Buff {
	// Encode the value as an 8-byte little-endian number.
	return Buff.big(value, 8).reverse();
}

/**
 * Encode all transaction outputs with varint length prefix.
 * @param vout - Array of transaction outputs
 * @returns Encoded outputs with count prefix
 */
export function encode_tx_outputs(vout: TxOutput[]): Buff {
	// Create a buffer for the outputs, starting with the array length.
	const buffer: Buff[] = [Buff.create_varint(vout.length, "le")];
	// For each output in the array,
	for (const output of vout) {
		// Encode the output, and add it to the buffer.
		buffer.push(encode_tx_vout(output));
	}
	// Return the buffer as a single payload.
	return Buff.join(buffer);
}

/**
 * Encode a single transaction output.
 * @param txout - Transaction output
 * @returns Encoded output (value + scriptPubKey)
 */
export function encode_tx_vout(txout: TxOutput): Buff {
	// Get the value and script pubkey from the output.
	const { value, script_pk } = txout;
	// Return the data encoded as a single payload.
	return Buff.join([encode_vout_value(value), encode_script_data(script_pk)]);
}

/**
 * Encode witness data for a single input.
 * @param data - Array of witness elements (hex strings)
 * @returns Encoded witness stack with element count prefix
 */
export function encode_vin_witness(data: string[]): Buff {
	// Create a buffer for the witness data, starting with the array length.
	const buffer: Buff[] = [Buff.create_varint(data.length)];
	// For each parameter in the witness array,
	for (const param of data) {
		// Encode the parameter, and add it to the buffer.
		buffer.push(encode_script_data(param));
	}
	// Return the buffer as a single payload.
	return Buff.join(buffer);
}

/**
 * Encode transaction locktime as 4-byte little-endian.
 * @param locktime - Block height or unix timestamp
 * @returns Encoded locktime bytes
 */
export function encode_tx_locktime(locktime: number): Buff {
	// Encode the locktime as a 4-byte little-endian number.
	return Buff.num(locktime, 4).reverse();
}

/**
 * Encode script data with varint length prefix.
 * @param script - Script hex string, or null for empty script
 * @returns Encoded script with length prefix (or 0x00 for null)
 */
export function encode_script_data(script: string | null): Buff {
	// If the script is not null,
	if (script !== null) {
		// Assert that the script is a hex string.
		Assert.is_hex(script);
		// Encode the script, and add it to the buffer.
		return Buff.hex(script).prefix_varint("le");
	} else {
		// Return a single byte of zero.
		return Buff.hex("00");
	}
}
