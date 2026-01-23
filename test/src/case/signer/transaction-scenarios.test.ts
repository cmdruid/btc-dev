import { Test } from 'tape'
import { ECC } from '@vbyte/micro-lib'
import { Buff } from '@vbyte/buff'

import {
  sign_segwit_tx,
  sign_taproot_tx,
  verify_tx
} from '@/lib/signer/index.js'

import { parse_tx } from '@/lib/tx/parse.js'
import { encode_tx } from '@/lib/tx/encode.js'
import { hash_segwit_tx } from '@/lib/sighash/segwit.js'
import { hash_taproot_tx } from '@/lib/sighash/taproot.js'

// Test secret keys (for testing only - never use in production)
const TEST_SECKEY_1 = '0000000000000000000000000000000000000000000000000000000000000001'
const TEST_SECKEY_2 = 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef'

// Derive test public keys (as hex strings)
const TEST_PUBKEY_1 = ECC.get_pubkey(TEST_SECKEY_1, true).hex
const TEST_PUBKEY_2 = ECC.get_pubkey(TEST_SECKEY_2, true).hex

export default function (t: Test): void {
  t.test('Transaction signing functions exist', t => {
    t.plan(3)

    t.equal(typeof sign_segwit_tx, 'function', 'sign_segwit_tx should be a function')
    t.equal(typeof sign_taproot_tx, 'function', 'sign_taproot_tx should be a function')
    t.equal(typeof verify_tx, 'function', 'verify_tx should be a function')
  })

  t.test('Segwit transaction signing', t => {
    t.plan(4)

    // Create a P2WPKH transaction
    const pubkeyHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const txData = {
      version: 2,
      vin: [{
        txid: '1111111111111111111111111111111111111111111111111111111111111111',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '0014' + pubkeyHash
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
      }],
      locktime: 0
    }

    const options = {
      txindex: 0,
      pubkey: TEST_PUBKEY_1,
      sigflag: 0x01
    }

    try {
      const signature = sign_segwit_tx(TEST_SECKEY_1, txData, options)

      t.ok(signature, 'Signature should be returned')
      t.ok(typeof signature === 'string', 'Signature should be a string')

      // ECDSA DER signatures are typically 71-73 bytes + 1 byte sighash = 144-148 hex chars
      t.ok(signature.length >= 140, 'Signature should have expected length')

      // Last byte should be sighash flag
      const sigflagByte = signature.slice(-2)
      t.equal(sigflagByte, '01', 'Sighash flag should be appended')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Segwit signing failed: ${message}`)
      t.fail('Signature check skipped')
      t.fail('Length check skipped')
      t.fail('Sighash check skipped')
    }
  })

  t.test('Taproot transaction signing', t => {
    t.plan(4)

    // Use x-only pubkey for taproot (32 bytes)
    const xOnlyPubkey = TEST_PUBKEY_1.slice(2) // Remove 02/03 prefix

    const txData = {
      version: 2,
      vin: [{
        txid: '2222222222222222222222222222222222222222222222222222222222222222',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '5120' + xOnlyPubkey
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '5120' + '00'.repeat(32)
      }],
      locktime: 0
    }

    const options = {
      txindex: 0,
      sigflag: 0x00 // SIGHASH_DEFAULT for taproot
    }

    try {
      const signature = sign_taproot_tx(TEST_SECKEY_1, txData, options)

      t.ok(signature, 'Signature should be returned')
      t.ok(typeof signature === 'string', 'Signature should be a string')

      // Schnorr signatures are exactly 64 bytes (no sighash for 0x00)
      t.equal(signature.length, 128, 'Schnorr signature should be 64 bytes (128 hex chars)')

      // Verify signature format
      t.ok(Buff.is_hex(signature), 'Signature should be valid hex')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Taproot signing failed: ${message}`)
      t.fail('Signature check skipped')
      t.fail('Length check skipped')
      t.fail('Hex check skipped')
    }
  })

  t.test('Taproot signing with non-default sighash', t => {
    t.plan(3)

    const xOnlyPubkey = TEST_PUBKEY_1.slice(2)

    const txData = {
      version: 2,
      vin: [{
        txid: '3333333333333333333333333333333333333333333333333333333333333333',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '5120' + xOnlyPubkey
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '5120' + '00'.repeat(32)
      }],
      locktime: 0
    }

    const options = {
      txindex: 0,
      sigflag: 0x01 // SIGHASH_ALL
    }

    try {
      const signature = sign_taproot_tx(TEST_SECKEY_1, txData, options)

      t.ok(signature, 'Signature should be returned')

      // With non-default sighash, signature should be 65 bytes (64 + sighash flag)
      t.equal(signature.length, 130, 'Schnorr signature with sighash should be 65 bytes (130 hex chars)')

      // Last byte should be sighash flag
      const sigflagByte = signature.slice(-2)
      t.equal(sigflagByte, '01', 'Sighash flag 0x01 should be appended')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Taproot signing with SIGHASH_ALL failed: ${message}`)
      t.fail('Length check skipped')
      t.fail('Sighash check skipped')
    }
  })

  t.test('Sighash calculation for segwit', t => {
    t.plan(3)

    const pubkeyHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const txData = {
      version: 2,
      vin: [{
        txid: '4444444444444444444444444444444444444444444444444444444444444444',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '0014' + pubkeyHash
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
      }],
      locktime: 0
    }

    const options = {
      txindex: 0,
      pubkey: TEST_PUBKEY_1,
      sigflag: 0x01
    }

    try {
      const sighash = hash_segwit_tx(txData, options)

      t.ok(sighash, 'Sighash should be returned')
      // hash_segwit_tx returns Buff, so use .length for bytes and .hex for hex string
      t.equal(sighash.length, 32, 'Sighash should be 32 bytes')
      t.ok(Buff.is_hex(sighash.hex), 'Sighash hex should be valid')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Sighash calculation failed: ${message}`)
      t.fail('Length check skipped')
      t.fail('Hex check skipped')
    }
  })

  t.test('Sighash calculation for taproot', t => {
    t.plan(3)

    const xOnlyPubkey = TEST_PUBKEY_1.slice(2)

    const txData = {
      version: 2,
      vin: [{
        txid: '5555555555555555555555555555555555555555555555555555555555555555',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '5120' + xOnlyPubkey
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '5120' + '00'.repeat(32)
      }],
      locktime: 0
    }

    const options = {
      txindex: 0,
      sigflag: 0x00
    }

    try {
      const sighash = hash_taproot_tx(txData, options)

      t.ok(sighash, 'Sighash should be returned')
      // hash_taproot_tx returns Buff, so use .length for bytes and .hex for hex string
      t.equal(sighash.length, 32, 'Sighash should be 32 bytes')
      t.ok(Buff.is_hex(sighash.hex), 'Sighash hex should be valid')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Taproot sighash calculation failed: ${message}`)
      t.fail('Length check skipped')
      t.fail('Hex check skipped')
    }
  })

  t.test('Multi-input transaction signing', t => {
    t.plan(4)

    const pubkeyHash1 = '11'.repeat(20)
    const pubkeyHash2 = '22'.repeat(20)

    const txData = {
      version: 2,
      vin: [
        {
          txid: '6666666666666666666666666666666666666666666666666666666666666666',
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(50000),
            script_pk: '0014' + pubkeyHash1
          }
        },
        {
          txid: '7777777777777777777777777777777777777777777777777777777777777777',
          vout: 1,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(50000),
            script_pk: '0014' + pubkeyHash2
          }
        }
      ],
      vout: [{
        value: BigInt(90000),
        script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
      }],
      locktime: 0
    }

    try {
      // Sign first input
      const sig1 = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })

      t.ok(sig1, 'First input signature should be returned')

      // Sign second input
      const sig2 = sign_segwit_tx(TEST_SECKEY_2, txData, {
        txindex: 1,
        pubkey: TEST_PUBKEY_2,
        sigflag: 0x01
      })

      t.ok(sig2, 'Second input signature should be returned')

      // Signatures should be different
      t.notEqual(sig1, sig2, 'Signatures for different inputs should be different')

      // Both should be valid ECDSA signatures
      t.ok(sig1.length >= 140 && sig2.length >= 140, 'Both signatures should have valid length')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Multi-input signing failed: ${message}`)
      t.fail('First sig check skipped')
      t.fail('Second sig check skipped')
      t.fail('Comparison skipped')
    }
  })

  t.test('SIGHASH_ANYONECANPAY flag', t => {
    t.plan(3)

    const pubkeyHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const txData = {
      version: 2,
      vin: [{
        txid: '8888888888888888888888888888888888888888888888888888888888888888',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '0014' + pubkeyHash
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
      }],
      locktime: 0
    }

    // Test SIGHASH_ALL | SIGHASH_ANYONECANPAY (0x81)
    try {
      const sig = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x81
      })

      t.ok(sig, 'Signature with ANYONECANPAY should be returned')

      const sigflagByte = sig.slice(-2)
      t.equal(sigflagByte, '81', 'Sighash flag 0x81 should be appended')

      t.ok(sig.length >= 140, 'Signature length should be valid')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`ANYONECANPAY signing failed: ${message}`)
      t.fail('Sighash check skipped')
      t.fail('Length check skipped')
    }
  })

  t.test('Error handling for invalid txindex', t => {
    t.plan(2)

    const txData = {
      version: 2,
      vin: [{
        txid: '9999999999999999999999999999999999999999999999999999999999999999',
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

    // Test with out-of-bounds txindex
    try {
      sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 5, // Only one input exists
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })
      t.fail('Should throw for out-of-bounds txindex')
    } catch (err) {
      t.pass('Correctly throws for out-of-bounds txindex')
    }

    // Test with negative txindex
    try {
      sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: -1,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })
      t.fail('Should throw for negative txindex')
    } catch (err) {
      t.pass('Correctly throws for negative txindex')
    }
  })

  t.test('Transaction encoding and parsing roundtrip', t => {
    t.plan(3)

    const txData = {
      version: 2,
      vin: [{
        txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
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

    try {
      const encoded = encode_tx(txData)
      t.ok(encoded, 'Transaction should encode successfully')

      const parsed = parse_tx(encoded.hex)
      t.ok(parsed, 'Encoded transaction should parse successfully')

      t.equal(parsed.version, txData.version, 'Version should match after roundtrip')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Roundtrip failed: ${message}`)
      t.fail('Parse check skipped')
      t.fail('Version check skipped')
    }
  })

  t.test('Different sighash types produce different signatures', t => {
    t.plan(3)

    const pubkeyHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const txData = {
      version: 2,
      vin: [{
        txid: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: {
          value: BigInt(100000),
          script_pk: '0014' + pubkeyHash
        }
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
      }],
      locktime: 0
    }

    try {
      const sigAll = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01 // SIGHASH_ALL
      })

      const sigNone = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x02 // SIGHASH_NONE
      })

      const sigSingle = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x03 // SIGHASH_SINGLE
      })

      // All signatures should be different
      t.notEqual(sigAll, sigNone, 'SIGHASH_ALL and SIGHASH_NONE should produce different signatures')
      t.notEqual(sigAll, sigSingle, 'SIGHASH_ALL and SIGHASH_SINGLE should produce different signatures')
      t.notEqual(sigNone, sigSingle, 'SIGHASH_NONE and SIGHASH_SINGLE should produce different signatures')

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Different sighash test failed: ${message}`)
      t.fail('Comparison 2 skipped')
      t.fail('Comparison 3 skipped')
    }
  })
}
