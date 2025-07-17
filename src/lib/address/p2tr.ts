import { Buff, Bytes }        from '@vbyte/buff'
import { Assert }             from '@vbyte/micro-lib'
import { encode_address }     from './encode.js'
import { is_p2tr_script }     from '@/lib/script/lock.js'
import { LOCK_SCRIPT_TYPE }   from '@/const.js'

import {
  get_address_config,
  get_address_info
} from './util.js'

import type {
  AddressInfo,
  ChainNetwork
} from '@/types/index.js'

const ADDRESS_TYPE = LOCK_SCRIPT_TYPE.P2TR

export namespace P2TR {
  export const create_address = create_p2tr_address
  export const create_script  = create_p2tr_script
  export const encode_address = encode_p2tr_address
  export const encode_script  = encode_p2tr_script
  export const decode_address = decode_p2tr_address
  export const decode_script  = decode_p2tr_script
}

function create_p2tr_address (
  pubkey  : Bytes,
  network : ChainNetwork = 'main',
) : string {
  // Create the p2tr script.
  const script = create_p2tr_script(pubkey)
  // Encode the script as an address.
  return encode_p2tr_address(script, network)
}

function create_p2tr_script (pubkey : Bytes) : Buff {
  // Convert the public key into bytes.
  const bytes = Buff.bytes(pubkey)
  // Assert the public key is 32 bytes.
  Assert.size(bytes, 32, 'invalid pubkey size')
  // Return the script.
  return encode_p2tr_script(bytes)
}

function encode_p2tr_script (pubkey : Bytes) : Buff {
  return Buff.join([ '5120', pubkey ])
}

function encode_p2tr_address (
  script_pk : Bytes,
  network   : ChainNetwork = 'main'
) : string {
  // Get the public key from the script.
  const pubkey = decode_p2tr_script(script_pk)
  // Get the address configuration.
  const config = get_address_config(network, ADDRESS_TYPE)
  // Assert the configuration exists.
  Assert.exists(config, `unrecognized address config: ${ADDRESS_TYPE} on ${network}` )
  // Assert the payload size is correct.
  Assert.size(pubkey, config.size, `invalid payload size: ${pubkey.length} !== ${config.size}` )
  // Encode the address.
  return encode_address({
    data   : pubkey,
    format : 'bech32m',
    prefix : config.prefix
  })
}

function decode_p2tr_address (
  address : string
) : AddressInfo {
  // Parse the address.
  const parsed = get_address_info(address)
  // Assert the address type is correct.
  Assert.ok(parsed.type === 'p2tr', `address type mismatch: ${parsed.type} !== ${ADDRESS_TYPE}`)
  // Return the parsed address.
  return parsed
}

function decode_p2tr_script (
  script  : Bytes,
) : Buff {
  // Assert the script is a p2tr script.
  Assert.ok(is_p2tr_script(script), `invalid p2tr script`)
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Return the public key from the script.
  return bytes.slice(2, 34)
}
