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

const ADDR_TYPE = 'p2w-pkh'

export namespace P2WPKH {
  export const create = create_p2wpkh_address
  export const encode = encode_p2wpkh_address
  export const decode = decode_p2wpkh_address
}

function create_p2wpkh_address (
  pubkey  : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  // Convert the public key into bytes.
  const bytes = Buff.bytes(pubkey)
  // Assert the payload size is correct.
  Assert.size(bytes, 33, `invalid payload size: ${bytes.length} !== 33` )
  // Convert the bytes into a hash.
  const hash = hash160(bytes)
  // Encode the address.
  return encode_p2wpkh_address(hash, network)
}

function encode_p2wpkh_address (
  pk_hash : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  // Convert the public key hash into bytes.
  const bytes  = Buff.bytes(pk_hash)
  // Get the address configuration.
  const config = get_address_config(network, ADDR_TYPE)
  // Assert the configuration exists.
  Assert.exists(config, `unrecognized address config: ${ADDR_TYPE} on ${network}` )
  // Assert the payload size is correct.
  Assert.size(bytes, config.size, `invalid payload size: ${bytes.length} !== ${config.size}` )
  // Encode the address.
  return encode_address({
    data   : bytes,
    format : 'bech32',
    prefix : config.prefix
  })
}

function decode_p2wpkh_address (
  address : string
) : AddressData {
  // Parse the address.
  const parsed = parse_address(address)
  // Assert the address type is correct.
  Assert.ok(parsed.type === 'p2w-pkh', `address type mismatch: ${parsed.type} !== ${ADDR_TYPE}`)
  // Return the parsed address.
  return parsed
}
