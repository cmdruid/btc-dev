/**
 * Custom error classes for @vbyte/btc-dev
 *
 * These errors provide more specific error types for better error handling:
 * - ValidationError: Invalid input format, out of range values, etc.
 * - DecodingError: Malformed data during decode/parse operations
 * - ConfigError: Invalid configuration (unknown network, missing config, etc.)
 *
 * @example
 * ```typescript
 * import { ValidationError, DecodingError } from '@vbyte/btc-dev/error'
 *
 * try {
 *   const tx = TX.decode(malformedData)
 * } catch (err) {
 *   if (err instanceof DecodingError) {
 *     console.log('Malformed data at position:', err.position)
 *   }
 * }
 * ```
 */

/**
 * Thrown when input validation fails.
 *
 * Common scenarios:
 * - Invalid format (wrong length, bad encoding)
 * - Out of range values
 * - Missing required fields
 * - Type mismatches
 *
 * @example
 * ```typescript
 * throw new ValidationError('Public key must be 33 bytes', 'pubkey')
 * ```
 */
export class ValidationError extends Error {
	/** The field or parameter that failed validation */
	field?: string;

	constructor(message: string, field?: string) {
		super(message);
		this.name = "ValidationError";
		this.field = field;
	}
}

/**
 * Thrown when decoding or parsing malformed data fails.
 *
 * Common scenarios:
 * - Truncated data (unexpected end of stream)
 * - Invalid opcodes in scripts
 * - Malformed transaction structure
 * - Invalid witness data
 *
 * @example
 * ```typescript
 * throw new DecodingError('Unexpected end of stream', 42)
 * ```
 */
export class DecodingError extends Error {
	/** Byte position where the error occurred */
	position?: number;

	constructor(message: string, position?: number) {
		super(message);
		this.name = "DecodingError";
		this.position = position;
	}
}

/**
 * Thrown when configuration is invalid.
 *
 * Common scenarios:
 * - Unknown network type
 * - Invalid sighash type
 * - Missing required configuration options
 * - Incompatible option combinations
 *
 * @example
 * ```typescript
 * throw new ConfigError('Unknown network: foonet')
 * ```
 */
export class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConfigError";
	}
}
