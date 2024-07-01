import { Buff, Bytes }    from '@cmdcode/buff'
import { get_script_hex } from '@/lib/script/index.js'
import { ScriptData }     from '@/types/index.js'
import { assert }         from '@/util/index.js'

import {
  hash160,
  sha256
} from '@cmdcode/crypto-tools/hash'

/**
 * Hash pubkey based on hash160 algorithm.
 */
export function hash160pkh (pubkey : Bytes) : Buff {
  const bytes = Buff.bytes(pubkey)
  assert.size(bytes, 33)
  return hash160(bytes)
}

/**
 * Hash script based on hash160 algorithm.
 */
export function hash160sh (script : ScriptData) : Buff {
  const bytes = get_script_hex(script, false)
  return hash160(bytes)
}

/**
 * Hash script based on sha256 algorithm.
 */
export function sha256sh (script : ScriptData) : Buff {
  const bytes = get_script_hex(script, false)
  return sha256(bytes)
}
