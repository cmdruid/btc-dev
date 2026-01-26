import { Buff, type Bytes } from "@vbyte/buff";
import { ECC } from "@vbyte/crypto";
import { hash160 } from "@vbyte/crypto/hash";
import { hash_segwit_tx } from "@/lib/sighash/segwit.js";
import { hash_taproot_tx } from "@/lib/sighash/taproot.js";
import { verify_taproot } from "@/lib/taproot/cblock.js";
import { encode_tapscript } from "@/lib/taproot/encode.js";
import { parse_tx } from "@/lib/tx/index.js";
import { parse_witness } from "@/lib/witness/parse.js";

import type {
	SigHashOptions,
	TxData,
	TxInput,
	WitnessData,
} from "@/types/index.js";

export interface VerifyOptions extends SigHashOptions {
	/** Throw an error on verification failure (default: false) */
	throws?: boolean;
}

export interface VerifyResult {
	/** Whether all signatures are valid */
	valid: boolean;
	/** Per-input verification results */
	inputs: InputVerifyResult[];
	/** Error message if verification failed */
	error?: string;
}

export interface InputVerifyResult {
	/** Input index */
	index: number;
	/** Whether the signature is valid */
	valid: boolean;
	/** Spend type detected */
	type?: string | null;
	/** Error message if verification failed */
	error?: string;
}

/**
 * Verify all signatures in a transaction.
 * @param txdata  - Transaction data (hex, bytes, or TxData object)
 * @param options - Verification options
 * @returns Verification result with per-input details
 */
export function verify_tx(
	txdata: TxData | Bytes,
	options: VerifyOptions = {},
): VerifyResult {
	const { throws = false } = options;

	const tx = parse_tx(txdata);
	const inputs: InputVerifyResult[] = [];
	let allValid = true;

	for (let i = 0; i < tx.vin.length; i++) {
		const vin = tx.vin[i];

		// Skip coinbase inputs
		if (vin.coinbase !== null) {
			inputs.push({ index: i, valid: true, type: "coinbase" });
			continue;
		}

		const result = verify_input(tx, vin, i, options);
		inputs.push(result);

		if (!result.valid) {
			allValid = false;
			if (throws) {
				throw new Error(`Input ${i} verification failed: ${result.error}`);
			}
		}
	}

	return {
		valid: allValid,
		inputs,
		error: allValid ? undefined : "One or more inputs failed verification",
	};
}

/**
 * Verify a single input signature.
 */
function verify_input(
	tx: TxData,
	vin: TxInput,
	index: number,
	options: VerifyOptions,
): InputVerifyResult {
	try {
		const { witness = [] } = vin;

		// No witness means no signature to verify
		if (witness.length === 0) {
			return { index, valid: true, type: null };
		}

		// Parse the witness data
		const witnessData = parse_witness(witness.map((e) => Buff.hex(e)));
		const { type, version } = witnessData;

		// No recognizable type means we can't verify
		if (type === null || version === null) {
			return { index, valid: false, type, error: "Unknown witness type" };
		}

		// Get the prevout script
		const prevout = vin.prevout;
		if (prevout === null || prevout === undefined) {
			return { index, valid: false, type, error: "Missing prevout data" };
		}

		// Dispatch to the appropriate verification method
		if (version === 0) {
			return verify_segwit_input(tx, vin, index, witnessData, options);
		} else if (version === 1) {
			return verify_taproot_input(tx, vin, index, witnessData, options);
		}

		return {
			index,
			valid: false,
			type,
			error: `Unsupported witness version: ${version}`,
		};
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		return { index, valid: false, error };
	}
}

/**
 * Verify a segwit (v0) input signature using ECDSA.
 */
function verify_segwit_input(
	tx: TxData,
	vin: TxInput,
	index: number,
	witnessData: WitnessData,
	options: VerifyOptions,
): InputVerifyResult {
	const { type, params, script } = witnessData;

	if (params.length < 1) {
		return { index, valid: false, type, error: "Missing signature in witness" };
	}

	// Extract signature and sighash flag
	const sigHex = params[0];
	const { signature, sigflag } = parse_ecdsa_signature(sigHex);

	// Get pubkey and script for hash calculation
	let pubkey: string;
	let hashScript: string;

	if (type === "p2wpkh") {
		// P2WPKH: pubkey is second witness element
		if (params.length < 2) {
			return {
				index,
				valid: false,
				type,
				error: "Missing pubkey in P2WPKH witness",
			};
		}
		pubkey = params[1];

		// P2WPKH script is derived from pubkey hash
		const pkh = hash160(pubkey).hex;
		hashScript = `76a914${pkh}88ac`;
	} else if (type === "p2wsh") {
		// P2WSH: script is witness script, need to find pubkey in params
		if (script === null) {
			return {
				index,
				valid: false,
				type,
				error: "Missing script in P2WSH witness",
			};
		}
		hashScript = script;

		// For P2WSH, we need to extract the pubkey from the script or params
		// This is a simplified approach - in practice the pubkey needs to be specified
		if (params.length >= 2) {
			pubkey = params[1];
		} else {
			return {
				index,
				valid: false,
				type,
				error: "Missing pubkey in P2WSH witness",
			};
		}
	} else {
		return {
			index,
			valid: false,
			type,
			error: `Unexpected segwit type: ${type}`,
		};
	}

	// Calculate the sighash
	const sighashOptions: SigHashOptions = {
		...options,
		txindex: index,
		txinput: vin,
		pubkey: type === "p2wpkh" ? pubkey : undefined,
		script: type === "p2wsh" ? hashScript : undefined,
		sigflag,
	};

	const hash = hash_segwit_tx(tx, sighashOptions);

	// Verify the ECDSA signature
	const isValid = ECC.verify_ecdsa(signature, hash, pubkey);

	return {
		index,
		valid: isValid,
		type,
		error: isValid ? undefined : "Invalid ECDSA signature",
	};
}

