import { Buff, Bytes }        from '@vbyte/buff'
import { Assert }             from '@vbyte/micro-lib'
import { hash160 }            from '@vbyte/micro-lib/hash'
import { encode_address }     from './encode.js'
import { is_p2sh_script }     from '@/lib/script/lock.js'
import { LOCK_SCRIPT_TYPE }   from '@/const.js'

import {
  get_address_config,
  get_address_info
} from './util.js'

import type {
  AddressInfo,
  ChainNetwork
} from '@/types/index.js'

const ADDRESS_TYPE = LOCK_SCRIPT_TYPE.P2SH

export namespace P2SH {
  export const create_address = create_p2sh_address
  export const create_script  = create_p2sh_script
  export const encode_address = encode_p2sh_address
  export const encode_script  = encode_p2sh_script
  export const decode_address = decode_p2sh_address
  export const decode_script  = decode_p2sh_script
}

function create_p2sh_address (
  script  : Bytes,
  network : ChainNetwork = 'main',
) : string {
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Convert the bytes into a hash.
  const hash = hash160(bytes)
  // Create the p2sh script.
  const p2sh_script = encode_p2sh_script(hash)
  // Encode the address.
  return encode_p2sh_address(p2sh_script, network)
}

function create_p2sh_script (script : Bytes) : Buff {
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Convert the bytes into a hash.
  const hash = hash160(bytes)
  // Return the script.
  return encode_p2sh_script(hash)
}

function encode_p2sh_script (script_hash : Bytes) : Buff {
  return Buff.join([ 'a914', script_hash, '87' ])
}

function encode_p2sh_address (
  script_pk : Bytes,
  network   : ChainNetwork = 'main',
) : string {
  // Get the script hash from the script.
  const script_hash = decode_p2sh_script(script_pk)
  // Get the address configuration.
  const config = get_address_config(network, ADDRESS_TYPE)
  // Assert the configuration exists.
  Assert.exists(config, `unrecognized address config: ${ADDRESS_TYPE} on ${network}` )
  // Assert the payload size is correct.
  Assert.size(script_hash, config.size, `invalid payload size: ${script_hash.length} !== ${config.size}` )
  // Encode the address.
  return encode_address({
    data    : script_hash,
    format  : 'base58',
    version : config.version
  })
}

function decode_p2sh_address (
  address : string
) : AddressInfo {
  // Parse the address.
  const parsed = get_address_info(address)
  // Assert the address type is correct.
  Assert.ok(parsed.type === 'p2sh', `address type mismatch: ${parsed.type} !== ${ADDRESS_TYPE}`)
  // Return the parsed address.
  return parsed
}

function decode_p2sh_script (
  script  : Bytes,
) : Buff {
  // Assert the script is a p2sh script.
  Assert.ok(is_p2sh_script(script), `invalid p2sh script`)
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Return the script hash from the script.
  return bytes.slice(2, 22)
}
