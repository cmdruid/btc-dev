import { Buff }           from '@cmdcode/buff'
import { Assert }         from '@/util/validate.js'
import { hash160 }        from '@/util/hash.js'
import { AddressEncoder } from './encode.js'
import { AddressTool }    from './util.js'

import {
  AddressData,
  ChainNetwork
} from '../types/index.js'

const ADDRESS_TYPE = 'p2w-pkh'

export const P2WPKH = {
  create : create_address,
  encode : encode_address,
  decode : decode_address
}

function create_address (
  pubkey  : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  const bytes = Buff.bytes(pubkey)
  Assert.size(bytes, 33)
  // TODO: check if its a valid pubkey
  const hash = hash160(bytes)
  return encode_address(hash, network)
}

function encode_address (
  pk_hash : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  const bytes = Buff.bytes(pk_hash)
  const info  = AddressTool.lookup(network, ADDRESS_TYPE)
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
  AddressTool.assert(address)
  const info   = AddressTool.detect(address)
  Assert.exists(info,  'unable to detect address type')
  const bytes  = AddressEncoder.decode(address)
  Assert.size(bytes, info.size)
  const data   = Buff.bytes(bytes).hex
  const script = '0014' + data
  const asm    = [ 'OP_0', data ]
  return { ...info, asm, data, script }
}
