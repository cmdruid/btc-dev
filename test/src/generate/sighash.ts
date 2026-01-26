import { Buff }             from '@vbyte/buff'
import { generate_tx_data } from './txdata.js'

import * as Tx      from '@/pkg/tx'
import * as SigHash from '@/pkg/sighash'

import type { TxOutputTemplate } from '@/pkg'

import type {
  SighashInputVector,
  SighashVector,
  TaprootSighashMidstate,
} from '@/test/types.js'
import { sha256 } from '@vbyte/crypto'
import { assert_tx_spend_data } from '@/pkg/tx'

/**
 * Generate the midstate vectors.
 * @param txdata - The tx data.
 * @param prevouts - The prevouts.
 * @returns The midstate.
 */
export function generate_midstate_vectors (
  txdata   : unknown,
  prevouts : TxOutputTemplate[]
) : TaprootSighashMidstate {
  // Parse the tx data.
  const tx   = Tx.parse_tx(txdata, prevouts)
  // Get the prevouts.
  const prev = Tx.get_prevouts(tx)
  // Generate the midstate.
  const outpoints_hash = SigHash.bip341_hash_outpoints(tx.vin).hex
  const outputs_hash   = SigHash.bip341_hash_outputs(tx.vout).hex
  const amounts_hash   = SigHash.bip341_hash_amounts(prev).hex
  const scripts_hash   = SigHash.bip341_hash_scripts(prev).hex
  const sequences_hash = SigHash.bip341_hash_sequence(tx.vin).hex
  // Return the midstate.
  return {
    outpoints_hash,
    outputs_hash,
    amounts_hash,
    scripts_hash,
    sequences_hash
  }
}

/**
 * Generate the sighash vectors.
 * @returns The sighash vectors.
 */
export function generate_sighash_vectors () : SighashVector {
  const tx_vec   = generate_tx_data()
  const txdata   = Tx.parse_tx(tx_vec.txhex, tx_vec.prevouts)

  assert_tx_spend_data(txdata)

  const vectors : SighashInputVector[] = []

  for (let idx = 0; idx < tx_vec.prevouts.length; idx++) {
    const seckey   = tx_vec.prevouts[idx].seckey
    const txindex  = idx
    const sigflag  = Buff.random(1).num % 4
    const preimage = SigHash.get_taproot_tx_preimage(txdata, { sigflag, txindex }).hex
    const sighash  = sha256(preimage).hex
    // Add the vector to the vectors array.
    vectors.push({ seckey, txindex, sigflag, preimage, sighash })
  }
  // Return the txhex and vectors.
  return { ...tx_vec, vectors }
}
