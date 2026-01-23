import { z } from "zod";
import type { TxOutput, TxOutputTemplate } from "@/types/index.js";
import { hex, hex32, uint } from "./base.js";

const sats = z.bigint().min(0n).max(2_100_000_000_000_000n);

export const tx_output = z.object({
	value: sats,
	script_pk: hex,
}) satisfies z.ZodType<TxOutput>;

export const tx_input = z.object({
	coinbase: hex.nullable(),
	txid: hex32,
	vout: uint,
	prevout: tx_output.nullable(),
	script_sig: hex.nullable(),
	sequence: uint,
	witness: z.array(hex),
});

export const tx_data = z.object({
	version: uint,
	vin: z.array(tx_input),
	vout: z.array(tx_output),
	locktime: uint,
});

export const vout_template = tx_output.extend({
	value: z.union([uint, sats]),
}) satisfies z.ZodType<TxOutputTemplate>;

export const vin_template = tx_input.extend({
	coinbase: hex.nullable().optional(),
	prevout: vout_template.nullable().optional(),
	script_sig: hex.nullable().optional(),
	sequence: z.union([hex, uint]).optional(),
	witness: z.array(hex).optional(),
});

export const tx_template = z.object({
	version: uint.optional(),
	vin: z.array(vin_template),
	vout: z.array(vout_template),
	locktime: uint.optional(),
});
