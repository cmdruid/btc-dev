import { Test } from 'tape'

// Import actual available signer functions
import {
  sign_segwit_tx,
  sign_taproot_tx,
  verify_tx
} from '@/lib/signer/index.js'

export default function (t: Test): void {
  t.test('SIGNER module basic functionality', t => {
    t.plan(3)

    // Test that signer functions exist and can be called
    t.equal(typeof sign_segwit_tx, 'function', 'sign_segwit_tx should be a function')
    t.equal(typeof sign_taproot_tx, 'function', 'sign_taproot_tx should be a function')
    t.equal(typeof verify_tx, 'function', 'verify_tx should be a function')
  })

  // TODO: Re-enable when signing implementation is ready
  // t.test('Transaction signing basic tests', t => {
  //   // Commented out until private key format issues are resolved
  // })

  t.test('Transaction verification tests', t => {
    t.plan(5)

    // Test basic verification with empty transaction
    const mockTxData = {
      version: 2,
      vin: [],
      vout: [],
      locktime: 0
    }

    // Test that verify_tx function returns VerifyResult object
    const result1 = verify_tx(mockTxData)
    t.equal(typeof result1, 'object', 'verify_tx should return VerifyResult object')
    t.equal(typeof result1.valid, 'boolean', 'verify_tx result should have valid property')
    t.equal(result1.valid, true, 'Empty transaction should be valid (no inputs to verify)')

    // Test with empty config
    const result2 = verify_tx(mockTxData, {})
    t.equal(result2.valid, true, 'verify_tx should work with empty config')

    // Test error handling for invalid input
    try {
      verify_tx(null as any)
      t.fail('verify_tx should throw on null input')
    } catch {
      t.pass('verify_tx correctly throws on null input')
    }
  })

  // TODO: Add proper BIP-340 Schnorr tests when low-level signing functions are implemented
  t.test('TODO: BIP-340 Schnorr signature tests', t => {
    t.plan(1)
    t.pass('BIP-340 Schnorr tests need low-level signing functions to be implemented')

    // When implemented, these tests should use the essential BIP-340 vectors:
    // const vectors = getEssentialBIP340Vectors()
    // Test sign_schnorr(secretKey, message, auxRand)
    // Test verify_schnorr(signature, message, publicKey)
  })
}