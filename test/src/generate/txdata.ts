import { Buff }                   from '@vbyte/buff'
import { get_pubkey, get_seckey } from '@vbyte/crypto/ecc'

import * as Tx from '@/pkg/tx'

import type {
  TxDataVector,
  TxPrevoutVector
} from '@/test/types.js'

export function generate_tx_data (
  vin_count? : number
) : TxDataVector {
  const tx    = Tx.create_tx()
  const count = vin_count ?? Buff.random(1).num % 10 + 1
  const prevouts : TxPrevoutVector[] = []

  for (let idx = 0; idx < count; idx++) {
    // Create a random seckey and pubkey.
    const seckey    = get_seckey(Buff.random(32))
    const pubkey    = get_pubkey(seckey, 'bip340')
    const prevout   = {
      script_pk : '5120' + pubkey,
      value     : Buff.random(4).num + 1000,
      seckey    : seckey.hex
    }
    // Create a random tx output.
    const tx_output = Tx.create_tx_output(prevout)
    // Create a random tx input.
    const tx_input  = Tx.create_tx_input({
      txid     : Buff.random(32).hex,
      vout     : Buff.random(2).num,
      sequence : Buff.random(4).num
    })
    // Add the tx output to the prevouts array.
    prevouts.push(prevout)
    // Add the tx input and output to the tx.
    tx.vin.push(tx_input)
    tx.vout.push(tx_output)
  }
  // Return the tx data.
  const txhex = Tx.encode_tx(tx).hex
  // Return the test vector.
  return { txhex, prevouts }
}