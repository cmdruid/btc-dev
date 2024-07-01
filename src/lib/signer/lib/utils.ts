import { keys }           from '@cmdcode/crypto-tools'
import { assert }         from '@/util/index.js'
import { parse_tx }       from '@/lib/tx/index.js'
import { get_script_ctx } from '@/lib/script/index.js'

import {
  SigHashOptions,
  TxInput,
  TxBytes,
  TxData,
  ScriptMeta
} from '@/types/index.js'

export const get_pubkey = keys.get_pubkey
export const get_seckey = keys.get_seckey

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

export function parse_vin_meta (
  txdata   : TxBytes | TxData,
  options ?: SigHashOptions
) : ScriptMeta {
  txdata = parse_tx(txdata)
  const { prevout } = parse_txinput(txdata, options)
  assert.ok(prevout !== undefined)
  return get_script_ctx(prevout.scriptPubKey)
}
