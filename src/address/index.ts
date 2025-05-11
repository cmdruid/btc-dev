import { P2PKH  as P2PKH_TOOL  } from './p2pkh.js'
import { P2SH   as P2SH_TOOL   } from './p2sh.js'
import { P2WPKH as P2WPKH_TOOL } from './p2wpkh.js'
import { P2WSH  as P2WSH_TOOL  } from './p2wsh.js'
import { P2TR   as P2TR_TOOL   } from './p2tr.js'

import { parse_address }  from './parse.js'
import { AddressTool }    from './util.js'

export * from './encode.js'
export * from './parse.js'
export * from './util.js'

export * from './p2pkh.js'
export * from './p2sh.js'
export * from './p2wpkh.js'
export * from './p2wsh.js'
export * from './p2tr.js'

export namespace AddressUtil {
  export const P2PKH   = P2PKH_TOOL
  export const P2SH    = P2SH_TOOL
  export const P2WPKH  = P2WPKH_TOOL
  export const P2WSH   = P2WSH_TOOL
  export const P2TR    = P2TR_TOOL
  export const assert  = AddressTool.assert
  export const check   = AddressTool.check
  export const detect  = AddressTool.detect
  export const parse   = parse_address
  export const verify  = AddressTool.verify
}
