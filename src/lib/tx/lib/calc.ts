import { hash256 }   from '@cmdcode/crypto-tools/hash'
import { encode_tx } from './encode.js'
import { parse_tx }  from './util.js'

import {
  SizeData,
  TxBytes,
  TxData,
} from '@/types/index.js'

export function calc_txid (
  txdata : TxData | TxBytes
) : string {
  const json = parse_tx(txdata)
  const data = encode_tx(json, true)
  return hash256(data).reverse().hex
}

export function calc_txsize (
  txdata : TxData | TxBytes
) : SizeData {
  const json   = parse_tx(txdata)
  const bsize  = encode_tx(json, true).length
  const fsize  = encode_tx(json, false).length
  const weight = bsize * 3 + fsize
  const remain = (weight % 4 > 0) ? 1 : 0
  const vsize  = Math.floor(weight / 4) + remain
  return { size: fsize, bsize, vsize, weight }
}