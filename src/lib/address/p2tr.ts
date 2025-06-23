import { Buff }           from '@vbyte/buff'
import { Assert }         from '@vbyte/micro-lib'
import { encode_address } from './encode.js'

import {
  get_address_config,
  parse_address
} from './util.js'

import type {
  ChainNetwork,
  AddressData
} from '@/types/index.js'

const ADDR_TYPE = 'p2tr'

export namespace P2TR {
  export const encode = encode_p2tr_address
  export const decode = decode_p2tr_address
}

function encode_p2tr_address (
  pubkey  : string | Uint8Array,
  network : ChainNetwork = 'main'
) : string {
  // Convert the public key into bytes.
  const bytes = Buff.bytes(pubkey)
  // Get the address configuration.
  const config = get_address_config(network, ADDR_TYPE)
  // Assert the configuration exists.
  Assert.exists(config, `unrecognized address config: ${ADDR_TYPE} on ${network}` )
  // Assert the payload size is correct.
  Assert.size(bytes, config.size, `invalid payload size: ${bytes.length} !== ${config.size}` )
  // Encode the address.
  return encode_address({
    data   : bytes,
    format : 'bech32m',
    prefix : config.prefix
  })
}

function decode_p2tr_address (
  address : string
) : AddressData {
  // Parse the address.
  const parsed = parse_address(address)
  // Assert the address type is correct.
  Assert.ok(parsed.type === 'p2tr', `address type mismatch: ${parsed.type} !== ${ADDR_TYPE}`)
  // Return the parsed address.
  return parsed
}
