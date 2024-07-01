import { Buff, Bytes }     from '@cmdcode/buff'
import { get_taproot_ctx } from './ctx.js'
import { parse_cblock }    from './decode.js'
import { assert }          from '@/util/index.js'

import {
  encode_tapbranch,
  encode_tapscript
} from './encode.js'

import {
  get_taptweak,
  tweak_pubkey
} from './tweak.js'

import { ScriptWord } from '@/types/index.js'

export function get_taproot_key (
  int_key  : string,
  scripts  : Array<ScriptWord[]>,
  version ?: number
) {
  const leaves  = scripts.map(e => encode_tapscript(e, version))
  const tapdata = get_taproot_ctx({ int_key, leaves })
  return tapdata.tapkey
}

export function get_ctrl_block (
  int_key  : string,
  scripts  : Array<ScriptWord[]> = [],
  target   : ScriptWord[]        = [],
  version ?: number
) {
  const tapleaf = encode_tapscript(target, version)
  const leaves  = scripts.map(e => encode_tapscript(e, version))
  const tapdata = get_taproot_ctx({ int_key, leaves, target : tapleaf })
  return tapdata.cblock
}

export function verify_cblock (
  tapkey : Bytes,
  target : Bytes,
  cblock : Bytes
) : boolean {
  assert.size(tapkey, 32)
  const { parity, path, int_pub } = parse_cblock(cblock)

  const extkey = Buff.join([ parity, tapkey ])

  let branch = Buff.bytes(target).hex

  for (const leaf of path) {
    branch = encode_tapbranch(branch, leaf)
  }

  const twk = get_taptweak(int_pub, branch)
  const key = tweak_pubkey(int_pub, twk)

  // console.log('branch:', branch)
  // console.log('intkey:', int_pub)
  // console.log('extkey:', extkey.hex)
  // console.log('tapkey:', key.hex)

  return (Buff.raw(key).hex === Buff.raw(extkey).hex)
}
