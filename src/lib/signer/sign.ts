import { Buff } from "@vbyte/buff";
import { ECC } from "@vbyte/crypto";
import { SIGHASH_DEFAULT, SIGHASH_SEGWIT, SIGHASH_TAPROOT } from "@/const.js";
import { ConfigError, ValidationError } from "@/error.js";
import { hash_segwit_tx } from "@/lib/sighash/segwit.js";
import { hash_taproot_tx } from "@/lib/sighash/taproot.js";
import { parse_tx } from "@/lib/tx/parse.js";

import type { SigHashOptions, TxData } from "@/types/index.js";

/**
 * Regex pattern for valid 32-byte hex string (64 hex characters).
 * Used for secret key validation.
 */
const SECKEY_REGEX = /^[0-9a-fA-F]{64}$/;

/**
 * Validate a secret key format.
 * @param seckey - The secret key to validate
 * @throws {ValidationError} If the secret key is invalid
 */
function validate_seckey(seckey: string): void {
	if (typeof seckey !== "string") {
		throw new ValidationError("Secret key must be a string", "seckey");
	}
	if (!SECKEY_REGEX.test(seckey)) {
		throw new ValidationError(
			"Invalid secret key format: expected 32-byte hex string (64 characters)",
			"seckey",
		);
	}
}

/**
 * Validate sighash options.
 * @param options - The sighash options to validate
 * @param validFlags - Array of valid sighash flags
 * @throws {ValidationError} If txindex is invalid
 * @throws {ConfigError} If sigflag is invalid
 */
function validate_sighash_options(
	options: SigHashOptions,
	validFlags: number[],
): void {
	const { sigflag, txindex } = options;

	if (sigflag !== undefined) {
		if (typeof sigflag !== "number" || !Number.isInteger(sigflag)) {
			throw new ConfigError("sigflag must be an integer");
		}
		// Normalize sigflag for validation (remove ANYONECANPAY bit)
		const normalizedFlag = sigflag & 0x7f;
		const isAnypay = (sigflag & 0x80) === 0x80;
		const baseFlag = isAnypay ? normalizedFlag | 0x80 : normalizedFlag;

		if (
			!validFlags.includes(baseFlag) &&
			!validFlags.includes(normalizedFlag)
		) {
			throw new ConfigError(`Invalid sigflag: ${sigflag}`);
		}
	}

	if (txindex !== undefined) {
		if (
			typeof txindex !== "number" ||
			!Number.isInteger(txindex) ||
			txindex < 0
		) {
			throw new ValidationError(
				"txindex must be a non-negative integer",
				"txindex",
			);
		}
	}
}

/**
 * Sign a transaction input using segwit (BIP143) signature hashing.
 * @param seckey  - 32-byte secret key as hex string (64 characters)
 * @param txdata  - Transaction data
 * @param options - Sighash options including txindex, sigflag, pubkey/script
 * @returns ECDSA signature with sighash flag appended
 * @throws {ValidationError} If secret key format is invalid
 * @throws {ConfigError} If sigflag is invalid
 */
export function sign_segwit_tx(
	seckey: string,
	txdata: TxData,
	options: SigHashOptions,
) {
	validate_seckey(seckey);
	validate_sighash_options(options, SIGHASH_SEGWIT);

	const tx = parse_tx(txdata);
	const msg = hash_segwit_tx(tx, options);
	const sig = ECC.sign_ecdsa(seckey, msg).hex;
	const flag = format_sigflag(options.sigflag ?? SIGHASH_DEFAULT);
	return sig + flag;
}

/**
 * Sign a transaction input using taproot (BIP341) signature hashing.
 * @param seckey  - 32-byte secret key as hex string (64 characters)
 * @param txdata  - Transaction data
 * @param options - Sighash options including txindex, sigflag, extension
 * @returns Schnorr signature with optional sighash flag appended
 * @throws {ValidationError} If secret key format is invalid
 * @throws {ConfigError} If sigflag is invalid
 */
export function sign_taproot_tx(
	seckey: string,
	txdata: TxData,
	options: SigHashOptions,
) {
	validate_seckey(seckey);
	validate_sighash_options(options, SIGHASH_TAPROOT);

	const tx = parse_tx(txdata);
	const msg = hash_taproot_tx(tx, options);
	const sig = ECC.sign_bip340(seckey, msg).hex;
	const flag = format_sigflag(options.sigflag ?? 0);
	return sig + flag;
}

function format_sigflag(flag: number) {
	return flag !== 0 ? Buff.num(flag, 1).hex : "";
}
