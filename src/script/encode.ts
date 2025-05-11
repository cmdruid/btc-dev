import { Buff, Stream }  from '@cmdcode/buff'
import { get_asm_code, } from './words.js'

// The maximum size of a word in bytes.
const MAX_WORD_SIZE = 520

/**
 * Encode script asm instructions into a hex string.
 */
export function encode_script (
  words : (string | number | Uint8Array)[],
  varint = false
) : string {
  if (words.length === 0) return '00'

  const bytes = []

  for (const word of words) {

    bytes.push(encode_script_word(word))
  }

  const buffer = Buff.join(bytes)

  return (varint)
    ? buffer.add_varint('le').hex
    : buffer.hex
}


/** Check if the word is a valid opcode,
 *  and return its integer value.
 */
export function encode_script_word (word : string | number | Uint8Array) : Uint8Array {
  let buff : Buff

  // If word is a string:
  if (typeof (word) === 'string') {
    // If word is an opcode:
    if (word.startsWith('OP_')) {
      // Get the opcode number value.
      const asm_code = get_asm_code(word)
      // Return the opcode as a single byte.
      return Buff.num(asm_code, 1)
    // If word is valid hex:
    } else if (Buff.is_hex(word)) {
      // Encode as hex.
      buff = Buff.hex(word)
    } else {
      // Encode as UTF8 string.
      buff = Buff.str(word)
    }
  // If word is a number:
  } else if (typeof (word) === 'number') {
    // Encode the number value.
    buff = Buff.num(word)
  // If word is a Uint8Array:
  } else if (word instanceof Uint8Array) {
    // Encode as bytes.
    buff = new Buff(word)
  } else {
    // If word is not a string, number, or Uint8Array, throw an error.
    throw new Error('invalid word type:' + typeof (word))
  }

  // Format and return the word based on its size.
  if (buff.length === 1 && buff[0] <= 16) {
    // Number values 0-16 must be treated as opcodes.
    if (buff[0] !== 0) buff[0] += 0x50
  } else if (buff.length > MAX_WORD_SIZE) {
    // Number values larger than max size must be split into chunks.
    let words : Buff[]
    // Split bytes into chunks, based on max word size.
    words = split_script_word(buff)
    // Prefix a varint length byte for each chunk.
    words = words.map(e => prefix_word_size(e))
    // Concatenate the chunks
    buff = Buff.join(words)
  } else {
    // Else, return the word with a varint prefix.
    buff = prefix_word_size(buff)
  }
  // Return the final result.
  return buff
}

/**
 * Split a word into smaller chunks.
 */
export function split_script_word (
  word : Uint8Array
) : Buff[] {
  const words = []
  const buff  = new Stream(word)
  while (buff.size > MAX_WORD_SIZE) {
    // Push a word chunk to the array.
    words.push(buff.read(MAX_WORD_SIZE))
  }
  // Push the remainder to the array.
  words.push(buff.read(buff.size))
  return words
}

/**
 * Prefix a word with its size, encoded as a varint.
 */
export function prefix_word_size (
  word : Uint8Array
) : Buff {
  const varint = get_size_varint(word.length)
  return Buff.join([ varint, word ])
}

/**
 * Return a varint that encodes a size value.
 */
export function get_size_varint (size : number) : Buff {
  const OP_PUSHDATA1 = Buff.num(0x4c, 1)
  const OP_PUSHDATA2 = Buff.num(0x4d, 1)
  switch (true) {
    case (size <= 0x4b):
      return Buff.num(size)
    case (size > 0x4b && size < 0x100):
      return Buff.join([ OP_PUSHDATA1, Buff.num(size, 1, 'le') ])
    case (size >= 0x100 && size <= MAX_WORD_SIZE):
      return Buff.join([ OP_PUSHDATA2, Buff.num(size, 2, 'le') ])
    default:
      throw new Error('Invalid word size:' + size.toString())
  }
}
