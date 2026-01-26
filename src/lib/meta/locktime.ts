/**
 * Bitcoin Transaction Locktime Field Manipulation.
 *
 * This module provides functionality for encoding and decoding the locktime field
 * in Bitcoin transactions. The locktime field is a 32-bit integer that specifies:
 *
 * - Values < 500,000,000: Block height at which the transaction becomes valid
 * - Values >= 500,000,000: Unix timestamp at which the transaction becomes valid
 *
 * The implementation follows BIP-65 (CHECKLOCKTIMEVERIFY) semantics.
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki
 * @module
 */

import { Assert } from "@vbyte/util";

import { ConfigError } from "@/error.js";
import type { LocktimeData } from "@/types/index.js";

/** The threshold between block height and timestamp (500,000,000). */
const LOCKTIME_THRESHOLD = 500000000;

export namespace LocktimeField {
	export const encode = encode_locktime;
	export const decode = decode_locktime;
}

/**
 * Encode locktime data into a numeric locktime value.
 *
 * Converts a locktime configuration into the 32-bit locktime field value.
 * For heightlock, the value is the block height directly.
 * For timelock, the value is the Unix timestamp.
 *
 * @param locktime - The locktime configuration to encode
 * @returns The 32-bit locktime value
 * @throws Error if the locktime type or value is invalid
 *
 * @example
 * ```typescript
 * // Height-based locktime (block 800000)
 * encode_locktime({ type: 'heightlock', height: 800000 })
 * // 800000
 *
 * // Time-based locktime (Jan 1, 2024)
 * encode_locktime({ type: 'timelock', stamp: 1704067200 })
 * // 1704067200
 * ```
 */
export function encode_locktime(locktime: LocktimeData): number {
	switch (locktime.type) {
		case "timelock":
			Assert.ok(locktime.stamp >= LOCKTIME_THRESHOLD, "Invalid timestamp");
			return locktime.stamp;
		case "heightlock":
			Assert.ok(locktime.height > 0, "height must be greater than 0");
			Assert.ok(locktime.height < LOCKTIME_THRESHOLD, "invalid block height");
			return locktime.height;
		default:
			throw new ConfigError(`Invalid locktime type: expected 'timelock' or 'heightlock'`);
	}
}

/**
 * Decode a locktime value into a locktime data object.
 *
 * According to BIP-65, values below 500,000,000 are interpreted as block heights,
 * while values at or above this threshold are interpreted as Unix timestamps.
 *
 * @param locktime - The 32-bit locktime value to decode
 * @returns Decoded locktime data, or null if the value is invalid (NaN or <= 0)
 *
 * @example
 * ```typescript
 * // Decode block height locktime
 * decode_locktime(800000)
 * // { type: 'heightlock', height: 800000 }
 *
 * // Decode timestamp locktime
 * decode_locktime(1704067200)
 * // { type: 'timelock', stamp: 1704067200 }
 *
 * // Invalid locktime
 * decode_locktime(0)
 * // null
 * ```
 */
export function decode_locktime(locktime: number): LocktimeData | null {
	// Check if the value is valid (non-negative)
	if (Number.isNaN(locktime) || locktime <= 0) {
		return null;
	}
	// Return the appropriate locktime type.
	if (locktime < LOCKTIME_THRESHOLD) {
		return {
			type: "heightlock",
			height: locktime,
		};
	} else {
		return {
			type: "timelock",
			stamp: locktime,
		};
	}
}
