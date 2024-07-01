import CONST from '../const.js'

export function create_sequence (
  type  : 'block' | 'stamp',
  value : number
) {
  let seq = CONST.LOCK_MASK
  if (type === 'stamp') {
    seq &= value >>> CONST.TIME_SHIFT
    seq |= CONST.TIME_LOCK
  } else {
    seq &= value
  }
  return seq
}
