import { Test }        from 'tape'
import { parse_error } from '@vbyte/util/helpers'
import { parse_tx }    from '@/lib/tx/parse.js'

import { get_taproot_tx_preimage, hash_taproot_tx } from '@/lib/sighash/taproot.js'

import TEST_VECTORS from './sighash.vec.json' with { type: 'json' }

export default function (t : Test) {
  t.test('Test the sighash construction.', t => {
    for (let i = 0; i < TEST_VECTORS.length; i++) {
      const { txhex, prevouts, vectors } = TEST_VECTORS[i]
      t.comment(`Testing tx vector ${i}:`)
      const tx = parse_tx(txhex, prevouts)

      t.equal(tx.vin.length, prevouts.length, 'The tx inputs should match.')

      for (const { txindex, sigflag, preimage, sighash } of vectors) {

        try {
          t.comment(`Testing index ${txindex} with sigflag ${sigflag}:`)
          const actual_preimage = get_taproot_tx_preimage (tx, { txindex, sigflag })
          t.equal(actual_preimage.hex, preimage, 'The preimage should match.')
          const actual_sighash  = hash_taproot_tx(tx, { txindex, sigflag })
          t.equal(actual_sighash.hex, sighash, 'The sighash should match.')
        } catch (error) {
          console.error(error)
          t.fail(parse_error(error))
        }
      }
    }

    t.end()
  })
}
