import { Test }              from 'tape'
import { Buff }              from '@vbyte/buff'
import { parse_tx }          from '@/src/tx'
import { hash_segwit_tx }    from '@/src/sighash'
import { secp256k1 as secp } from '@noble/curves/secp256k1'

import {
  sign_segwit_tx,
  verify_segwit_tx
} from '@/src/signer'

import type { TxData } from '@/src'


import test_data from './bip0143.vectors.json' with { type: 'json' }

export function sighash_vector_test(t :Test) {
  t.test('Testing segwit sighash vectors.', t => {
    const { redeemScript, txdata, sign_vectors } = test_data

    const tx = parse_tx(txdata)

    t.plan(sign_vectors.length * 4)
    for (const vector of sign_vectors) {
      const { label, hashType, sigHash, } = vector
      const { pubkey, seckey, signature } = vector
      const sigflag = Buff.hex(hashType, 4).reverse().num
      const config  = { sigflag, pubkey, script: redeemScript, throws: true }
      const index   = 0

      t.comment(`Testing ${label}:`)

      // console.log('seckey:', seckey)
      // console.log('pubkey:', pubkey)
      // console.log('hash:', sigHash)
      // console.log('signature:', signature)
    
      try {
        const hash = hash_segwit_tx(tx, { txindex: index, ...config })
        t.equal(hash.hex, sigHash, 'Sighash should be equal.')
      } catch (err : any) {
        t.fail(err.message)
      }

      try {
        const txcopy = { ...tx } as TxData
        const sig = sign_segwit_tx(seckey, txcopy, { txindex: index, ...config })
        t.equal(sig, signature, 'Signatures should be equal.')
        const nobleVerify = secp.verify(sig.slice(0, -2), sigHash, pubkey)
        t.equal(nobleVerify, true, 'Signature should be valid using Noble.')
        txcopy.vin[index].witness = [ sig, pubkey, redeemScript ]
        const signerVerify = verify_segwit_tx(txcopy, { txindex: index, ...config })
        t.equal(signerVerify, true, 'Signature should be valid using Signer.')
      } catch (err : any) {
        t.fail(err.message)
      }
    }
  })
}
