import { encode_script } from './encode.js'

import {
  decode_script,
  is_valid_script,
  parse_script
} from './decode.js'

export * from './decode.js'
export * from './encode.js'
export * from './lock.js'
export * from './util.js'
export * from './words.js'

export namespace ScriptUtil {
  export const parse    = parse_script
  export const decode   = decode_script
  export const encode   = encode_script
  export const is_valid = is_valid_script
}
