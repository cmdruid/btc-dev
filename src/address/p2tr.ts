import { Buff }           from '@cmdcode/buff'
import { AddressEncoder } from './encode.js'
import { AddressTool }    from './util.js'
import { Assert }         from '@/util/index.js'

import {
  AddressData,
  ChainNetwork
} from '../types/index.js'

const ADDRESS_TYPE = 'p2tr'

export const P2TR = {
  encode : encode_address,
  decode : decode_address
}

function encode_address (
  pubkey  : string | Uint8Array,
  network : ChainNetwork = 'main'
) : string {
  let   bytes = Buff.bytes(pubkey)
  const info  = AddressTool.lookup(network, ADDRESS_TYPE)
  Assert.exists(info, `unrecognized config: ${ADDRESS_TYPE} on ${network}` )
  Assert.size(bytes, info.size)
  return AddressEncoder.encode({
    data   : bytes,
    format : 'bech32m',
    prefix : info.prefix
  })
}

function decode_address (
  address : string
) : AddressData {
  AddressTool.assert(address)
  const info  = AddressTool.detect(address)
  Assert.exists(info,  'unable to detect address type')
  const bytes  = AddressEncoder.decode(address)
  Assert.size(bytes, info.size)
  const data   = Buff.bytes(bytes).hex
  const script = '5120' + data
  const asm    = [ 'OP_1', data ]
  return { ...info, asm, data, script }
}
