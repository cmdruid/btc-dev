import { Buff, Bytes } from '@vbyte/buff'

import type { WitnessSize } from '@/types/index.js'

const WIT_LENGTH_BYTE = 1

export function get_witness_size (witness : Bytes[]) : WitnessSize {
  const stack = witness.map(e => Buff.bytes(e))
  const size  = stack.reduce((prev, next) => prev + next.length, 0)
  const vsize = Math.ceil(WIT_LENGTH_BYTE + size / 4) 
  return { total: size, vsize }
}
