import * as Schema from "@/schema/index.js";
import { ValidationError } from "@/error.js";
import type { ZodError } from "zod";

import type {
	TxData,
	TxInput,
	TxInputTemplate,
	TxOutput,
	TxOutputTemplate,
	TxSpendData,
	TxSpendInput,
	TxTemplate,
} from "@/types/index.js";

/**
 * Format a Zod error into a user-friendly message.
 * @internal
 */
function format_zod_error(error: ZodError): string {
	const issues = error.issues.map((issue) => {
		const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
		return `${path}${issue.message}`;
	});
	return issues.join("; ");
}

export function assert_tx_template(
	txdata: unknown,
): asserts txdata is TxTemplate {
	const result = Schema.tx.tx_template.safeParse(txdata);
	if (!result.success) {
		throw new ValidationError(`invalid transaction template: ${format_zod_error(result.error)}`);
	}
}

export function assert_has_prevouts(
	vin: TxInput[],
): asserts vin is TxSpendInput[] {
	const missingIdx = vin.findIndex((txin) => txin.prevout === null || txin.prevout === undefined);
	if (missingIdx !== -1) {
		throw new ValidationError(
			`transaction input at index ${missingIdx} is missing prevout data. ` +
			`Prevout (previous output) is required for signing`
		);
	}
}

export function assert_tx_data(txdata: unknown): asserts txdata is TxData {
	const result = Schema.tx.tx_data.safeParse(txdata);
	if (!result.success) {
		throw new ValidationError(`invalid transaction data: ${format_zod_error(result.error)}`);
	}
}

export function assert_tx_spend_data(
	txdata: unknown,
): asserts txdata is TxSpendData {
	// Assert the txdata is a valid tx data object.
	assert_tx_data(txdata);
	// Assert the txdata has prevouts.
	assert_has_prevouts(txdata.vin);
}

export function assert_tx_input(
	tx_input: unknown,
): asserts tx_input is TxInput {
	const result = Schema.tx.tx_input.safeParse(tx_input);
	if (!result.success) {
		throw new ValidationError(`invalid transaction input: ${format_zod_error(result.error)}`);
	}
}

export function assert_tx_output(
	tx_output: unknown,
): asserts tx_output is TxOutput {
	const result = Schema.tx.tx_output.safeParse(tx_output);
	if (!result.success) {
		throw new ValidationError(`invalid transaction output: ${format_zod_error(result.error)}`);
	}
}

export function assert_vin_template(
	vin: unknown,
): asserts vin is TxInputTemplate {
	const result = Schema.tx.vin_template.safeParse(vin);
	if (!result.success) {
		throw new ValidationError(`invalid input template: ${format_zod_error(result.error)}`);
	}
}

export function assert_vout_template(
	vout: unknown,
): asserts vout is TxOutputTemplate {
	const result = Schema.tx.vout_template.safeParse(vout);
	if (!result.success) {
		throw new ValidationError(`invalid output template: ${format_zod_error(result.error)}`);
	}
}
