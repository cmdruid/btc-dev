const MAX_VAL    = 0xFFFFFFFF
const NO_LOCK    = (1 << 31)
const TIME_LOCK  = (1 << 22)
const LOCK_MASK  = 0x0000FFFF
const TIME_SHIFT = 9
const MAX_BLOCKS = LOCK_MASK - 1
const MAX_STAMP  = (LOCK_MASK << TIME_SHIFT) - 1
const LOCK_THOLD = 500_000_000

export default {
  MAX_VAL,
  NO_LOCK,
  TIME_LOCK,
  LOCK_MASK,
  TIME_SHIFT,
  MAX_BLOCKS,
  MAX_STAMP,
  LOCK_THOLD
}
