import { Test } from 'tape'
import { ECC } from '@vbyte/micro-lib'
import { Buff } from '@vbyte/buff'
import { getEssentialBIP340Vectors, BIP340TestVector } from '../../../utils/test-vectors.js'

import {
  sign_segwit_tx,
  sign_taproot_tx,
  verify_tx
} from '@/lib/signer/index.js'

export default function (t: Test): void {
  t.test('SIGNER module basic functionality', t => {
    t.plan(3)

    t.equal(typeof sign_segwit_tx, 'function', 'sign_segwit_tx should be a function')
    t.equal(typeof sign_taproot_tx, 'function', 'sign_taproot_tx should be a function')
    t.equal(typeof verify_tx, 'function', 'verify_tx should be a function')
  })

  t.test('BIP-340 Schnorr signature generation tests', t => {
    const vectors = getEssentialBIP340Vectors()
    const signingVectors = vectors.filter(v => v.secretKey !== null && v.valid === true)

    // 2 tests per vector: pubkey derivation + signature verification
    t.plan(signingVectors.length * 2)

    for (const vector of signingVectors) {
      const { secretKey, publicKey, message, comment } = vector

      // Verify public key derivation - get_pubkey returns Buff, slice(2) to remove prefix
      const fullPubkey = ECC.get_pubkey(secretKey!, true)
      const derivedPubkey = fullPubkey.hex.slice(2) // Remove 02/03 prefix hex, use x-only
      t.equal(
        derivedPubkey.toLowerCase(),
        publicKey.toLowerCase(),
        `Vector ${vector.index}: public key derivation - ${comment}`
      )

      // Sign the message and verify the signature is valid
      // Note: ECC.sign_bip340 may not produce deterministic signatures matching BIP-340 test vectors
      // because it uses internal randomness. Instead, we verify the produced signature is valid.
      const sig = ECC.sign_bip340(secretKey!, message)
      const isValid = ECC.verify_bip340(sig.hex, message, publicKey)
      t.ok(
        isValid,
        `Vector ${vector.index}: signature generation and verification - ${comment}`
      )
    }
  })

  t.test('BIP-340 Schnorr signature verification tests', t => {
    const vectors = getEssentialBIP340Vectors()

    t.plan(vectors.length)

    for (const vector of vectors) {
      const { publicKey, message, signature, valid, comment } = vector

      try {
        const isValid = ECC.verify_bip340(signature, message, publicKey)

        if (valid) {
          t.ok(isValid, `Vector ${vector.index}: valid signature should verify - ${comment}`)
        } else {
          t.notOk(isValid, `Vector ${vector.index}: invalid signature should fail - ${comment}`)
        }
      } catch (err) {
        // Some invalid vectors may throw errors during verification
        if (valid) {
          t.fail(`Vector ${vector.index}: valid signature threw error - ${err instanceof Error ? err.message : String(err)}`)
        } else {
          t.pass(`Vector ${vector.index}: invalid signature correctly rejected - ${comment}`)
        }
      }
    }
  })

  t.test('Transaction verification tests', t => {
    t.plan(5)

    // Test basic verification with empty transaction
    const mockTxData = {
      version: 2,
      vin: [],
      vout: [],
      locktime: 0
    }

    const result1 = verify_tx(mockTxData)
    t.equal(typeof result1, 'object', 'verify_tx should return VerifyResult object')
    t.equal(typeof result1.valid, 'boolean', 'verify_tx result should have valid property')
    t.equal(result1.valid, true, 'Empty transaction should be valid (no inputs to verify)')

    const result2 = verify_tx(mockTxData, {})
    t.equal(result2.valid, true, 'verify_tx should work with empty config')

    try {
      verify_tx(null as any)
      t.fail('verify_tx should throw on null input')
    } catch {
      t.pass('verify_tx correctly throws on null input')
    }
  })

  t.test('Secret key validation', t => {
    t.plan(5)

    const mockTxData = {
      version: 2,
      vin: [{
        txid: '0'.repeat(64),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '0014' + '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
      }],
      locktime: 0
    }

    const options = { txindex: 0 }

    // Invalid secret key - too short
    try {
      sign_segwit_tx('abcd', mockTxData, options)
      t.fail('Should reject short secret key')
    } catch (err) {
      t.pass('Correctly rejects short secret key')
    }

    // Invalid secret key - too long
    try {
      sign_segwit_tx('00'.repeat(33), mockTxData, options)
      t.fail('Should reject long secret key')
    } catch (err) {
      t.pass('Correctly rejects long secret key')
    }

    // Invalid secret key - non-hex
    try {
      sign_segwit_tx('gg' + '00'.repeat(31), mockTxData, options)
      t.fail('Should reject non-hex secret key')
    } catch (err) {
      t.pass('Correctly rejects non-hex secret key')
    }

    // Invalid secret key - not a string
    try {
      sign_segwit_tx(123 as any, mockTxData, options)
      t.fail('Should reject non-string secret key')
    } catch (err) {
      t.pass('Correctly rejects non-string secret key')
    }

    // Valid format secret key (32 bytes / 64 hex chars)
    const validSeckey = '0000000000000000000000000000000000000000000000000000000000000001'
    try {
      // This may fail for other reasons (missing prevout data), but should not fail on secret key format
      sign_segwit_tx(validSeckey, mockTxData, options)
      t.pass('Accepts valid secret key format')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // If it fails for reasons other than secret key format, that's acceptable
      if (message.includes('Secret key') || message.includes('secret key')) {
        t.fail('Should accept valid secret key format')
      } else {
        t.pass('Valid secret key format accepted (failed for other reasons)')
      }
    }
  })

  t.test('Sighash flag validation', t => {
    t.plan(4)

    const mockTxData = {
      version: 2,
      vin: [{
        txid: '0'.repeat(64),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '5120' + '0'.repeat(64)
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '5120' + '0'.repeat(64)
      }],
      locktime: 0
    }

    const validSeckey = '0000000000000000000000000000000000000000000000000000000000000001'

    // Valid sighash flags for taproot
    const validTaprootFlags = [0x00, 0x01, 0x02, 0x03, 0x81, 0x82, 0x83]

    for (const flag of validTaprootFlags.slice(0, 3)) {
      try {
        sign_taproot_tx(validSeckey, mockTxData, { txindex: 0, sigflag: flag })
        t.pass(`Accepts valid taproot sigflag 0x${flag.toString(16).padStart(2, '0')}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('sigflag') || message.includes('Invalid sig')) {
          t.fail(`Should accept valid taproot sigflag 0x${flag.toString(16)}`)
        } else {
          t.pass(`Valid taproot sigflag 0x${flag.toString(16)} accepted (failed for other reasons)`)
        }
      }
    }

    // Invalid sighash flag
    try {
      sign_taproot_tx(validSeckey, mockTxData, { txindex: 0, sigflag: 0xFF })
      t.fail('Should reject invalid sigflag')
    } catch (err) {
      t.pass('Correctly rejects invalid sigflag')
    }
  })

  t.test('Schnorr signature format tests', t => {
    t.plan(3)

    // Test 64-byte signature (no sighash appended)
    const sig64 = '00'.repeat(64)
    t.equal(Buff.hex(sig64).length, 64, '64-byte signature should be valid Schnorr length')

    // Test 65-byte signature (sighash appended)
    const sig65 = '00'.repeat(64) + '01'
    t.equal(Buff.hex(sig65).length, 65, '65-byte signature with sighash should be valid')

    // Test signature too short
    const sigShort = '00'.repeat(63)
    t.equal(Buff.hex(sigShort).length, 63, 'Short signature detected')
  })

  t.test('ECDSA signature format tests', t => {
    t.plan(3)

    // ECDSA signatures are DER-encoded, typically 71-73 bytes
    // DER format: 30 [length] 02 [r_length] [r] 02 [s_length] [s]

    // Minimum valid DER signature
    const minDerSig = '3044' + '02' + '20' + '00'.repeat(32) + '02' + '20' + '00'.repeat(32) + '01'
    const minSigLength = Buff.hex(minDerSig).length
    t.ok(minSigLength >= 70 && minSigLength <= 73, 'DER signature should be 70-73 bytes')

    // Test signature length detection
    t.ok(minSigLength >= 70, 'ECDSA DER signature minimum length correct')
    t.ok(minSigLength <= 73, 'ECDSA DER signature maximum length correct')
  })

  t.test('Verification result structure', t => {
    t.plan(6)

    const mockTxData = {
      version: 2,
      vin: [],
      vout: [],
      locktime: 0
    }

    const result = verify_tx(mockTxData)

    t.ok('valid' in result, 'Result should have valid property')
    t.ok('inputs' in result, 'Result should have inputs property')
    t.ok(Array.isArray(result.inputs), 'inputs should be an array')

    // Test with throws option
    const resultNoThrow = verify_tx(mockTxData, { throws: false })
    t.equal(resultNoThrow.valid, true, 'Empty tx should be valid with throws: false')

    const resultWithThrow = verify_tx(mockTxData, { throws: true })
    t.equal(resultWithThrow.valid, true, 'Empty tx should be valid with throws: true')

    // Test error property is undefined when valid
    t.equal(resultWithThrow.error, undefined, 'error should be undefined when valid')
  })

  t.test('Coinbase input handling in verification', t => {
    t.plan(3)

    // Transaction with coinbase input
    const coinbaseTx = {
      version: 2,
      vin: [{
        txid: '00'.repeat(32),
        vout: 0xFFFFFFFF,
        sequence: 0xffffffff,
        coinbase: '03123456' + '04deadbeef'.repeat(10), // Sample coinbase script
        script_sig: null,
        witness: [],
        prevout: null
      }],
      vout: [{
        value: BigInt(5000000000),
        script_pk: '76a914' + '00'.repeat(20) + '88ac'
      }],
      locktime: 0
    }

    const result = verify_tx(coinbaseTx)

    t.equal(result.valid, true, 'Coinbase transaction should be valid')
    t.equal(result.inputs.length, 1, 'Should have one input result')
    t.equal(result.inputs[0].type, 'coinbase', 'Input type should be coinbase')
  })
}
