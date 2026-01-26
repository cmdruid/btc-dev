/**
 * Witness utility functions.
 *
 * Helper functions for working with transaction witness data,
 * including size calculation and validation.
 *
 * @module
 */

import { Buff, type Bytes } from "@vbyte/buff";
import { Assert } from "@vbyte/util";

import type { WitnessSize } from "@/types/index.js";

/** Overhead for witness element count varint */
const WIT_LENGTH_BYTE = 1;

/**
 * Calculate the size of witness data.
 *
 * Returns both the total byte size and the virtual size (vsize).
 * Witness data is weighted at 1/4 for virtual size calculation.
 *
 * @param witness - Array of witness stack elements
 * @returns Object with total bytes and virtual size
 *
 * @example
 * ```typescript
 * const size = get_witness_size(['304402...', '02abc...'])
 * // { total: 107, vsize: 28 }
 * ```
 */
export function get_witness_size(witness: Bytes[]): WitnessSize {
	const stack = witness.map((e) => Buff.bytes(e));
	const size = stack.reduce((prev, next) => prev + next.length, 0);
	const vsize = Math.ceil(WIT_LENGTH_BYTE + size / 4);
	return { total: size, vsize };
}

/**
 * Assert that a value is a valid witness array.
 *
 * A valid witness is an array of byte-like elements (hex strings or Uint8Array).
 * Throws if the validation fails.
 *
 * @param witness - Value to validate
 * @throws Error if witness is not an array of bytes
 *
 * @example
 * ```typescript
 * assert_witness(['304402...', '02abc...']) // passes
 * assert_witness('not an array') // throws
 * assert_witness([123]) // throws (numbers not allowed)
 * ```
 */
export function assert_witness(witness: unknown): asserts witness is Bytes[] {
	Assert.ok(Array.isArray(witness), "witness must be an array");
	Assert.ok(
		witness.every((e) => Buff.is_bytes(e)),
		"witness must be an array of strings or bytes",
	);
}
