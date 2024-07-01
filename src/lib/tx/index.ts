import { decode_tx } from './lib/decode.js'
import { encode_tx } from './lib/encode.js'

import { calc_txid, calc_txsize } from './lib/calc.js'

import {
  create_prevout,
  create_tx,
  create_vin,
  create_vout
} from './lib/create.js'

export * from './lib/calc.js'
export * from './lib/create.js'
export * from './lib/encode.js'
export * from './lib/decode.js'
export * from './lib/util.js'

export default {
  calc   : {
    size : calc_txsize,
    txid : calc_txid
  },
  create : {
    txdata : create_tx,
    txin   : create_vin,
    txout  : create_vout,
    utxo   : create_prevout
  },
  encode : encode_tx,
  decode : decode_tx
}