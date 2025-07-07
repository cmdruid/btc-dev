import { Test }              from 'tape'
import { Buff }              from '@vbyte/buff'
import { parse_error }       from '@vbyte/micro-lib/util'
import { schnorr }           from '@noble/curves/secp256k1'
import { parse_tx }          from '@/lib/tx/parse.js'
import { create_tx_output }  from '@/lib/tx/create.js'
import * as ECC              from '@vbyte/micro-lib/ecc'
import { encode_taptweak }   from '@/lib/taproot/encode.js'

import {
  get_taproot_tx_preimage,
  hash_taproot_tx
} from '@/lib/sighash/taproot.js'

import test_vectors from './sig.vectors.json' with { type: 'json' }

const { txhex, utxos, spends } = test_vectors

const tx = parse_tx(txhex)

const prevouts = utxos.map(e => create_tx_output({ ...e, value: BigInt(e.value) }))

export default function (t : Test) {
  t.test('Test vectors for signature hash construction.', async t => {

    const vectors = spends

    tx.vin.map((e, i) => e.prevout = prevouts[i])

    for (const { given, intermediary, expected } of vectors) {

      try {

        // Unpack our vector data.
        const { txinIndex, hashType, internalPrivkey, merkleRoot } = given
        const { sigHash, sigMsg, tweak, internalPubkey, tweakedPrivkey }   = intermediary

        let { witness : [ witsig ] } = expected

        witsig = witsig.slice(0, 128)

        // Test our ability to create the tweak.
        const taptweak    = encode_taptweak(internalPubkey, merkleRoot ?? undefined)
        t.equal(taptweak.hex, tweak, 'The tap tweak should match.')

        // Test our ability to tweak the private key.\
        const tweakedPrv  = ECC.tweak_seckey(internalPrivkey, taptweak)
        t.equal(tweakedPrv.hex, tweakedPrivkey, 'The tweaked secret key should match.')

        console.log('sigflag:', Buff.num(hashType).hex)

        const preimage    = get_taproot_tx_preimage(tx, { sigflag: hashType, txindex: txinIndex })
        t.equal(preimage.hex, sigMsg, 'The preimages should match.')

        // Test our ability to calculate the signature hash.
        const actual_hash = hash_taproot_tx(tx, { sigflag: hashType, txindex: txinIndex })
        t.equal(actual_hash.hex, sigHash, 'The signature hashes should match.')

        // Test our ability to sign the transaction.
        const pubkey        = ECC.get_pubkey(tweakedPrivkey, 'bip340')
        const tweakedpub    = Buff.uint(schnorr.getPublicKey(tweakedPrivkey))
        t.equal(pubkey.hex, tweakedpub.hex, 'The tweaked pubkeys should be equal.')

        const signature     = ECC.sign_bip340(tweakedPrivkey, sigHash).hex
        const isVerify      = ECC.verify_signature(signature, sigHash, tweakedpub, 'bip340')
        t.true(isVerify,    'Signature made with sign should be valid using verify.')

        const schnorrVerify = schnorr.verify(signature, sigHash, tweakedpub)
        t.true(schnorrVerify, 'The signTx signature should be valid using schnorr.')

        const sigVerify     = ECC.verify_signature(signature, actual_hash, tweakedpub, 'bip340')
        t.true(sigVerify,   'The signTx signature should be valid using verify.')

        const vectVerify    = ECC.verify_signature(witsig, sigHash, tweakedpub, 'bip340')
        t.true(vectVerify,  'The vector signature should be valid using verify.')

        const checkVerify   = schnorr.verify(witsig, sigHash, tweakedpub)
        t.true(checkVerify, 'The vector signature should be valid using schnorr.')

        const schnorrSig    = schnorr.sign(actual_hash, tweakedPrivkey)
        const testVerify    = ECC.verify_signature(schnorrSig, actual_hash, tweakedpub, 'bip340')
        t.true(testVerify,  'The schnorr signature should be valid using verify.')

      } catch (err) {
        console.error(err)
        t.fail(parse_error(err))
      }
    }

    t.end()
  })
}
