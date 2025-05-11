import { hash256 }        from '@/util/index.js'
import { parse_tx_data }  from './parse.js'
import { encode_tx_data } from './encode.js'

import type {
  TxData,
  TxOutput,
  TxOutputType,
  TxSize,
  VirtualInput,
  WitnessVersion
} from '../types/index.js'

import { LOCK_SCRIPT_REGEX, TX_SIZE } from '../const.js'

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
  const json = parse_tx_data(txdata)
  const data = encode_tx_data(json, false)
  return hash256(data).reverse().hex
}

export function get_txsize (
  txdata : string | TxData
) : TxSize {
  const json   = parse_tx_data(txdata)
  const base   = encode_tx_data(json, false).length
  const full   = encode_tx_data(json, true).length
  const weight = base * 3 + full
  const remain = (weight % 4 > 0) ? 1 : 0
  const vsize  = Math.floor(weight / 4) + remain
  return { base, full, vsize, weight }
}

export function get_txin_size (
  txinput : VirtualInput
) : number {
  const base_size = TX_SIZE.TXIN_BASE
  const sig_size  = txinput.script_sig
    ? txinput.script_sig.length / 2
    : 1
  const wit_size  = get_witness_vsize(txinput.witness)
  return base_size + sig_size + wit_size
}

export function get_txout_size (
  txoutput : TxOutput
) : number {
  const base_size   = TX_SIZE.TXOUT_BASE
  const script_size = txoutput.script_pk.length / 2
  return base_size + script_size
}

export function get_witness_vsize (
  witness : string[]
) : number {
  const push_bytes = witness.length + 1
  const data_bytes = (witness.length > 0)
    ? witness.join('').length / 2
    : 0
  return Math.ceil((push_bytes + data_bytes) / 4)
}
