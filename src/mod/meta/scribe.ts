import { Buff }          from '@cmdcode/buff'
import { Assert }        from '@/util/index.js'
import { encode_script } from '@/mod/script/encode.js'
import { decode_script } from '@/mod/script/decode.js'

import type { InscriptionData } from '@/types/index.js'

const _0n  = BigInt(0)
const _1n  = BigInt(1)
const _26n = BigInt(26)

export namespace Inscription {
  export const encode = encode_inscription
  export const decode = decode_inscription
}

export function decode_inscription (
  script : string
) : InscriptionData[] {
  const envelopes = parse_envelopes(script)
  return envelopes.map(parse_record)
}

export function encode_inscription (data : InscriptionData[]) : string {
  return data.map(create_envelope).join('')
}

function create_envelope (data : InscriptionData) : string {
  let asm : string[] = [ 'OP_0', 'OP_IF', '6f7264' ]

  if (typeof data.delegate === 'string') {
    const id = encode_id(data.delegate)
    asm.push('OP_11', id)
  }

  if (typeof data.ref === 'string') {
    asm.push('OP_WITHIN', data.ref)
  }

  if (typeof data.parent === 'string') {
    const id = encode_id(data.parent)
    asm.push('OP_3', id)
  }

  if (typeof data.opcode === 'number') {
    const code = encode_pointer(data.opcode)
    asm.push('OP_NOP', code)
  }

  if (typeof data.pointer === 'number') {
    const ptr = encode_pointer(data.pointer)
    asm.push('OP_2', ptr)
  }

  if (typeof data.rune === 'string') {
    const label = encode_rune_label(data.rune)
    asm.push('OP_13', label)
  }

  if (typeof data.mimetype === 'string') {
    const label = encode_label(data.mimetype)
    asm.push('OP_1', label)
  }

  if (typeof data.content === 'string') {
    const chunks = encode_content(data.content)
    asm.push('OP_0', ...chunks)
  }

  asm.push('OP_ENDIF')

  return encode_script(asm)
}

function parse_envelopes (
  script : string
) : string[][] {

  const words     = decode_script(script)
  const start_idx = words.findIndex(e => e === 'OP_0')

  Assert.ok(start_idx !== -1, 'inscription envelope not found')

  const envelopes = []

  for (let idx = start_idx; idx < words.length; idx++) {
    Assert.ok(words[idx + 1] === 'OP_IF',  'OP_IF missing from envelope')
    Assert.ok(words[idx + 2] === '6f7264', 'magic bytes missing from envelope')

    const stop_idx = words.findIndex(e => e === 'OP_ENDIF')
    Assert.ok(stop_idx !== -1, 'inscription envelope missing END_IF statement')

    const env = words.slice(idx + 3, stop_idx)
    envelopes.push(env)
    idx += stop_idx
  }

  return envelopes
}

function parse_record (envelope : string[]) {
  const record : InscriptionData = {}

  for (let i = 0; i < envelope.length; i++) {
    switch (envelope[i]) {
      case 'OP_1':
        record.mimetype = decode_label(envelope[i+1])
        i += 1
        break
      case 'OP_2':
        record.pointer = decode_pointer(envelope[i+1])
        i += 1
        break
      case 'OP_3':
        record.parent = decode_id(envelope[i+1])
        i += 1
        break
      case 'OP_11':
        record.delegate = decode_id(envelope[i+1])
        i += 1
        break
      case 'OP_13':
        record.rune = decode_rune_label(envelope[i+1])
        i += 1
        break
      case 'OP_WITHIN':
        record.ref = envelope[i+1]
        i += 1
        break;
      case 'OP_NOP':
        record.opcode = decode_pointer(envelope[i+1])
        i += 1
        break;
      case 'OP_0':
        record.content = decode_content(envelope.slice(i+1))
        return record
    }
  }
  return record
}

function encode_id (
  identifier : string
) : string {
  Assert.ok(identifier.includes('i'), 'identifier must include an index')
  const parts = identifier.split('i')
  const bytes = Buff.hex(parts[0])
  const idx   = Number(parts[1])
  const txid  = bytes.reverse().hex
  return (idx !== 0) ? txid + Buff.num(idx).hex : txid
}

function decode_id (
  hexstr : string
) : string {
  const bytes = Buff.hex(hexstr)
  const idx   = bytes.at(-1) ?? 0
  const txid  = bytes.slice(0, -1).reverse().hex
  return txid + 'i' + String(idx)
}

function encode_pointer (
  pointer : number
) : string {
  return Buff.num(pointer).reverse().hex
}

function decode_pointer (
  hexstr : string
) : number {
  return Buff.hex(hexstr).reverse().num
}

function encode_label (
  label : string
) : string {
  return Buff.str(label).hex
}

function decode_label (
  hexstr : string
) : string {
  return Buff.hex(hexstr).str
}

function encode_content (
  content : string
) : string[] {
  const stream = Buff.is_hex(content)
    ? Buff.hex(content).stream
    : Buff.str(content).stream
  const chunks : string[]= []
  while (stream.size > 0) {
    if (stream.size > 520) {
      const chunk = stream.read(520)
      chunks.push(chunk.hex)
    } else {
      const chunk = stream.read(stream.size)
      chunks.push(chunk.hex)
    }
  }
  return chunks
}

function decode_content (
  hexstrs : string[],
  type    : 'hex' | 'utf8' = 'hex'
) : string {
  const data = Buff.join(hexstrs)
  return (type === 'hex')
    ? data.hex
    : data.str
}

function encode_rune_label (label : string) : string {
  const str = label.toUpperCase()
  let big = _0n
  for (const char of str) {
    if (char >= 'A' && char <= 'Z') {
        big = big * _26n + BigInt(char.charCodeAt(0) - ('A'.charCodeAt(0) - 1))
    } else { continue }
  }
  big = big - _1n
  return Buff.big(big).reverse().hex
}

function decode_rune_label (hex: string): string {
  // Convert hex to BigInt, with byte order reversed
  let big = Buff.hex(hex).reverse().big
  // Add 1 as per the encoding algorithm
  big = big + _1n
  // Initialize result string
  let result = ''
  // Convert the BigInt back to a string of alphabet characters
  while (big > _0n) {
    // Get remainder after division by 26
    const mod = big % _26n
    // Convert remainder to character (0 maps to 'Z', 1 to 'A', 2 to 'B', etc.)
    if (mod === _0n) {
      result = 'Z' + result
      big = big / _26n - _1n // Adjust for special case of 'Z'
    } else {
      // Map 1 to 'A', 2 to 'B', etc.
      const charCode = Number(mod) + 'A'.charCodeAt(0) - 1
      result = String.fromCharCode(charCode) + result
      big = big / _26n
    }
  }
  return result
}
