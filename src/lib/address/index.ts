// https://en.bitcoin.it/wiki/Invoice_address

import P2PKH  from './lib/p2pkh.js'
import P2SH   from './lib/p2sh.js'
import P2WPKH from './lib/p2wpkh.js'
import P2WSH  from './lib/p2wsh.js'
import P2TR   from './lib/p2tr.js'

import { create_address, parse_address } from './lib/parse.js'

export * from './lib/parse.js'

export {
  P2PKH,
  P2SH,
  P2WPKH,
  P2WSH,
  P2TR
}

export default {
  create : create_address,
  parse  : parse_address,
  P2PKH,
  P2SH,
  P2WPKH,
  P2WSH,
  P2TR
}
