export const OPCODE_MAP = {
	OP_0: 0x00,
	OP_PUSHDATA1: 0x4c,
	OP_PUSHDATA2: 0x4d,
	OP_PUSHDATA4: 0x4e,
	OP_1NEGATE: 0x4f,
	OP_SUCCESS80: 0x50,
	OP_1: 0x51,
	OP_2: 0x52,
	OP_3: 0x53,
	OP_4: 0x54,
	OP_5: 0x55,
	OP_6: 0x56,
	OP_7: 0x57,
	OP_8: 0x58,
	OP_9: 0x59,
	OP_10: 0x5a,
	OP_11: 0x5b,
	OP_12: 0x5c,
	OP_13: 0x5d,
	OP_14: 0x5e,
	OP_15: 0x5f,
	OP_16: 0x60,
	OP_NOP: 0x61,
	OP_SUCCESS98: 0x62,
	OP_IF: 0x63,
	OP_NOTIF: 0x64,
	OP_ELSE: 0x67,
	OP_ENDIF: 0x68,
	OP_VERIFY: 0x69,
	OP_RETURN: 0x6a,
	OP_TOALTSTACK: 0x6b,
	OP_FROMALTSTACK: 0x6c,
	OP_2DROP: 0x6d,
	OP_2DUP: 0x6e,
	OP_3DUP: 0x6f,
	OP_2OVER: 0x70,
	OP_2ROT: 0x71,
	OP_2SWAP: 0x72,
	OP_IFDUP: 0x73,
	OP_DEPTH: 0x74,
	OP_DROP: 0x75,
	OP_DUP: 0x76,
	OP_NIP: 0x77,
	OP_OVER: 0x78,
	OP_PICK: 0x79,
	OP_ROLL: 0x7a,
	OP_ROT: 0x7b,
	OP_SWAP: 0x7c,
	OP_TUCK: 0x7d,
	OP_SUCCESS126: 0x7e,
	OP_SUCCESS127: 0x7f,
	OP_SUCCESS128: 0x80,
	OP_SUCCESS129: 0x81,
	OP_SIZE: 0x82,
	OP_SUCCESS131: 0x83,
	OP_SUCCESS132: 0x84,
	OP_SUCCESS133: 0x85,
	OP_SUCCESS134: 0x86,
	OP_EQUAL: 0x87,
	OP_EQUALVERIFY: 0x88,
	OP_SUCCESS137: 0x89,
	OP_SUCCESS138: 0x8a,
	OP_1ADD: 0x8b,
	OP_1SUB: 0x8c,
	OP_SUCCESS141: 0x8d,
	OP_SUCCESS142: 0x8e,
	OP_NEGATE: 0x8f,
	OP_ABS: 0x90,
	OP_NOT: 0x91,
	OP_0NOTEQUAL: 0x92,
	OP_ADD: 0x93,
	OP_SUB: 0x94,
	OP_SUCCESS149: 0x95,
	OP_SUCCESS150: 0x96,
	OP_SUCCESS151: 0x97,
	OP_SUCCESS152: 0x98,
	OP_SUCCESS153: 0x99,
	OP_BOOLAND: 0x9a,
	OP_BOOLOR: 0x9b,
	OP_NUMEQUAL: 0x9c,
	OP_NUMEQUALVERIFY: 0x9d,
	OP_NUMNOTEQUAL: 0x9e,
	OP_LESSTHAN: 0x9f,
	OP_GREATERTHAN: 0xa0,
	OP_LESSTHANOREQUAL: 0xa1,
	OP_GREATERTHANOREQUAL: 0xa2,
	OP_MIN: 0xa3,
	OP_MAX: 0xa4,
	OP_WITHIN: 0xa5,
	OP_RIPEMD160: 0xa6,
	OP_SHA1: 0xa7,
	OP_SHA256: 0xa8,
	OP_HASH160: 0xa9,
	OP_HASH256: 0xaa,
	OP_CODESEPARATOR: 0xab,
	OP_CHECKSIG: 0xac,
	OP_CHECKSIGVERIFY: 0xad,
	OP_CHECKMULTISIG: 0xae,
	OP_CHECKMULTISIGVERIFY: 0xaf,
	OP_NOP1: 0xb0,
	OP_CHECKLOCKTIMEVERIFY: 0xb1,
	OP_CHECKSEQUENCEVERIFY: 0xb2,
	OP_NOP4: 0xb3,
	OP_NOP5: 0xb4,
	OP_NOP6: 0xb5,
	OP_NOP7: 0xb6,
	OP_NOP8: 0xb7,
	OP_NOP9: 0xb8,
	OP_NOP10: 0xb9,
	OP_CHECKSIGADD: 0xba,
};

/**
 * Get the sting-representation of an opcode
 * based on its number value.
 */
export function get_op_code(num: number): string {
	if (num > 186 && num < 255) {
		return `OP_SUCCESS${String(num)}`;
	}
	for (const [k, v] of Object.entries(OPCODE_MAP)) {
		if (v === num) return k;
	}
	throw new Error(`OPCODE not found:${String(num)}`);
}

/**
 * Get the number-representation of an opcode
 * based on its asm string value.
 */
export function get_asm_code(string: string): number {
	for (const [k, v] of Object.entries(OPCODE_MAP)) {
		if (k === string) return Number(v);
	}
	throw new Error(`OPCODE not found:${string}`);
}

/**
 * Get the type of word based on its number value.
 */
export function get_op_type(word: number): string {
	switch (true) {
		case word === 0:
			return "opcode";
		case word >= 1 && word <= 75:
			return "varint";
		case word === 76:
			return "pushdata1";
		case word === 77:
			return "pushdata2";
		case word === 78:
			return "pushdata4";
		case word <= 254:
			return "opcode";
		default:
			throw new Error(`Invalid word range: ${word}`);
	}
}

/**
 * Check if the provided value is a valid script opcode.
 */
export function is_valid_op(word: number): boolean {
	const MIN_RANGE = 75;
	const MAX_RANGE = 254;

	const DISABLED_OPCODES: number[] = [];

	switch (true) {
		case typeof word !== "number":
			return false;
		case word === 0:
			return true;
		case DISABLED_OPCODES.includes(word):
			return false;
		case MIN_RANGE < word && word < MAX_RANGE:
			return true;
		default:
			return false;
	}
}
