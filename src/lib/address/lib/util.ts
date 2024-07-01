import { Buff }            from '@cmdcode/buff'
import { Bech32, Bech32m } from '@/util/index.js'
import { AddressMeta }     from '../types.js'

import CONST from '../const.js'

/**
 * Decode a string based on the provided type.
 */
export function decode_data (
  str  : string,
  type : string
) : Buff {
  if (type === 'base58') {
    return Buff.b58chk(str).slice(1)
  } else if (type === 'bech32') {
    const decoded = Bech32.decode(str)
    return decoded.data
  } else if (type === 'bech32m') {
    const decoded = Bech32m.decode(str)
    return decoded.data
  }
  throw new Error('Unrecognized format type: ' + type)
}

export function lookup (address : string) : AddressMeta | null {
  for (const row of CONST.ADDR_TYPES) {
    const [ type, prefix, network, size, format ] = row
    if (address.startsWith(prefix)) {
      const data = decode_data(address, format)
      if (data.length === size) {
        return { type, prefix, network, size, format }
      }
    }
  }
  return null
}
