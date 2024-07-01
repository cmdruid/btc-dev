import { Buff }         from '@cmdcode/buff'
import { TimelockData } from '@/types/index.js'

import CONST from '../const.js'

export function validate_sequence (
  sequence : TimelockData
) : void {
  const { enabled, blocks, stamp, value } = sequence
  if (enabled) {
    if (value > CONST.MAX_VAL) {
      throw new Error('Sequence value exceeds maximum:' + String(value))
    }
    if (blocks !== null && blocks > CONST.MAX_BLOCKS) {
      throw new Error('Sequence block height exceeds maximum: ' + String(blocks))
    }
    if (stamp !== null && stamp > CONST.MAX_STAMP) {
      throw new Error('Sequence time value exceeds maximum: ' + String(stamp))
    }
  }
}

export function parse_value (input : string | number) {
  return (typeof input === 'string')
  ? Buff.hex(input).reverse().num
  : input
}
