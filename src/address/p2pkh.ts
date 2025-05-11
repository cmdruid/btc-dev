import { Buff }           from '@cmdcode/buff'
import { Assert }         from '@/util/validate.js'
import { hash160 }        from '@/util/hash.js'
import { AddressEncoder } from './encode.js'
import { AddressUtil }    from './util.js'

import {
  AddressData,
  ChainNetwork
} from '../types/index.js'

const ADDRESS_TYPE = 'p2pkh'

export const P2PKH = {
  create : create_address,
  encode : encode_address,
  decode : decode_address
}

function create_address (
  script  : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  const bytes = Buff.bytes(script)
  // TODO: check if its a valid script?
  const hash = hash160(bytes)
  return encode_address(hash, network)
}

function encode_address (
  pk_hash : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  const bytes = Buff.bytes(pk_hash)
  const info  = AddressUtil.lookup(network, ADDRESS_TYPE)
  Assert.exists(info, `unrecognized config: ${ADDRESS_TYPE} on ${network}` )
  Assert.size(bytes, info.size)
  return AddressEncoder.encode({
    data    : bytes,
    format  : 'base58',
    version : info.version
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
  const script = '76a914' + data + '88ac'
  const asm    = [ 'OP_DUP', 'OP_HASH160', data, 'OP_EQUALVERIFY', 'OP_CHECKSIG' ]
  return { ...info, asm, data, script }
}
