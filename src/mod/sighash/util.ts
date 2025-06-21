import { Buff }   from '@cmdcode/buff'
import { Assert } from '@/util/index.js'

import type {
  SigHashOptions,
  TxInput,
  TxData,
} from '@/types/index.js'

export function parse_txinput (
  txdata  : TxData,
  config ?: SigHashOptions
) : TxInput {
  let { txindex, txinput } = config ?? {}
  if (txindex !== undefined) {
    if (txindex >= txdata.vin.length) {
      // If index is out of bounds, throw error.
      throw new Error('Input index out of bounds: ' + String(txindex))
    }
    txinput = txdata.vin.at(txindex)
  }
  Assert.ok(txinput !== undefined)
  return txinput
}

export function format_sigflag (flag : number) {
  return (flag !== 0) ? Buff.num(flag, 1).hex : ''
}

