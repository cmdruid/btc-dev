import { Buff }           from '@vbyte/buff'
import { Assert }         from '@vbyte/micro-lib'
import { sha256 }         from '@vbyte/micro-lib/hash'
import { encode_address } from './encode.js'

import {
  get_address_config,
  parse_address
} from './util.js'

import type {
  ChainNetwork,
  AddressData
} from '@/types/index.js'

const ADDR_TYPE = 'p2w-sh'

export namespace P2WSH {
  export const create = create_p2wsh_address
  export const encode = encode_p2wsh_address
  export const decode = decode_p2wsh_address
}

function create_p2wsh_address (
  script  : string | Uint8Array,
  network : ChainNetwork = 'main',
) : string {
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Convert the bytes into a hash.
  const hash  = sha256(bytes)
  // Encode the address.
  return encode_p2wsh_address(hash, network)
}

function encode_p2wsh_address (
  script_hash : string | Uint8Array,
  network     : ChainNetwork = 'main',
) : string {
  // Convert the script hash into bytes.
  const bytes  = Buff.bytes(script_hash)
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

function decode_p2wsh_address (
  address : string
) : AddressData {
  // Parse the address.
  const parsed = parse_address(address)
  // Assert the address type is correct.
  Assert.ok(parsed.type === 'p2w-sh', `address type mismatch: ${parsed.type} !== ${ADDR_TYPE}`)
  // Return the parsed address.
  return parsed
}
