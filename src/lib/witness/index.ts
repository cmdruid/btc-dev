import { decode_witness } from './lib/decode.js'
import { encode_witness } from './lib/encode.js'
import { parse_witness }  from './lib/parse.js'

export * from './lib/decode.js'
export * from './lib/encode.js'
export * from './lib/parse.js'

export default {
  encode : encode_witness,
  decode : decode_witness,
  parse  : parse_witness
}
