import { Buff }               from '@vbyte/buff'
import { Test }               from '@vbyte/micro-lib'
import { Assert }             from '@vbyte/micro-lib/assert'
import { hash256 }            from '@vbyte/micro-lib/hash'
import { decode_tx }          from './decode.js'
import { encode_tx }          from './encode.js'
import { parse_tx }           from './parse.js'
import { assert_tx_template } from './validate.js'

import { DEFAULT } from '@/const.js'

import type {
  TxData,
  TxOutput,
  TxOutputTemplate,
  TxValue
} from '@/types/index.js'

export function transcode_tx (
  txdata : string | Uint8Array,
  use_segwit = true
) : Buff {
  console.log('txdata:', txdata)
  // Decode the transaction data.
  const decoded = decode_tx(txdata)
  console.log('decoded:', decoded)
  // Re-encode and return the encoded transaction data.
  return encode_tx(decoded, use_segwit)
}

export function get_txid (txdata : string | Uint8Array | TxData) : string {
  let buffer : Uint8Array

  if (txdata instanceof Uint8Array) {
    // Set the buffer to the transaction data.
    buffer = transcode_tx(txdata, false)
  } else if (typeof txdata === 'object') {
    // Assert the structure of the transaction data is valid.
    assert_tx_template(txdata)
    // Encode the transaction data.
    buffer = encode_tx(txdata, false)
  } else if (typeof txdata === 'string') {
    // Assert the transaction data is a hex string.
    Assert.is_hex(txdata)
    // Convert the hex string to a Uint8Array.
    buffer = transcode_tx(txdata, false)
  } else {
    throw new TypeError('invalid txdata type: ' + typeof txdata)
  }
  // Return the txid of the transaction data.
  return hash256(buffer).reverse().hex
}

export function get_txhash (txdata : string | Uint8Array | TxData) : string {
  // If the transaction data is an object,
  if (typeof txdata === 'object') {
    // Assert the structure of the transaction data is valid.
    assert_tx_template(txdata)
    // Encode the transaction data.
    txdata = encode_tx(txdata, true)
  }
  // Return the txhash of the transaction data.
  return hash256(txdata).reverse().hex
}

export function get_tx_value (txdata : string | Uint8Array | TxData) : TxValue {
  // Parse the transaction data.
  const tx = parse_tx(txdata)
  // Assert the structure of the transaction data is valid.
  assert_tx_template(tx)
  // Calculate the value of the transaction.
  const vin  = tx.vin.reduce((acc, txin) => acc + (txin.prevout?.value ?? 0n), 0n)
  const vout = tx.vout.reduce((acc, txout) => acc + txout.value, 0n)
  const fees = (vin > vout) ? (vin - vout) : 0n
  // Return the value of the transaction.
  return { fees, vin, vout }
}

export function get_prevouts (txdata : TxData) : TxOutput[] {
  // Assert the structure of the transaction data is valid.
  assert_tx_template(txdata)
  // Collect the prevouts from the transaction.
  const prevouts = txdata.vin.map(e => e.prevout)
  // Assert that all the prevouts are defined.
  Assert.ok(prevouts.every(e => e !== null), 'prevouts missing from tx')
  // Return the array of prevouts.
  return prevouts
}

export function normalize_sequence (sequence? : number | string | null) : number {
  // If sequence is not defined, return a default sequence value.
  if (!Test.exists(sequence)) return DEFAULT.SEQUENCE
  // If sequence is a hex string, decode it and return the number value.
  if (Test.is_hex(sequence)) return Buff.hex(sequence as string, 4).reverse().num
  // If sequence is a valid unsigned integer, return the value.
  if (Test.is_uint(sequence)) return sequence
  // Else, throw an error.
  throw new Error('invalid sequence value: ' + String(sequence))
}

export function normalize_value (value : number | bigint) : bigint {
  // If value is a unsigned integer, return it as a bigint.
  if (Test.is_uint(value)) return BigInt(value)
  // If value is a bigint, return it as-is.
  if (typeof value === 'bigint') return value
  // Else, throw an error.
  throw new TypeError('invalid output value: ' + String(value))
}

export function normalize_prevout (prevout : TxOutputTemplate) : TxOutput {
  // Return the output with a normalized value.
  return { script_pk: prevout.script_pk, value: normalize_value(prevout.value) }
}
