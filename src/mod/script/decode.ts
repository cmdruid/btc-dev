import { Stream } from '@cmdcode/buff'

import {
  get_op_code,
  get_op_type,
  is_valid_op
} from './words.js'

/**
 * Decode a bitcoin script into asm instructions.
 */
export function decode_script (
  script : string | Uint8Array
) : string[] {
  const stream = new Stream(script)

  const stack : string[] = []
  const stack_size = stream.size

  let word      : number
  let word_type : string
  let word_size : number

  let count = 0

  while (count < stack_size) {
    word = stream.read(1).num
    word_type = get_op_type(word)
    count++
    switch (word_type) {
      case 'varint':
        stack.push(stream.read(word).hex)
        count += word
        break
      case 'pushdata1':
        word_size = stream.read(1).reverse().num
        stack.push(stream.read(word_size).hex)
        count += word_size + 1
        break
      case 'pushdata2':
        word_size = stream.read(2).reverse().num
        stack.push(stream.read(word_size).hex)
        count += word_size + 2
        break
      case 'pushdata4':
        word_size = stream.read(4).reverse().num
        stack.push(stream.read(word_size).hex)
        count += word_size + 4
        break
      case 'opcode':
        if (!is_valid_op(word)) {
          throw new Error(`Invalid OPCODE: ${word}`)
        }
        stack.push(get_op_code(word))
        break
      default:
        throw new Error(`Word type undefined: ${word}`)
    }
  }
  return stack
}

/**
 * Check if a script is valid.
 */
export function is_valid_script (
  script : string | Uint8Array
) : boolean {
  try {
    const stack = decode_script(script)
    return stack.length > 0
  } catch {
    return false
  }
}
