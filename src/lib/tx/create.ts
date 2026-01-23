import { Assert } from "@vbyte/micro-lib";
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

export function create_spend_input(config: TxInputTemplate): TxSpendInput {
	assert_vin_template(config);
	Assert.exists(config.prevout, "prevout is required");
	const { txid, vout, script_sig = null, witness = [] } = config;
	const prevout = normalize_prevout(config.prevout);
	const sequence = normalize_sequence(config.sequence);
	return { txid, vout, coinbase: null, prevout, script_sig, sequence, witness };
}

export function create_tx_input(config: TxInputTemplate): TxInput {
	if (config.coinbase) return create_coinbase_input(config);
	if (config.prevout) return create_spend_input(config);
	return create_virtual_input(config);
}

export function create_tx_output(config: TxOutputTemplate): TxOutput {
	assert_vout_template(config);
	const script_pk = config.script_pk;
	const value = normalize_value(config.value);
	return { script_pk, value };
}

export function create_tx(config?: Partial<TxTemplate>): TxData {
	assert_tx_template(config);
	const { vin = [], vout = [] } = config ?? { vin: [], vout: [] };
	const locktime = config.locktime ?? DEFAULT.LOCKTIME;
	const version = config.version ?? DEFAULT.VERSION;
	const inputs = vin.map((txin) => create_tx_input(txin));
	const outputs = vout.map((txout) => create_tx_output(txout));
	return { locktime, vin: inputs, vout: outputs, version };
}
