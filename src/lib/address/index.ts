import { P2PKH  as P2PKH_TOOL  } from './p2pkh.js'
import { P2SH   as P2SH_TOOL   } from './p2sh.js'
import { P2WPKH as P2WPKH_TOOL } from './p2wpkh.js'
import { P2WSH  as P2WSH_TOOL  } from './p2wsh.js'
import { P2TR   as P2TR_TOOL   } from './p2tr.js'

import { parse_address } from './util.js'

export { P2PKH }  from './p2pkh.js'
export { P2SH }   from './p2sh.js'
export { P2WPKH } from './p2wpkh.js'
export { P2WSH }  from './p2wsh.js'
export { P2TR }   from './p2tr.js'

export { parse_address } from './util.js'

export namespace AddressTool {
  export const P2PKH   = P2PKH_TOOL
  export const P2SH    = P2SH_TOOL
  export const P2WPKH  = P2WPKH_TOOL
  export const P2WSH   = P2WSH_TOOL
  export const P2TR    = P2TR_TOOL
  export const parse   = parse_address
}
