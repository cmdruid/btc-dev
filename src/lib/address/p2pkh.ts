import { Buff }           from '@vbyte/buff'
import { Assert }         from '@vbyte/micro-lib'
import { hash160 }        from '@vbyte/micro-lib/hash'
import { encode_address } from './encode.js'

import {
  get_address_config,
  parse_address
} from './util.js'

import type {
  AddressData,
  ChainNetwork
} from '@/types/index.js'

const ADDR_TYPE = 'p2pkh'

export namespace P2PKH {
  export const create = create_p2pkh_address
  export const encode = encode_p2pkh_address
  export const decode = decode_p2pkh_address
}

function create_p2pkh_address (
  script  : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Convert the bytes into a hash.
  const hash = hash160(bytes)
  // Encode the hash as an address.
  return encode_p2pkh_address(hash, network)
}

function encode_p2pkh_address (
  pk_hash : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  // Convert the public key hash into bytes.
  const bytes  = Buff.bytes(pk_hash)
  // Get the address configuration.
  const config = get_address_config(network, ADDR_TYPE)
  // Assert the configuration exists.
  Assert.exists(config,           `unrecognized address config: ${ADDR_TYPE} on ${network}` )
  // Assert the payload size is correct.
  Assert.size(bytes, config.size, `invalid payload size: ${bytes.length} !== ${config.size}` )
  // Encode the address.
  return encode_address({
    data    : bytes,
    format  : 'base58',
    version : config.version
  })
}

function decode_p2pkh_address (
  address : string
) : AddressData {
  // Parse the address.
  const parsed = parse_address(address)
  // Assert the address type is correct.
  Assert.ok(parsed.type === 'p2pkh', `address type mismatch: ${parsed.type} !== ${ADDR_TYPE}`)
  // Return the parsed address.
  return parsed
}
