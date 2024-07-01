import { parse_value } from './util.js'

import {
  LockType,
  TimelockData
} from '@/types/index.js'

import CONST from '../const.js'

export function parse_locktime (
  locktime : string | number
) : TimelockData {
  const value   = parse_value(locktime)
  const enabled = (value > 0)
    let type : LockType = null
  if (enabled) {
    type = (value > CONST.LOCK_THOLD) ? 'stamp' : 'block'
  }
  const blocks = (type === 'block') ? value : null
  const stamp  = (type === 'stamp') ? value : null
  return { value, blocks, stamp, type, enabled }
}

export function parse_sequence (
  sequence : string | number
) : TimelockData {
  const value   = parse_value(sequence)
  const enabled = value !== CONST.MAX_VAL && (value & CONST.NO_LOCK) !== CONST.NO_LOCK
    let type : LockType = null
  if (enabled) {
    type = ((value & CONST.TIME_LOCK) === CONST.TIME_LOCK) ? 'stamp' : 'block'
  }
  const masked = (value & CONST.LOCK_MASK)
  const blocks = (type === 'block') ? masked : null
  const stamp  = (type === 'stamp') ? masked << CONST.TIME_SHIFT : null
  return { value, blocks, stamp, type, enabled }
}
