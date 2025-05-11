import { Buff, Bytes }             from '@cmdcode/buff'
import { Assert, ECC }             from '@/util/index.js'
import { merkleize }               from './tree.js'
import { TAPLEAF_DEFAULT_VERSION } from '../const.js'
import { TxSchema }                from '../schema.js'

import {
  encode_tapbranch,
  encode_taptweak
} from './encode.js'

import {
  parse_pubkey_parity,
  parse_cblock
} from './parse.js'

import {
  TaprootConfig,
  TaprootContext
} from '../types/index.js'

const DEFAULT_VERSION = TAPLEAF_DEFAULT_VERSION

export function create_taproot (config : TaprootConfig) : TaprootContext {
  validate_taproot_config(config)

  const { pubkey, version = DEFAULT_VERSION } = config

  const leaves = config.leaves ?? []

  const target = (config.target !== undefined)
    ? Buff.bytes(config.target).hex 
    : undefined

  let path    : string[] = [],
      taproot : string | undefined

  if (leaves.length > 0) {
    // Merkelize the leaves into a root hash (with proof).
    const [ root, _, proofs ] = merkleize(leaves, target)
    // Get the control path from the merkelized output.
    path    = proofs
    // Get the tapped key from the internal key.
    taproot = root
  } else {
    // Get the tapped key from the single tapleaf.
    taproot = target
  }

  const taptweak = encode_taptweak(pubkey, taproot)
  const twk_key  = ECC.tweak_pubkey(pubkey, taptweak, 'ecdsa')
  const parity   = parse_pubkey_parity(twk_key)
  const tapkey   = ECC.serialize_pubkey(twk_key, 'bip340')
  // Get the block version / parity bit.
  const cbit = Buff.num(version + parity)
  // Stack the initial control block data.
  const block : Bytes[] = [ cbit, Buff.bytes(pubkey) ]
  // If there is more than one path, add to block.
  if (path.length > 0) {
    path.forEach(e => block.push(e))
  }
  // Merge the data together into one array.
  const cblock = Buff.join(block)

  return {
    int_key  : Buff.bytes(pubkey).hex,
    parity,
    taproot  : taproot ?? null,
    cblock   : cblock.hex,
    tapkey   : tapkey.hex,
    taptweak : taptweak.hex
  }
}

export function verify_cblock (
  tapkey : string,
  target : string,
  cblock : string
) : boolean {
  Assert.size(tapkey, 32)
  const { parity, path, int_key } = parse_cblock(cblock)

  const ext_key = Buff.join([ parity, tapkey ])

  let branch = Buff.bytes(target).hex

  for (const leaf of path) {
    branch = encode_tapbranch(branch, leaf).hex
  }

  const tap_tweak   = encode_taptweak(int_key, branch)
  const tweaked_key = ECC.tweak_pubkey(int_key, tap_tweak, 'ecdsa')

  return (ext_key.hex === tweaked_key.hex)
}

export function validate_taproot_config (
  config : unknown,
  debug  : boolean = false
) : asserts config is TaprootConfig {
  const schema = TxSchema.tap_config
  const result = schema.safeParse(config)
  if (!result.success) {
    if (debug) console.log(result.error)
    console.log('taproot configuration failed validation:')
    console.dir(config, { depth : null })
    throw new Error('invalid taproot config')
  }
}