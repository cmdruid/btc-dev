import { encode_script }  from './lib/encode.js'
import { decode_script }  from './lib/decode.js'
import { get_script_ctx } from './lib/parse.js'

export * as CONST from './const.js'

export * from './lib/encode.js'
export * from './lib/decode.js'
export * from './lib/parse.js'
export * from './lib/words.js'

export default {
  encode : encode_script,
  decode : decode_script,
  parse  : get_script_ctx
}
