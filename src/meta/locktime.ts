import { Assert } from '@/util/index.js'

/**
 * Represents a timestamp-based relative timelock.
 */
interface TimeLock {
  type  : 'timelock'  // Discriminator for timelock type
  stamp : number      // Unix timestamp in seconds
}

/**
 * Represents a block-height-based relative timelock.
 */
interface HeightLock {
  type   : 'heightlock'  // Discriminator for heightlock type
  height : number        // Block height value
}

export type LockTimeData = TimeLock | HeightLock

// The threshold between block height and timestamp.
const LOCKTIME_THRESHOLD = 500000000

export namespace TxLockTime {
  export type Type    = LockTimeData
  export const encode = encode_locktime
  export const decode = decode_locktime
}

/**
 * Encodes a LockTimeData object into a string representation.
 * According to BIP-65, the value is simply the numeric value as a string.
 */
function encode_locktime (
  locktime : LockTimeData
) : number {
  switch (locktime.type) {
    case 'timelock':
      Assert.ok(locktime.stamp >= LOCKTIME_THRESHOLD, 'Invalid timestamp')
      return locktime.stamp
    case 'heightlock':
      Assert.ok(locktime.height > 0,                  'height must be greater than 0')
      Assert.ok(locktime.height < LOCKTIME_THRESHOLD, 'invalid block height')
      return locktime.height
    default:
      throw new Error('Invalid locktime type')
  }
}

/**
 * Parses a string or number into a LockTimeData object.
 * According to BIP-65, values below LOCKTIME_THRESHOLD are interpreted as block heights,
 * while values at or above this threshold are interpreted as timestamps.
 */
function decode_locktime (
  locktime : number
) : LockTimeData | null{
  // Check if the value is valid (non-negative)
  if (isNaN(locktime) || locktime <= 0) {
    return null
  }
  // Return the appropriate locktime type.
  if (locktime < LOCKTIME_THRESHOLD) {
    return {
      type   : 'heightlock',
      height : locktime
    }
  } else {
    return {
      type  : 'timelock',
      stamp : locktime
    }
  }
}