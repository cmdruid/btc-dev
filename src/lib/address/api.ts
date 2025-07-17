import { Buff, Bytes }          from '@vbyte/buff'
import { get_lock_script_type } from '@/lib/script/lock.js'
import { get_address_info }     from './util.js'
import { LOCK_SCRIPT_TYPE }     from '@/const.js'

import { P2PKH }  from './p2pkh.js'
import { P2SH }   from './p2sh.js'
import { P2TR }   from './p2tr.js'
import { P2WPKH } from './p2wpkh.js'
import { P2WSH }  from './p2wsh.js'

import type { AddressInfo, ChainNetwork } from '@/types/index.js'

/**
 * Parse an address into its data and script.
 * 
 * @param address - The address to parse.
 * @returns The address data and script.
 */
export function create_address (
  script  : Bytes,
  network : ChainNetwork = 'main'
) : string {
  // Convert the script into bytes.
  const bytes = Buff.bytes(script)
  // Get the address configuration.
  const type = get_lock_script_type(bytes)
  // If the script type is not recognized, throw an error.
  if (type === null) throw new Error('unrecognized script type: ' + bytes.hex)
  // Create the address based on the script type.
  switch (type) {
    case LOCK_SCRIPT_TYPE.P2PKH:
      return P2PKH.create_address(script, network)
    case LOCK_SCRIPT_TYPE.P2SH:
      return P2SH.create_address(script, network)
    case LOCK_SCRIPT_TYPE.P2WPKH:
      return P2WPKH.create_address(script, network)
    case LOCK_SCRIPT_TYPE.P2WSH:
      return P2WSH.create_address(script, network)
    case LOCK_SCRIPT_TYPE.P2TR:
      return P2TR.create_address(script, network)
    default:
      // If the script type is not recognized, throw an error.
      throw new Error('unrecognized script type: ' + type)
  }
}

export function parse_address (address : string) : AddressInfo {
  return get_address_info(address)
}
