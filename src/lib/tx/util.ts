import { Buff, Bytes }        from '@vbyte/buff'
import { Test }               from '@vbyte/micro-lib'
import { Assert }             from '@vbyte/micro-lib/assert'
import { hash256 }            from '@vbyte/micro-lib/hash'
import { encode_tx }          from './encode.js'
import { assert_tx_template } from './validate.js'

import { DEFAULT, LOCK_SCRIPT_REGEX } from '@/const.js'

import type {
  TxData,
  TxOutput,
  TxOutputInfo,
  TxOutputTemplate,
  TxOutputType,
  TxValue,
  WitnessVersion
} from '@/types/index.js'

export function is_return_script (script : Bytes) : boolean {
  const bytes = Buff.bytes(script)
  return bytes.at(0) === 0x6a
}

export function get_vout_script_info (script : Bytes) : TxOutputInfo {
  return {
    type    : get_vout_script_type(script),
    version : get_vout_script_version(script)
  }
}

export function get_vout_script_type (
  script : Bytes
) : TxOutputType | null {
  const hex = Buff.bytes(script).hex
  for (const [ type, regex ] of Object.entries(LOCK_SCRIPT_REGEX)) {
    if (regex.test(hex)) return type as TxOutputType
  }
  return null
}

export function get_vout_script_version (
  script : Bytes
) : WitnessVersion | null{
  const version = Buff.bytes(script)
  switch (version.at(0)) {
    case 0x00 : return 0
    case 0x51 : return 1
    default   : return null
  }
}

export function get_txid (
  txdata : TxData
) : string {
  assert_tx_template(txdata)
  const data = encode_tx(txdata, false)
  return hash256(data).reverse().hex
}

export function get_txhash (
  txdata : TxData
) : string {
  assert_tx_template(txdata)
  const data = encode_tx(txdata, true)
  return hash256(data).reverse().hex
}

export function get_tx_value (
  txdata : TxData
) : TxValue {
  const vin  = txdata.vin.reduce((acc, txin) => acc + (txin.prevout?.value ?? 0n), 0n)
  const vout = txdata.vout.reduce((acc, txout) => acc + txout.value, 0n)
  const fees = (vin > vout) ? (vin - vout) : 0n
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
