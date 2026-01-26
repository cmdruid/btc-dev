import { Buff, type Bytes, Stream } from "@vbyte/buff";
import { DecodingError } from "@/error.js";
import type { ScriptInfo } from "@/types/script.js";
import { get_op_code, get_op_type, is_valid_op } from "./words.js";

export function parse_script(script: Bytes): ScriptInfo {
	const bytes = Buff.bytes(script);
	return {
		asm: decode_script(bytes),
		hex: bytes.hex,
	};
}

/**
 * Decode a bitcoin script into asm instructions.
 */
export function decode_script(script: Bytes): string[] {
	const stream = new Stream(script);

	const stack: string[] = [];
	const stack_size = stream.size;

	let word: number;
	let word_type: string;
	let word_size: number;

	let count = 0;

	while (count < stack_size) {
		word = stream.read(1).num;
		word_type = get_op_type(word);
		count++;
		switch (word_type) {
			case "varint":
				try {
					stack.push(stream.read(word).hex);
				} catch {
					throw new DecodingError(
						`Malformed script: varint push at position ${count - 1} requires ${word} bytes but stream exhausted`,
						count - 1,
					);
				}
				count += word;
				break;
			case "pushdata1":
				try {
					word_size = stream.read(1).reverse().num;
				} catch {
					throw new DecodingError(
						`Malformed script: PUSHDATA1 at position ${count - 1} missing size byte`,
						count - 1,
					);
				}
				try {
					stack.push(stream.read(word_size).hex);
				} catch {
					throw new DecodingError(
						`Malformed script: PUSHDATA1 at position ${count - 1} requires ${word_size} bytes but stream exhausted`,
						count - 1,
					);
				}
				count += word_size + 1;
				break;
			case "pushdata2":
				try {
					word_size = stream.read(2).reverse().num;
				} catch {
					throw new DecodingError(
						`Malformed script: PUSHDATA2 at position ${count - 1} missing size bytes`,
						count - 1,
					);
				}
				try {
					stack.push(stream.read(word_size).hex);
				} catch {
					throw new DecodingError(
						`Malformed script: PUSHDATA2 at position ${count - 1} requires ${word_size} bytes but stream exhausted`,
						count - 1,
					);
				}
				count += word_size + 2;
				break;
			case "pushdata4":
				try {
					word_size = stream.read(4).reverse().num;
				} catch {
					throw new DecodingError(
						`Malformed script: PUSHDATA4 at position ${count - 1} missing size bytes`,
						count - 1,
					);
				}
				try {
					stack.push(stream.read(word_size).hex);
				} catch {
					throw new DecodingError(
						`Malformed script: PUSHDATA4 at position ${count - 1} requires ${word_size} bytes but stream exhausted`,
						count - 1,
					);
				}
				count += word_size + 4;
				break;
			case "opcode":
				if (!is_valid_op(word)) {
					throw new DecodingError(`Invalid OPCODE: ${word}`, count - 1);
				}
				stack.push(get_op_code(word));
				break;
			default:
				throw new DecodingError(`Word type undefined: ${word}`, count - 1);
		}
	}
	return stack;
}

/**
 * Check if a script is valid.
 */
export function is_valid_script(script: string | Uint8Array): boolean {
	try {
		const stack = decode_script(script);
		return stack.length > 0;
	} catch {
		return false;
	}
}
