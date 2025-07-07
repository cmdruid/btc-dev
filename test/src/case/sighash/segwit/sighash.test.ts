import { Test }              from 'tape'
import { Buff }              from '@vbyte/buff'
import { parse_tx }          from '@/lib/tx/parse.js'
import { hash_segwit_tx }    from '@/lib/sighash/segwit.js'
import { secp256k1 as secp } from '@noble/curves/secp256k1'

import {
  sign_segwit_tx,
  verify_tx
} from '@/lib/signer/index.js'

import type { TxData } from '@/types/index.js'

import VECTORS from './sighash.vec.json' with { type: 'json' }

export default function (t :Test) {

  t.test('Testing segwit sighash vectors.', t => {
    const { redeemScript, txdata, sign_vectors } = VECTORS

    for (const vector of sign_vectors) {
      const { label, hashType, sigHash, pubkey, seckey, signature } = vector

      const tx      = parse_tx(txdata)
      const txindex = 0
      const sigflag = Buff.hex(hashType, 4).reverse().num
      const config  = { txindex, sigflag, pubkey, script: redeemScript, throws: true }

      t.comment(`Testing ${label}:`)
    
      try {
        const hash = hash_segwit_tx(tx, config)
        t.equal(hash.hex, sigHash, 'sighash should be equal.')
      } catch (err : any) {
        t.fail(err.message)
      }

      try {
        const txcopy = { ...tx } as TxData
        const sig = sign_segwit_tx(seckey, txcopy, config)
        t.equal(sig, signature, 'Signatures should be equal.')
        const nobleVerify = secp.verify(sig.slice(0, -2), sigHash, pubkey)
        t.equal(nobleVerify, true, 'Signature should be valid using Noble.')
        txcopy.vin[txindex].witness = [ sig, pubkey, redeemScript ]
        const signerVerify = verify_tx(txcopy, config)
        t.equal(signerVerify, true, 'Signature should be valid using Signer.')
      } catch (err : any) {
        t.fail(err.message)
      }
    }

    t.end()
  })
}
