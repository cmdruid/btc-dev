import { Buff, Stream }       from '@cmdcode/buff'
import { Assert, ECC }        from '@/util/index.js'
import { parse_witness_data } from '../meta/witness.js'

import {
  encode_tapbranch,
  encode_tapscript,
  encode_taptweak,
} from './encode.js'

import type { ControlBlock } from '../types/index.js'

export function parse_taproot_witness (witness : string[]) {
  const { cblock, params, script } = parse_witness_data(witness)

  Assert.exists(cblock, 'cblock is null')
  Assert.exists(script, 'script is null')

  const cblk   = parse_cblock(cblock)
  const target = encode_tapscript(script, cblk.version)

  let branch = target.hex

  for (const leaf of cblk.path) {
    branch = encode_tapbranch(branch, leaf).hex
  }

  const tweak  = encode_taptweak(cblk.int_key, branch)
  const tapkey = ECC.tweak_pubkey(cblk.int_key, tweak, 'bip340')

  params.map(e => Buff.bytes(e).hex)

  return { cblock: cblk, params, script, tapkey: tapkey.hex, tweak: tweak.hex }
}

export function parse_cblock (cblock : string | Uint8Array) : ControlBlock {
  const buffer  = new Stream(cblock)
  const cbyte   = buffer.read(1).num
  const int_key = buffer.read(32).hex
  const [ version, parity ] = parse_cblock_parity(cbyte)
  const path = []
  while (buffer.size >= 32) {
    path.push(buffer.read(32).hex)
  }
  if (buffer.size !== 0) {
    throw new Error('Non-empty buffer on control block: ' + String(buffer))
  }
  return { int_key, path, parity, version }
}

export function parse_cblock_parity (cbits : number) {
  return (cbits % 2 === 0)
    ? [ cbits - 0, 0x02 ]
    : [ cbits - 1, 0x03 ]
}

export function parse_pubkey_parity (
  pubkey : string | Uint8Array
) : number {
  Assert.size(pubkey, 33, 'invalid pubkey size')
  const [ parity ] = Buff.bytes(pubkey)
  if (parity === 0x02) return 0
  if (parity === 0x03) return 1
  throw new Error('Invalid parity bit: ' + String(parity))
}
