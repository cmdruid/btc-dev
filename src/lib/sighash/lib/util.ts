import { assert } from '@/util/index.js'

import {
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
  assert.ok(txinput !== undefined)
  return txinput
}
