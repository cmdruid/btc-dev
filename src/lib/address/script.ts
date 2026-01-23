import type { AddressType, ScriptInfo } from "@/types/index.js";

/**
 * Get the address script.
 *
 * @param script_key  - The script key.
 * @param script_type - The script type.
 * @returns The address script.
 */
export function get_address_script(
	script_key: string,
	script_type: AddressType,
): ScriptInfo {
	switch (script_type) {
		case "p2pkh":
			return get_p2pkh_script(script_key);
		case "p2sh":
			return get_p2sh_script(script_key);
		case "p2wpkh":
			return get_p2w_pkh_script(script_key);
		case "p2wsh":
			return get_p2w_sh_script(script_key);
		case "p2tr":
			return get_p2tr_script(script_key);
		default:
			throw new Error(`unrecognized script type: ${script_type}`);
	}
}

function get_p2pkh_script(script_key: string) {
	return {
		hex: `76a914${script_key}88ac`,
		asm: ["OP_DUP", "OP_HASH160", script_key, "OP_EQUALVERIFY", "OP_CHECKSIG"],
	};
}

function get_p2sh_script(script_key: string) {
	return {
		hex: `a914${script_key}87`,
		asm: ["OP_HASH160", script_key, "OP_EQUAL"],
	};
}

function get_p2w_pkh_script(script_key: string) {
	return {
		hex: `0014${script_key}`,
		asm: ["OP_0", script_key],
	};
}

function get_p2w_sh_script(script_key: string) {
	return {
		hex: `0020${script_key}`,
		asm: ["OP_0", script_key],
	};
}

function get_p2tr_script(script_key: string) {
	return {
		hex: `5120${script_key}`,
		asm: ["OP_1", script_key],
	};
}
