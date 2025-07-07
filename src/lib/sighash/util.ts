import { Buff }   from '@vbyte/buff'
import { Assert } from '@vbyte/micro-lib'
import { sha256 } from '@vbyte/micro-lib/hash'

import type {
  SigHashOptions,
  TxInput,
  TxData,
  TxOutput,
} from '@/types/index.js'

export function get_prevout (vin : TxInput) : TxOutput {
  Assert.exists(vin.prevout, 'Prevout data missing for input: ' + String(vin.txid))
  return vin.prevout
}

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

export function get_annex_data (
  witness ?: string[]
) : Buff | undefined {
  // If no witness exists, return undefined.
  if (witness === undefined) return
  // If there are less than two elements, return undefined.
  if (witness.length < 2) return
  // Define the last element as the annex.
  const annex = witness.at(-1)
  // If the annex is a string and starts with '50',
  if (typeof annex === 'string' && annex.startsWith('50')) {
    // Convert the annex to a buffer with a varint prefix.
    const bytes = Buff.hex(annex).prefix_varint('be')
    // Return the sha256 of the annex.
    return sha256(bytes)
  }
  // Else, return undefined.
  return undefined
}