/**
 * Verify a taproot (v1) input signature using Schnorr.
 */
function verify_taproot_input(
	tx: TxData,
	vin: TxInput,
	index: number,
	witnessData: WitnessData,
	options: VerifyOptions,
): InputVerifyResult {
	const { type, params, script, cblock } = witnessData;

	if (vin.prevout == null) {
		return {
			index,
			valid: false,
			type,
			error: "Missing prevout for taproot verification",
		};
	}
	const prevout = vin.prevout;

	if (params.length < 1) {
		return { index, valid: false, type, error: "Missing signature in witness" };
	}

	// Extract signature and sighash flag
	const sigHex = params[0];
	const { signature, sigflag } = parse_schnorr_signature(sigHex);

	// Get the tapkey from the prevout script (remove 5120 prefix)
	const tapkey = prevout.script_pk.slice(4);

	let pubkey: string;
	let extension: string | undefined;

	if (type === "p2tr") {
		// Key-path spend: pubkey is the tapkey
		pubkey = tapkey;
	} else if (type === "p2ts") {
		// Script-path spend: verify control block and get internal key
		if (cblock === null || script === null) {
			return {
				index,
				valid: false,
				type,
				error: "Missing cblock or script in script-path spend",
			};
		}

		// Verify the control block path
		const target = encode_tapscript(script).hex;
		const pathValid = verify_taproot(tapkey, target, cblock);

		if (!pathValid) {
			return {
				index,
				valid: false,
				type,
				error: "Control block verification failed",
			};
		}

		// For script-path, we need a pubkey from the script or additional witness elements
		// The pubkey for signing is usually in the additional params
		if (params.length >= 2 && params[1].length === 64) {
			pubkey = params[1];
		} else {
			// Fallback to tapkey for verification
			pubkey = tapkey;
		}

		// Set the extension (tapleaf hash)
		extension = target;
	} else {
		return {
			index,
			valid: false,
			type,
			error: `Unexpected taproot type: ${type}`,
		};
	}

	// Calculate the sighash
	const sighashOptions: SigHashOptions = {
		...options,
		txindex: index,
		txinput: vin,
		sigflag,
		extension: extension,
		script: type === "p2ts" ? (script ?? undefined) : undefined,
	};

	const hash = hash_taproot_tx(tx, sighashOptions);

	// Verify the Schnorr signature
	const isValid = ECC.verify_bip340(signature, hash, pubkey);

	return {
		index,
		valid: isValid,
		type,
		error: isValid ? undefined : "Invalid Schnorr signature",
	};
}

/**
 * Parse an ECDSA DER-encoded signature and extract sighash flag.
 */
function parse_ecdsa_signature(sigHex: string): {
	signature: string;
	sigflag: number;
} {
	// ECDSA sigs are DER-encoded, last byte is sighash flag
	const sigBytes = Buff.hex(sigHex);
	const sigflag = sigBytes.at(-1) ?? 0x01;
	const signature = sigBytes.slice(0, -1).hex;
	return { signature, sigflag };
}

/**
 * Parse a Schnorr signature and extract sighash flag.
 */
function parse_schnorr_signature(sigHex: string): {
	signature: string;
	sigflag: number;
} {
	// Schnorr sigs are 64 bytes, optional sighash byte appended
	const sigBytes = Buff.hex(sigHex);

	if (sigBytes.length === 64) {
		// No sighash appended, default to SIGHASH_DEFAULT (0x00)
		return { signature: sigHex, sigflag: 0x00 };
	} else if (sigBytes.length === 65) {
		// Sighash byte appended
		const sigflag = sigBytes.at(-1) ?? 0x00;
		if (sigflag === 0x00) {
			throw new Error("0x00 is not a valid appended sigflag");
		}
		const signature = sigBytes.slice(0, 64).hex;
		return { signature, sigflag };
	}

	throw new Error(`Invalid Schnorr signature length: ${sigBytes.length}`);
}
