import { Buff, Bytes } from '@vbyte/buff'
import { Assert }      from '@vbyte/micro-lib'

import type { WitnessSize } from '@/types/index.js'

const WIT_LENGTH_BYTE = 1

export function get_witness_size (witness : Bytes[]) : WitnessSize {
  const stack = witness.map(e => Buff.bytes(e))
  const size  = stack.reduce((prev, next) => prev + next.length, 0)
  const vsize = Math.ceil(WIT_LENGTH_BYTE + size / 4) 
  return { total: size, vsize }
}

export function assert_witness (witness : unknown) : asserts witness is Bytes[] {
  Assert.ok(Array.isArray(witness), 'witness must be an array')
  Assert.ok(witness.every(e => Buff.is_bytes(e)), 'witness must be an array of strings or bytes')
}
