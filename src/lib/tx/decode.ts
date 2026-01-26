/**
 * Transaction decoding utilities.
 *
 * Functions for decoding raw transaction bytes into structured data.
 * Handles both legacy and SegWit transaction formats.
 *
 * @module
 */

import { Stream } from "@vbyte/buff";
import { Assert } from "@vbyte/util";
import { COINBASE, MAX_VARINT_SIZE } from "@/const.js";
import { DecodingError } from "@/error.js";

import type {
	TxCoinbaseInput,
	TxDecodedData,
	TxInput,
	TxOutput,
	TxVirtualInput,
} from "@/types/index.js";

/** Maximum transaction size in bytes (4MB, Bitcoin consensus limit) */
const MAX_TX_SIZE = 4_000_000;

/** Maximum number of inputs/outputs per transaction */
const MAX_TX_ELEMENTS = 100_000;

/**
 * Decode raw transaction bytes into structured data.
 *
 * Parses a raw Bitcoin transaction (hex or bytes) and returns
 * a TxDecodedData object containing version, inputs, outputs,
 * witness data, and locktime.
 *
 * @param txdata - Raw transaction as hex string or Uint8Array
 * @param use_segwit - Parse witness data if present (default: true)
 * @returns Decoded transaction data
 * @throws {DecodingError} If transaction is malformed or exceeds limits
 *
 * @example
 * ```typescript
 * const tx = decode_tx('0200000001...')
 * console.log(tx.version) // 2
 * console.log(tx.vin.length) // Number of inputs
 * ```
 */
export function decode_tx(
	txdata: string | Uint8Array,
	use_segwit = true,
): TxDecodedData {
	// Assert the txdata is a bytes object.
	Assert.ok(
		typeof txdata === "string" || txdata instanceof Uint8Array,
		"txdata must be hex or bytes",
	);

	// Check transaction size limit
	const txSize = typeof txdata === "string" ? txdata.length / 2 : txdata.length;
	if (txSize > MAX_TX_SIZE) {
		throw new DecodingError(
			`Transaction size ${txSize} exceeds maximum ${MAX_TX_SIZE} bytes`,
		);
	}

	// Setup a byte-stream.
	const stream = new Stream(txdata);
	// Parse tx version.
	const version = read_version(stream);
	// Check and enable any flags that are set.
	let has_witness = check_witness_flag(stream);
	// If use_segwit is false, set has_witness to false.
	has_witness = use_segwit ? has_witness : false;
	// Parse our inputs and outputs.
	const vin = read_inputs(stream);
	const vout = read_outputs(stream);
	// If witness flag is set, parse witness data.
	if (has_witness) {
		for (const txin of vin) {
			txin.witness = read_witness(stream);
		}
	}
	// Parse locktime.
	const locktime = read_locktime(stream);
	// Return transaction object with calculated fields.
	return { version, vin, vout, locktime };
}

function read_version(stream: Stream): number {
	return stream.read(4).reverse().to_num();
}

function check_witness_flag(stream: Stream): boolean {
	const [marker, flag]: number[] = [...stream.peek(2)];
	if (marker === 0) {
		stream.read(2);
		if (flag === 1) {
			return true;
		} else {
			throw new DecodingError(`Invalid witness flag: ${flag}`, 1);
		}
	}
	return false;
}

function read_inputs(stream: Stream): TxInput[] {
	const inputs = [];
	const vinCount = stream.read_varint();
	if (vinCount > MAX_TX_ELEMENTS) {
		throw new DecodingError(
			`Input count ${vinCount} exceeds maximum ${MAX_TX_ELEMENTS}`,
		);
	}
	for (let i = 0; i < vinCount; i++) {
		const txinput = read_vin(stream);
		inputs.push(txinput);
	}
	return inputs;
}

function read_vin(stream: Stream): TxInput {
	const txid = stream.read(32).reverse().hex;
	const vout = stream.read(4).reverse().num;
	const script_sig = read_payload(stream);
	const sequence = stream.read(4).reverse().num;
	const witness: string[] = [];
	if (txid === COINBASE.TXID && vout === COINBASE.VOUT) {
		return {
			coinbase: script_sig,
			prevout: null,
			script_sig: null,
			sequence,
			txid,
			vout,
			witness,
		} as TxCoinbaseInput;
	} else {
		return {
			coinbase: null,
			prevout: null,
			script_sig,
			sequence,
			txid,
			vout,
			witness,
		} as TxVirtualInput;
	}
}

function read_outputs(stream: Stream): TxOutput[] {
	const outputs = [];
	const vcount = stream.read_varint();
	if (vcount > MAX_TX_ELEMENTS) {
		throw new DecodingError(
			`Output count ${vcount} exceeds maximum ${MAX_TX_ELEMENTS}`,
		);
	}
	for (let i = 0; i < vcount; i++) {
		try {
			outputs.push(read_vout(stream));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new DecodingError(`Failed to decode output at index ${i}: ${message}`);
		}
	}
	return outputs;
}

function read_vout(stream: Stream): TxOutput {
	const value = stream.read(8).reverse().big;
	const script_pk = read_payload(stream);
	Assert.exists(script_pk, "failed to decode script_pk");
	return { value, script_pk };
}

function read_witness(stream: Stream): string[] {
	const stack = [];
	const count = stream.read_varint();
	if (count > MAX_TX_ELEMENTS) {
		throw new DecodingError(
			`Witness element count ${count} exceeds maximum ${MAX_TX_ELEMENTS}`,
		);
	}
	for (let i = 0; i < count; i++) {
		const element = read_payload(stream);
		if (element === null) {
			throw new DecodingError(`Failed to decode witness element at index ${i}`);
		}
		stack.push(element);
	}
	return stack;
}

export function read_payload(stream: Stream): string | null {
	const size = stream.read_varint("le");
	if (size > MAX_VARINT_SIZE) {
		throw new DecodingError(
			`Payload size ${size} exceeds maximum ${MAX_VARINT_SIZE}`,
		);
	}
	return size > 0 ? stream.read(size).hex : null;
}

function read_locktime(stream: Stream): number {
	return stream.read(4).reverse().to_num();
}
