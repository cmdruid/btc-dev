import { Buff }            from '@cmdcode/buff'
import { parse_parity }    from './decode.js'
import { convert_32b }     from '@cmdcode/crypto-tools/keys'
import { merkleize }       from './tree.js'
import { DEFAULT_VERSION } from '../const.js'

import {
  get_taptweak,
  tweak_pubkey
} from './tweak.js'

import {
  TaprootConfig,
  TaprootContext
} from '../types.js'

export function get_taproot_ctx (
  config : TaprootConfig
) : TaprootContext {
  const { int_key, leaves = [], target, version = DEFAULT_VERSION } = config

  let path    : string[] = [],
      taproot : string | undefined

  if (target !== null) {
    if (leaves.length > 0) {
      // Merkelize the leaves into a root hash (with proof).
      const [ root, _, proofs ] = merkleize(leaves, target)
      // Get the control path from the merkelized output.
      path    = proofs
      // Get the tapped key from the internal key.
      taproot = root
       // Get the tapped key from the single tapleaf.
    } else {
      taproot = target
    }
  }

  const taptweak = get_taptweak(int_key, taproot)
  const twk_key  = tweak_pubkey(int_key, taptweak)
  const parity   = parse_parity(twk_key)
  const tapkey   = convert_32b(twk_key)
  // Get the block version / parity bit.
  const cbit  = Buff.num(version + parity)
  // Create the control block, starting with
  // the control bit and the (x-only) pubkey.
  const block = [ cbit, Buff.bytes(int_key).hex ]
  // If there is more than one path, add to block.
  if (path.length > 0) {
    path.forEach(e => block.push(Buff.hex(e)))
  }
  // Merge the data together into one array.
  const cblock = Buff.join(block)

  return {
    int_key,
    parity,
    taproot,
    cblock   : cblock.hex,
    tapkey   : tapkey.hex,
    taptweak : taptweak.hex
  }
}
