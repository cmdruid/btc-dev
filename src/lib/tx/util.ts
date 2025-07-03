import { hash256 }             from '@vbyte/micro-lib/hash'
import { LOCK_SCRIPT_REGEX }   from '@/const.js'
import { encode_tx }           from './encode.js'
import { parse_tx }            from './parse.js'

import type {
  TxData,
  TxOutput,
  TxOutputInfo,
  TxOutputType,
  TxValue,
  WitnessVersion
} from '@/types/index.js'

export function is_return_script (script : string) : boolean {
  return script.startsWith('6a')
}

export function get_vout_info (txout : TxOutput) : TxOutputInfo {
  return {
    type    : get_vout_type(txout.script_pk),
    version : get_vout_version(txout.script_pk)
  }
}

export function get_vout_type (
  script : string
) : TxOutputType {
  for (const [ type, regex ] of Object.entries(LOCK_SCRIPT_REGEX)) {
    if (regex.test(script)) return type as TxOutputType
  }
  return 'unknown'
}

export function get_vout_version (
  script : string
) : WitnessVersion {
  const wit_ver = script.slice(0, 4)
  switch (wit_ver) {
    case '0014':
      return 0
    case '5120':
      return 1
    default:
      return null
  }
}

export function get_txid (
  txdata : string | TxData
) : string {
  const json = parse_tx(txdata)
  const data = encode_tx(json, false)
  return hash256(data).reverse().hex
}

export function get_txhash (
  txdata : string | TxData
) : string {
  const json = parse_tx(txdata)
  const data = encode_tx(json, true)
  return hash256(data).reverse().hex
}

export function get_tx_value (
  txdata : string | TxData
) : TxValue {
  const tx   = parse_tx(txdata)
  const vin  = tx.vin.reduce((acc, txin) => acc + (txin.prevout?.value ?? 0n), 0n)
  const vout = tx.vout.reduce((acc, txout) => acc + txout.value, 0n)
  const fees = (vin > vout) ? (vin - vout) : 0n
  return { fees, vin, vout }
}
