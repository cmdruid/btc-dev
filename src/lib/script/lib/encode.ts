import { Buff, Bytes, Stream } from '@cmdcode/buff'
import { check }        from '@/util/index.js'
import { get_asm_code } from './words.js'
import { ScriptWord }   from '../types.js'

import CONST from '../const.js'

/**
 * Encode script asm instructions into bytes.
 */
export function encode_script (
  script : Bytes | ScriptWord[],
  add_varint = true
) : Buff {

  let buff = Buff.num(0)

  if (Array.isArray(script)) {
    buff = Buff.raw(encode_words(script))
  }

  if (check.is_hex(script)) {
    buff = Buff.hex(script)
  }

  if (script instanceof Uint8Array) {
    buff = Buff.raw(script)
  }

  if (add_varint) {
    buff = buff.add_varint('le')
  }

  return buff
}

/**
 * Encode asm words into bytes.
 */
function encode_words (
  words : ScriptWord[]
) : Uint8Array {
  const bytes = []
  for (const word of words) {
    bytes.push(format_word(word))
  }
  return (bytes.length > 0)
    ? Buff.join(bytes)
    : new Uint8Array()
}

/** Check if the word is a valid opcode,
 *  and return its integer value.
 */
function format_word (
  word : ScriptWord
) : Uint8Array {
  let buff = new Uint8Array()

  if (typeof (word) === 'string') {
    if (word.startsWith('OP_')) {
      // If word is an opcode, return a
      // number value without size prefix.
      return Buff.num(get_asm_code(word), 1)
    } else if (check.is_hex(word)) {
      // If word is valid hex, encode as hex.
      buff = Buff.hex(word)
    } else {
      // Else, encode word as UTF8 string.
      buff = Buff.str(word)
    }
  } else {
    // If not a string, encode as bytes.
    buff = Buff.bytes(word)
  }

  // Format and return the word based on its size.
  if (buff.length === 1 && buff[0] <= 16) {
    // Number values 0-16 must be treated as opcodes.
    if (buff[0] !== 0) buff[0] += 0x50
  } else if (buff.length > CONST.MAX_WORD_SIZE) {
    // Number values larger than max size must be split into chunks.
    let words : Buff[]
    // Split bytes into chunks, based on max word size.
    words = split_word(buff)
    // Prefix a varint length byte for each chunk.
    words = words.map(e => prefix_word(e))
    // Concatenate the chunks
    buff = Buff.join(words)
  } else {
    // Else, return the word with a varint prefix.
    buff = prefix_word(buff)
  }
  // Return the final result.
  return buff
}

/**
 * Split a word into smaller chunks.
 */
function split_word (
  word : Uint8Array
) : Buff[] {
  const words = []
  const buff  = new Stream(word)
  while (buff.size > CONST.MAX_WORD_SIZE) {
    // Push a word chunk to the array.
    words.push(buff.read(CONST.MAX_WORD_SIZE))
  }
  // Push the remainder to the array.
  words.push(buff.read(buff.size))
  return words
}

/**
 * Prefix a word with its size, encoded as a varint.
 */
function prefix_word (
  word : Uint8Array
) {
  const varint = encode_size(word.length)
  return Buff.join([ varint, word ])
}

/**
 * Return a varint that encodes a size value.
 */
function encode_size (size : number) : Uint8Array {
  const OP_PUSHDATA1 = Buff.num(0x4c, 1)
  const OP_PUSHDATA2 = Buff.num(0x4d, 1)
  switch (true) {
    case (size <= 0x4b):
      return Buff.num(size)
    case (size > 0x4b && size < 0x100):
      return Buff.join([ OP_PUSHDATA1, Buff.num(size, 1, 'le') ])
    case (size >= 0x100 && size <= CONST.MAX_WORD_SIZE):
      return Buff.join([ OP_PUSHDATA2, Buff.num(size, 2, 'le') ])
    default:
      throw new Error('Invalid word size:' + size.toString())
  }
}
