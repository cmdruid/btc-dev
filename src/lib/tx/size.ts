import { Buff, Bytes }   from '@vbyte/buff'
import { parse_tx_data } from './parse.js'

import {
  encode_tx_data,
  encode_tx_inputs,
  encode_tx_outputs,
  encode_tx_vout,
  encode_vin,
  encode_vin_witness
} from './encode.js'

import type {
  TxData,
  TxInput,
  TxOutput,
  TxSize,
  WitnessSize,
} from '@/types/index.js'

const WIT_FLAG_BYTES = 2

export function get_txsize (
  txdata : string | TxData
) : TxSize {
  const json   = parse_tx_data(txdata)
  const base   = encode_tx_data(json, false).length
  const size   = encode_tx_data(json, true).length
  const weight = base * 3 + size
  const remain = (weight % 4 > 0) ? 1 : 0
  const vsize  = Math.floor(weight / 4) + remain
  return { base, real: size, vsize, weight }
}

export function get_vin_size (vin : TxInput[]) : number {
  const bytes = encode_tx_inputs(vin)
  return bytes.length
}

export function get_vout_size (vout : TxOutput[]) : number {
  const bytes = encode_tx_outputs(vout)
  return bytes.length
}

export function get_segwit_size (txinputs : TxInput[]) : number {
  const segwit_data = txinputs
    .filter(e => e.witness.length > 0)
    .map(e => e.witness)
  return WIT_FLAG_BYTES + segwit_data
    .reduce((acc, e) => acc + encode_vin_witness(e).length, 0)
}

export function get_txin_size (txinput : TxInput) : number {
  const bytes = encode_vin(txinput)
  return bytes.length
}

export function get_txout_size (txoutput : TxOutput) : number {
  const bytes = encode_tx_vout(txoutput)
  return bytes.length
}

export function get_witness_size (witness : Bytes[]) : WitnessSize {
  const hex   = witness.map(e => Buff.bytes(e).hex)
  const bytes = encode_vin_witness(hex)
  const size  = bytes.length / 2
  const vsize = Math.ceil((size) / 4)
  return { size, vsize }
}
