import { Buff, Bytes }   from '@cmdcode/buff'
import { check }         from '@/util/index.js'
import { decode_script } from './decode.js'
import { encode_script } from './encode.js'

import {
  ScriptData,
  ScriptMeta,
  ScriptWord
} from '../types.js'

import CONST from '../const.js'

export function get_script_ctx (
  script : ScriptData
) : ScriptMeta {
  const hex = get_script_hex(script, false).hex
  for (const [ type, pattern ] of CONST.SCRIPT_TYPES) {
    const { groups } = pattern.exec(hex) ?? {}
    const { hash   } = groups ?? {}
    if (check.is_hex(hash)) {
      return {
        type,
        hex,
        key : Buff.hex(hash),
        asm : get_script_asm(script, false)
      }
    }
  }
  return { type: 'raw', hex, asm: get_script_asm(script, false) }
}

export function get_script_asm (
  script  : ScriptData,
  varint ?: boolean
) : ScriptWord[] {
  if (Array.isArray(script)) {
    script = encode_script(script, varint)
  }
  if (check.is_bytes(script)) {
    return decode_script(script, varint)
  }
  throw new Error('Invalid script format: ' + String(script))
}

export function get_script_hex (
  script  : Bytes | ScriptWord[],
  varint ?: boolean
) : Buff {
  if (check.is_bytes(script)) {
    script = decode_script(script, varint)
  }
  if (Array.isArray(script)) {
    return encode_script(script, varint)
  }
  throw new Error('Invalid script format: ' + String(script))
}
