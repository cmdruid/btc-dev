/**
 * Transaction creation utilities.
 *
 * Functions for creating transaction inputs, outputs, and complete transactions
 * from template objects. Handles coinbase, virtual (unsigned), and spend inputs.
 *
 * @module
 */

import { Assert } from "@vbyte/util";
import { COINBASE, DEFAULT } from "@/const.js";
import type {
	TxCoinbaseInput,
	TxData,
	TxInput,
	TxInputTemplate,
	TxOutput,
	TxOutputTemplate,
	TxSpendInput,
	TxTemplate,
	TxVirtualInput,
} from "@/types/index.js";
import {
	normalize_prevout,
	normalize_sequence,
	normalize_value,
} from "./util.js";
import {
	assert_tx_template,
	assert_vin_template,
	assert_vout_template,
} from "./validate.js";

/**
 * Create a coinbase input for a block reward transaction.
 *
 * Coinbase inputs have a special txid (all zeros) and vout (0xFFFFFFFF).
 * The coinbase field contains arbitrary data (block height, miner message, etc.).
 *
 * @param config - Input template with coinbase data
 * @returns Coinbase input object
 * @throws {Error} If coinbase field is missing
 *
 * @example
 * ```typescript
 * const input = create_coinbase_input({
 *   coinbase: '03a1b2c3', // Block height + extra nonce
 *   witness: ['0000...'] // Witness commitment
 * })
 * ```
 */
export function create_coinbase_input(
	config: TxInputTemplate,
): TxCoinbaseInput {
	assert_vin_template(config);
	Assert.exists(config.coinbase, "coinbase is required");
	const txid = COINBASE.TXID;
	const vout = COINBASE.VOUT;
	const coinbase = config.coinbase;
	const witness = config.witness ?? [];
	const sequence = normalize_sequence(config.sequence);
	return {
		coinbase,
		prevout: null,
		script_sig: null,
		sequence,
		witness,
		txid,
		vout,
	};
}

/**
 * Create a virtual (unsigned) input without prevout data.
 *
 * Virtual inputs reference an output but don't include prevout value/script.
 * Used for building unsigned transactions before prevout data is available.
 *
 * @param config - Input template with txid and vout
 * @returns Virtual input object
 * @throws {Error} If coinbase or prevout fields are provided
 *
 * @example
 * ```typescript
 * const input = create_virtual_input({
 *   txid: 'abc123...',
 *   vout: 0,
 *   sequence: 0xfffffffe
 * })
 * ```
 */
export function create_virtual_input(config: TxInputTemplate): TxVirtualInput {
	assert_vin_template(config);
	Assert.is_empty(config.coinbase, "coinbase is not allowed");
	Assert.is_empty(config.prevout, "prevout is not allowed");
	const { txid, vout, script_sig = null, witness = [] } = config;
	const sequence = normalize_sequence(config.sequence);
	return {
		txid,
		vout,
		coinbase: null,
		prevout: null,
		script_sig,
		sequence,
		witness,
	};
}

/**
 * Create a spend input with full prevout data.
 *
 * Spend inputs include the prevout value and scriptPubKey, which are
 * required for signature hash calculation.
 *
 * @param config - Input template with txid, vout, and prevout data
 * @returns Spend input object with prevout
 * @throws {Error} If prevout field is missing
 *
 * @example
 * ```typescript
 * const input = create_spend_input({
 *   txid: 'abc123...',
 *   vout: 0,
 *   prevout: { value: 100000n, script_pk: '0014...' },
 *   witness: ['signature', 'pubkey']
 * })
 * ```
 */
export function create_spend_input(config: TxInputTemplate): TxSpendInput {
	assert_vin_template(config);
	Assert.exists(config.prevout, "prevout is required");
	const { txid, vout, script_sig = null, witness = [] } = config;
	const prevout = normalize_prevout(config.prevout);
	const sequence = normalize_sequence(config.sequence);
	return { txid, vout, coinbase: null, prevout, script_sig, sequence, witness };
}

/**
 * Create a transaction input from a template.
 *
 * Automatically detects the input type based on fields present:
 * - If coinbase is set: creates coinbase input
 * - If prevout is set: creates spend input with prevout data
 * - Otherwise: creates virtual input (no prevout)
 *
 * @param config - Input template
 * @returns Transaction input of appropriate type
 */
export function create_tx_input(config: TxInputTemplate): TxInput {
	if (config.coinbase) return create_coinbase_input(config);
	if (config.prevout) return create_spend_input(config);
	return create_virtual_input(config);
}

/**
 * Create a transaction output from a template.
 *
 * @param config - Output template with value and scriptPubKey
 * @returns Transaction output object
 *
 * @example
 * ```typescript
 * const output = create_tx_output({
 *   value: 50000n, // satoshis
 *   script_pk: '0014abc123...' // P2WPKH scriptPubKey
 * })
 * ```
 */
export function create_tx_output(config: TxOutputTemplate): TxOutput {
	assert_vout_template(config);
	const script_pk = config.script_pk;
	const value = normalize_value(config.value);
	return { script_pk, value };
}

/**
 * Create a complete transaction from a template.
 *
 * @param config - Transaction template with vin, vout, version, locktime
 * @returns Complete transaction data object
 *
 * @example
 * ```typescript
 * const tx = create_tx({
 *   version: 2,
 *   locktime: 0,
 *   vin: [{
 *     txid: 'abc123...',
 *     vout: 0,
 *     prevout: { value: 100000n, script_pk: '0014...' }
 *   }],
 *   vout: [{
 *     value: 50000n,
 *     script_pk: '0014...'
 *   }]
 * })
 * ```
 */
export function create_tx(config?: Partial<TxTemplate>): TxData {
	assert_tx_template(config);
	const { vin = [], vout = [] } = config ?? { vin: [], vout: [] };
	const locktime = config.locktime ?? DEFAULT.LOCKTIME;
	const version = config.version ?? DEFAULT.VERSION;
	const inputs = vin.map((txin) => create_tx_input(txin));
	const outputs = vout.map((txout) => create_tx_output(txout));
	return { locktime, vin: inputs, vout: outputs, version };
}
