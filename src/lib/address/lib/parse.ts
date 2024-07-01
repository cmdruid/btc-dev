import { get_script_ctx } from '@/lib/script/index.js'
import { ADDR_TOOLS }     from './tool.js'

import {
  AddressData,
  Network,
  ScriptData
} from '@/types/index.js'

import CONST from '../const.js'

const tools = ADDR_TOOLS

export function parse_address (address : string) : AddressData {
  for (const row of CONST.ADDR_TYPES) {
    const [ type, prefix, network, size ] = row
    if (address.startsWith(prefix)) {
      const tool = tools[type]
      const addr = tool.decode(address, network)
      if (addr.keydata.length / 2 === size) {
        return addr
      }
    }
  }
  throw new Error('Unable to parse address: ' + address)
}

export function create_address (
  script   : ScriptData,
  network ?: Network
) : string {
  const { type, key, hex } = get_script_ctx(script)
  if (type !== 'raw') {
    const tool = tools[type]
    if (tool === undefined) {
      throw new Error('Unable to find parser for address type: ' + type)
    }
    return tool.encode(key, network)
  }
  throw new Error('Unrecognized script format: ' + hex)
}
