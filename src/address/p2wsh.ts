import { Buff }           from '@cmdcode/buff'
import { Assert }         from '@/util/validate.js'
import { sha256 }         from '@/util/hash.js'
import { AddressEncoder } from './encode.js'
import { AddressUtil }    from './util.js'

import {
  AddressData,
  ChainNetwork
} from '../types/index.js'

const ADDRESS_TYPE = 'p2w-sh'

export const P2WSH = {
  create : create_address,
  encode : encode_address,
  decode : decode_address
}

function create_address (
  pubkey  : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  const bytes = Buff.bytes(pubkey)
  Assert.size(bytes, 32)
  // TODO: check if its a valid pubkey
  const hash = sha256(bytes)
  return encode_address(hash, network)
}

function encode_address (
  script_hash : string | Uint8Array,
  network     : ChainNetwork = 'main',
) : string {
  const bytes = Buff.bytes(script_hash)
  const info  = AddressUtil.lookup(network, ADDRESS_TYPE)
  Assert.exists(info, `unrecognized config: ${ADDRESS_TYPE} on ${network}` )
  Assert.size(bytes, info.size)
  return AddressEncoder.encode({
    data   : bytes,
    format : 'bech32',
    prefix : info.prefix
  })
}

function decode_address (
  address : string
) : AddressData {
  AddressUtil.assert(address)
  const info   = AddressUtil.detect(address)
  Assert.exists(info,  'unable to detect address type')
  const bytes  = AddressEncoder.decode(address)
  Assert.size(bytes, info.size)
  const data   = Buff.bytes(bytes).hex
  const script = '0020' + data
  const asm    = [ 'OP_0', data ]
  return { ...info, asm, data, script }
}
