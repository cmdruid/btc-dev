import { Test }             from 'tape'
import { parse_error }      from '@vbyte/micro-lib/util'
import { parse_tx }         from '@/lib/tx/parse.js'
import { create_tx_output } from '@/lib/tx/create.js'
import * as SIGHASH         from '@/lib/sighash/taproot.js'

import TEST_VECTORS from './unit.vec.json' with { type: 'json' }

export default function (t : Test) {
  t.test('Test the sighash construction.', t => {
    for (let i = 0; i < TEST_VECTORS.length; i++) {

      try {
        const { txhex, prevouts, hash } = TEST_VECTORS[i]
        t.comment(`Testing tx vector ${i}:`)
        const tx   = parse_tx(txhex, prevouts)
        const prev = prevouts.map(create_tx_output)

        const amounts   = SIGHASH.bip341_hash_amounts(prev).hex
        t.equal(amounts, hash.amounts, 'The amounts should match.')
        const outputs   = SIGHASH.bip341_hash_outputs(tx.vout).hex
        t.equal(outputs, hash.outputs, 'The outputs should match.')
        const outpoints = SIGHASH.bip341_hash_outpoints(tx.vin).hex
        t.equal(outpoints, hash.prevouts, 'The outpoints should match.')
        const scripts   = SIGHASH.bip341_hash_scripts(prev).hex
        t.equal(scripts, hash.scripts, 'The scripts should match.')
        const sequences = SIGHASH.bip341_hash_sequence(tx.vin).hex
        t.equal(sequences, hash.sequences, 'The sequences should match.')
      } catch (err) {
        console.error(err)
        t.fail(parse_error(err))
      }
    }

    t.end()
  })
}
