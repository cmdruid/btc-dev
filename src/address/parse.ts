import { P2PKH  } from './p2pkh.js'
import { P2SH   } from './p2sh.js'
import { P2WPKH } from './p2wpkh.js'
import { P2WSH  } from './p2wsh.js'
import { P2TR   } from './p2tr.js'
import { Assert } from '@/util/validate.js'

import { AddressTool } from './util.js'

import type { AddressData } from '../types/index.js'

export function parse_address (address : string) : AddressData {
  const info = AddressTool.detect(address)
  Assert.exists(info, 'unable to detect address type')
  switch (info.type) {
    case 'p2pkh':
      return P2PKH.decode(address)
    case 'p2sh':
      return P2SH.decode(address)
    case 'p2w-pkh':
      return P2WPKH.decode(address)
    case 'p2w-sh':
      return P2WSH.decode(address)
    case 'p2tr':
      return P2TR.decode(address)
    default:
      throw new Error('unrecognized address type: ' + info.type)
  }
}
