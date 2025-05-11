/**
 * Bitcoin Transaction Sequence Field Manipulation
 * 
 * This module provides functionality for encoding and decoding the sequence field in Bitcoin transactions.
 * The sequence field is a 32-bit integer that can be used for various purposes:
 * 
 * 1. Relative timelocks (BIP-68).
 * 2. Custom protocol data.
 * 
 * The implementation follows BIP-68 for timelock functionality, and extends it with a custom protocol
 * that allows additional metadata to be encoded in the sequence field (to be used by on-chain indexers).
 */

/* ===== [ Constants ] ===================================================== */

const TIMELOCK_DISABLE     = 0x80000000  // Bit 31: When set, disables relative timelock per BIP-68.
const TIMELOCK_TYPE        = 0x00400000  // Bit 22: When set, indicates timestamp-based lock; when clear, indicates block-height-based lock.
const TIMELOCK_VALUE_MASK  = 0x0000FFFF  // Bits 0-15: Mask for extracting timelock value (16 bits).
const TIMELOCK_VALUE_MAX   = 0xFFFF      // Maximum value for timelock (2^16 - 1).
const TIMELOCK_GRANULARITY = 512         // Seconds per timestamp unit (BIP-68 specification).

/* ===== [ Types ] ========================================================== */

export type SequenceConfig   = Partial<SequenceTimeLock>
export type SequenceTimeLock = SequenceHeightLock | SequenceStampLock

// Represents a timestamp-based relative timelock.
export interface SequenceStampLock {
  stamp : number     // Unix timestamp in seconds.
  mode  : 'stamp'    // Discriminator for timelock mode.
}

// Represents a block-height-based relative timelock.
export interface SequenceHeightLock {
  height : number     // Block height.
  mode   : 'height'   // Discriminator for heightlock mode.
}

/* ===== [ API ] ============================================================ */

export namespace TxSequence {
  export const encode = encode_sequence
  export const decode = decode_sequence
}

/* ===== [ Encoder ] ======================================================== */

/**
 * Encodes a SequenceData object into a 32-bit integer sequence value
 * 
 * @param data - The sequence data to encode
 * @returns A 32-bit integer representing the encoded sequence
 * @throws Error if the input data is invalid or exceeds maximum values
 */
function encode_sequence (data : SequenceConfig): number {
  // If the timelock is based on a block height,
  if (data.mode === 'height') {
    // Validate the height value.
    const height = parse_height(data.height)
    // For heightlock, only encode the height value (TIMELOCK_TYPE bit remains clear)
    return (height & TIMELOCK_VALUE_MASK) >>> 0
  }
  // If the timelock is based on a timestamp,
  if (data.mode === 'stamp') {
    // Convert timestamp to 512-second granularity units as per BIP-68.
    const stamp = parse_stamp(data.stamp)
    // Set the TIMELOCK_TYPE bit and encode the timestamp value.
    return (TIMELOCK_TYPE | (stamp & TIMELOCK_VALUE_MASK)) >>> 0
  }
  // Throw an error if the mode is unrecognized.
  throw new Error('invalid timelock mode: ' + data.mode)
}

/* ===== [ Decoder ] ========================================================= */

/**
 * Decodes a 32-bit sequence value into a SequenceData object
 * 
 * @param sequence - The 32-bit sequence value to decode
 * @returns A SequenceData object or null if the sequence doesn't represent special data
 * @throws Error if the sequence value is invalid or exceeds maximum values
 */
function decode_sequence (sequence: number | string) : SequenceTimeLock | null {
  // Parse and validate the sequence value.
  const seq = parse_sequence(sequence)
  // If the sequence is disabled, return null.
  if (seq & TIMELOCK_DISABLE) return null
  // Extract the value.
  const value = seq & TIMELOCK_VALUE_MASK
  // Check for timestamp-based lock (TIMELOCK_TYPE bit is set).
  if (seq & TIMELOCK_TYPE) {
    // Convert granularity units back to seconds for timestamp.
    const stamp = value * TIMELOCK_GRANULARITY
    // Validate the timestamp value.
    if (stamp > 0xFFFFFFFF) {
      throw new Error('Decoded timestamp exceeds 32-bit limit')
    }
    // Return the decoded timelock.
    return { mode: 'stamp', stamp }
  } else {
    // Validate the height value.
    if (value > TIMELOCK_VALUE_MAX) {
      throw new Error('Decoded height exceeds maximum')
    }
    // Return the decoded heightlock.
    return { mode: 'height', height: value }
  }
}

/* ===== [ Helpers ] ========================================================= */

/**
 * Parses a sequence value into a number.
 * 
 * @param sequence - The sequence value to parse.
 * @returns The parsed sequence value.
 * @throws Error if the sequence value is invalid.
 */
function parse_sequence (sequence: number | string): number {
  const seq = (typeof sequence === 'string')
    ? parseInt(sequence, 16)
    : sequence
  if (!Number.isInteger(seq) || seq < 0 || seq > 0xFFFFFFFF) {
    throw new Error(`invalid sequence value: ${seq}`)
  }
  return seq
}

/**
 * Parses a timestamp value into a 512-second granularity units.
 * 
 * @param stamp - The timestamp value to parse.
 * @returns The parsed timestamp value.
 * @throws Error if the timestamp value is invalid.
 */
function parse_stamp (stamp? : number) : number {
  if (stamp === undefined || !Number.isInteger(stamp)) {
    throw new Error(`timestamp must be a number`)
  }
  // Convert timestamp to 512-second granularity units as per BIP-68.
  const ts = Math.floor(stamp / TIMELOCK_GRANULARITY)
  // Validate the timestamp value.
  if (!Number.isInteger(ts) || ts < 0 || ts > TIMELOCK_VALUE_MAX) {
    throw new Error(`timelock value must be an integer between 0 and ${TIMELOCK_VALUE_MAX} (in 512-second increments)`)
  }
  return ts
}

/**
 * Parses a height value into a number.
 * 
 * @param height - The height value to parse.
 * @returns The parsed height value.
 * @throws Error if the height value is invalid.
 */
function parse_height (height? : number) : number {
  if (height === undefined || !Number.isInteger(height) || height < 0 || height > TIMELOCK_VALUE_MAX) {
    throw new Error(`Heightlock value must be an integer between 0 and ${TIMELOCK_VALUE_MAX}`)
  }
  return height
}
