import { OPCODE_MAP }    from './words.js'
import { encode_script } from './encode.js'

import {
  decode_script,
  is_valid_script
} from './decode.js'

import {
  parse_script_pubkeys,
  prefix_script_size
} from './util.js'

export * from './decode.js'
export * from './encode.js'
export * from './util.js'
export * from './words.js'

export namespace ScriptUtil {
  export const prefix_size = prefix_script_size
  export const decode      = decode_script
  export const encode      = encode_script
  export const is_valid    = is_valid_script
  export const get_pubkeys = parse_script_pubkeys
  export const OPCODES     = OPCODE_MAP
}
