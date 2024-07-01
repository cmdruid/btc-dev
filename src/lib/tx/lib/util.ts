import { Buff }           from '@cmdcode/buff'
import { check }          from '@/util/index.js'
import { create_address } from '@/lib/address/lib/parse.js'
import { calc_txid }      from './calc.js'
import { encode_tx }      from './encode.js'
import { decode_tx }      from './decode.js'

import {
  create_prevout,
  create_tx
} from './create.js'

import {
  TxPrevout,
  TxBytes,
  TxData,
  TxTemplate,
  TxInput
} from '@/types/index.js'

export function find_prevout (
  address   : string,
  txdata    : TxData,
  template ?: TxTemplate
) : TxPrevout | null {
  const vout = txdata.vout.findIndex(txout => {
    return address === create_address(txout.scriptPubKey)
  })
  if (vout !== -1) {
    const txid    = calc_txid(txdata)
    const prevout = txdata.vout[vout]
    return create_prevout({ ...template, txid, vout, prevout })
  } else {
    return null
  }
}

export function check_witness (vin : TxInput[]) : boolean {
  /** Check if any witness data is present. */
  for (const txin of vin) {
    if (!check.is_empty(txin.witness)) return true
  }
  return false
}


export function parse_tx (
  txdata : TxBytes | TxData | TxTemplate
) : TxData {
  return (check.is_bytes(txdata))
    ? decode_tx(txdata)
    : create_tx(txdata)
}

export function buffer_tx (
  txdata : TxBytes | TxData | TxTemplate
) : Buff {
  return (check.is_bytes(txdata))
    ? Buff.bytes(txdata)
    : encode_tx(parse_tx(txdata))
}
