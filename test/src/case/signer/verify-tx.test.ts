import { Test } from 'tape'
import { ECC } from '@vbyte/crypto'
import { hash160 } from '@vbyte/crypto/hash'
import { Buff } from '@vbyte/buff'

import {
  sign_segwit_tx,
  sign_taproot_tx,
  verify_tx
} from '@/lib/signer/index.js'

import type { TxData, TxInput } from '@/types/index.js'

// Test secret keys (for testing only - never use in production)
const TEST_SECKEY_1 = '0000000000000000000000000000000000000000000000000000000000000001'
const TEST_SECKEY_2 = 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef'

// Derive test public keys
const TEST_PUBKEY_1 = ECC.get_pubkey(TEST_SECKEY_1, 'ecdsa').hex
const TEST_PUBKEY_2 = ECC.get_pubkey(TEST_SECKEY_2, 'ecdsa').hex

// X-only pubkeys for taproot
const TEST_XONLY_1 = TEST_PUBKEY_1.slice(2)
const TEST_XONLY_2 = TEST_PUBKEY_2.slice(2)

// Pubkey hashes for P2WPKH
const TEST_PKH_1 = hash160(TEST_PUBKEY_1).hex
const TEST_PKH_2 = hash160(TEST_PUBKEY_2).hex

export default function (t: Test): void {
  t.test('SIGNER verify_tx - Transaction verification', t => {

    t.test('P2WPKH verification - valid signature', t => {
      t.plan(5)

      // Create P2WPKH transaction
      const txData: TxData = {
        version: 2,
        vin: [{
          txid: 'aa'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(100000),
            script_pk: '0014' + TEST_PKH_1
          }
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_2
        }],
        locktime: 0
      }

      // Sign the transaction
      const signature = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })

      // Add signature and pubkey to witness
      txData.vin[0].witness = [signature, TEST_PUBKEY_1]

      // Verify the transaction
      const result = verify_tx(txData)

      t.true(result.valid, 'Transaction should be valid')
      t.equal(result.inputs.length, 1, 'Should have one input result')
      t.true(result.inputs[0].valid, 'Input 0 should be valid')
      t.equal(result.inputs[0].type, 'p2wpkh', 'Should detect P2WPKH type')
      t.equal(result.error, undefined, 'Should have no error')
    })

    t.test('P2WPKH verification - invalid signature', t => {
      t.plan(4)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: 'bb'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(100000),
            script_pk: '0014' + TEST_PKH_1
          }
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_2
        }],
        locktime: 0
      }

      // Sign with correct key
      const signature = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })

      // Put WRONG pubkey in witness (signature won't match)
      txData.vin[0].witness = [signature, TEST_PUBKEY_2]

      // Verify should fail
      const result = verify_tx(txData)

      t.false(result.valid, 'Transaction should be invalid')
      t.false(result.inputs[0].valid, 'Input 0 should be invalid')
      t.ok(result.inputs[0].error, 'Should have error message')
      t.ok(result.error, 'Overall error should be set')
    })

    t.test('P2TR key-path verification - valid signature', t => {
      t.plan(5)

      // Create P2TR transaction
      const txData: TxData = {
        version: 2,
        vin: [{
          txid: 'cc'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(100000),
            script_pk: '5120' + TEST_XONLY_1
          }
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '5120' + TEST_XONLY_2
        }],
        locktime: 0
      }

      // Sign the transaction with SIGHASH_DEFAULT
      const signature = sign_taproot_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        sigflag: 0x00
      })

      // Add signature to witness (key-path has just signature)
      txData.vin[0].witness = [signature]

      // Verify the transaction
      const result = verify_tx(txData)

      t.true(result.valid, 'Transaction should be valid')
      t.equal(result.inputs.length, 1, 'Should have one input result')
      t.true(result.inputs[0].valid, 'Input 0 should be valid')
      t.equal(result.inputs[0].type, 'p2tr', 'Should detect P2TR type')
      t.equal(result.error, undefined, 'Should have no error')
    })

    t.test('P2TR key-path verification - SIGHASH_ALL', t => {
      t.plan(3)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: 'dd'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(100000),
            script_pk: '5120' + TEST_XONLY_1
          }
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '5120' + TEST_XONLY_2
        }],
        locktime: 0
      }

      // Sign with SIGHASH_ALL (0x01)
      const signature = sign_taproot_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        sigflag: 0x01
      })

      // Signature should be 65 bytes (64 + sighash flag)
      t.equal(signature.length, 130, 'Signature should be 65 bytes')

      txData.vin[0].witness = [signature]

      const result = verify_tx(txData)
      t.true(result.valid, 'Transaction with SIGHASH_ALL should be valid')
      t.equal(result.inputs[0].type, 'p2tr', 'Should detect P2TR type')
    })

    t.test('P2TR key-path - invalid signature', t => {
      t.plan(3)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: 'ee'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],
          prevout: {
            value: BigInt(100000),
            script_pk: '5120' + TEST_XONLY_1
          }
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '5120' + TEST_XONLY_2
        }],
        locktime: 0
      }

      // Sign with WRONG key
      const signature = sign_taproot_tx(TEST_SECKEY_2, txData, {
        txindex: 0,
        sigflag: 0x00
      })

      txData.vin[0].witness = [signature]

      const result = verify_tx(txData)
      t.false(result.valid, 'Transaction should be invalid')
      t.false(result.inputs[0].valid, 'Input should be invalid')
      t.ok(result.inputs[0].error?.includes('Invalid'), 'Should have signature error')
    })

    t.test('Multi-input P2WPKH verification', t => {
      t.plan(5)

      const txData: TxData = {
        version: 2,
        vin: [
          {
            txid: 'ff'.repeat(32),
            vout: 0,
            sequence: 0xffffffff,
            coinbase: null,
            script_sig: null,
            witness: [],
            prevout: {
              value: BigInt(50000),
              script_pk: '0014' + TEST_PKH_1
            }
          },
          {
            txid: '11'.repeat(32),
            vout: 1,
            sequence: 0xffffffff,
            coinbase: null,
            script_sig: null,
            witness: [],
            prevout: {
              value: BigInt(50000),
              script_pk: '0014' + TEST_PKH_2
            }
          }
        ],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_1
        }],
        locktime: 0
      }

      // Sign first input
      const sig1 = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })
      txData.vin[0].witness = [sig1, TEST_PUBKEY_1]

      // Sign second input
      const sig2 = sign_segwit_tx(TEST_SECKEY_2, txData, {
        txindex: 1,
        pubkey: TEST_PUBKEY_2,
        sigflag: 0x01
      })
      txData.vin[1].witness = [sig2, TEST_PUBKEY_2]

      const result = verify_tx(txData)

      t.true(result.valid, 'Multi-input transaction should be valid')
      t.equal(result.inputs.length, 2, 'Should have two input results')
      t.true(result.inputs[0].valid, 'First input should be valid')
      t.true(result.inputs[1].valid, 'Second input should be valid')
      t.equal(result.error, undefined, 'Should have no error')
    })

    t.test('Mixed P2WPKH and P2TR inputs', t => {
      t.plan(6)

      const txData: TxData = {
        version: 2,
        vin: [
          {
            txid: '22'.repeat(32),
            vout: 0,
            sequence: 0xffffffff,
            coinbase: null,
            script_sig: null,
            witness: [],
            prevout: {
              value: BigInt(50000),
              script_pk: '0014' + TEST_PKH_1  // P2WPKH
            }
          },
          {
            txid: '33'.repeat(32),
            vout: 0,
            sequence: 0xffffffff,
            coinbase: null,
            script_sig: null,
            witness: [],
            prevout: {
              value: BigInt(50000),
              script_pk: '5120' + TEST_XONLY_2  // P2TR
            }
          }
        ],
        vout: [{
          value: BigInt(90000),
          script_pk: '5120' + TEST_XONLY_1
        }],
        locktime: 0
      }

      // Sign P2WPKH input
      const sig1 = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })
      txData.vin[0].witness = [sig1, TEST_PUBKEY_1]

      // Sign P2TR input
      const sig2 = sign_taproot_tx(TEST_SECKEY_2, txData, {
        txindex: 1,
        sigflag: 0x00
      })
      txData.vin[1].witness = [sig2]

      const result = verify_tx(txData)

      t.true(result.valid, 'Mixed input transaction should be valid')
      t.equal(result.inputs.length, 2, 'Should have two input results')
      t.true(result.inputs[0].valid, 'P2WPKH input should be valid')
      t.equal(result.inputs[0].type, 'p2wpkh', 'First input should be P2WPKH')
      t.true(result.inputs[1].valid, 'P2TR input should be valid')
      t.equal(result.inputs[1].type, 'p2tr', 'Second input should be P2TR')
    })

    t.test('Coinbase input handling', t => {
      t.plan(3)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: '00'.repeat(32),
          vout: 0xffffffff,
          sequence: 0xffffffff,
          coinbase: '03' + '123456',  // Coinbase script
          script_sig: null,
          witness: [],
          prevout: null
        }],
        vout: [{
          value: BigInt(5000000000),
          script_pk: '0014' + TEST_PKH_1
        }],
        locktime: 0
      }

      const result = verify_tx(txData)

      t.true(result.valid, 'Coinbase transaction should be valid')
      t.true(result.inputs[0].valid, 'Coinbase input should be valid')
      t.equal(result.inputs[0].type, 'coinbase', 'Should identify coinbase type')
    })

    t.test('Empty witness treated correctly', t => {
      t.plan(3)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: '44'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: [],  // Empty witness
          prevout: {
            value: BigInt(100000),
            script_pk: '0014' + TEST_PKH_1
          }
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_2
        }],
        locktime: 0
      }

      const result = verify_tx(txData)

      t.true(result.valid, 'Empty witness should be treated as valid (no sig to verify)')
      t.true(result.inputs[0].valid, 'Input with empty witness should be valid')
      t.equal(result.inputs[0].type, null, 'Type should be null for empty witness')
    })

    t.test('Missing prevout data', t => {
      t.plan(3)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: '55'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: ['deadbeef', TEST_PUBKEY_1],  // Has witness but no prevout
          prevout: null
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_2
        }],
        locktime: 0
      }

      const result = verify_tx(txData)

      t.false(result.valid, 'Transaction without prevout should fail verification')
      t.false(result.inputs[0].valid, 'Input without prevout should fail')
      t.ok(result.inputs[0].error, 'Should have error message')
    })

    t.test('Throws option', t => {
      t.plan(2)

      const txData: TxData = {
        version: 2,
        vin: [{
          txid: '66'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          coinbase: null,
          script_sig: null,
          witness: ['deadbeef', TEST_PUBKEY_1],
          prevout: null
        }],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_2
        }],
        locktime: 0
      }

      // Without throws option - should return result
      const result = verify_tx(txData, { throws: false })
      t.false(result.valid, 'Should return invalid result')

      // With throws option - should throw
      try {
        verify_tx(txData, { throws: true })
        t.fail('Should have thrown')
      } catch (e) {
        t.ok(e instanceof Error, 'Should throw an Error')
      }
    })

    t.test('Partially valid multi-input (one valid, one invalid)', t => {
      t.plan(5)

      const txData: TxData = {
        version: 2,
        vin: [
          {
            txid: '77'.repeat(32),
            vout: 0,
            sequence: 0xffffffff,
            coinbase: null,
            script_sig: null,
            witness: [],
            prevout: {
              value: BigInt(50000),
              script_pk: '0014' + TEST_PKH_1
            }
          },
          {
            txid: '88'.repeat(32),
            vout: 1,
            sequence: 0xffffffff,
            coinbase: null,
            script_sig: null,
            witness: [],
            prevout: {
              value: BigInt(50000),
              script_pk: '0014' + TEST_PKH_2
            }
          }
        ],
        vout: [{
          value: BigInt(90000),
          script_pk: '0014' + TEST_PKH_1
        }],
        locktime: 0
      }

      // Sign first input correctly
      const sig1 = sign_segwit_tx(TEST_SECKEY_1, txData, {
        txindex: 0,
        pubkey: TEST_PUBKEY_1,
        sigflag: 0x01
      })
      txData.vin[0].witness = [sig1, TEST_PUBKEY_1]

      // Sign second input correctly
      const sig2 = sign_segwit_tx(TEST_SECKEY_2, txData, {
        txindex: 1,
        pubkey: TEST_PUBKEY_2,
        sigflag: 0x01
      })
      // But corrupt the signature by flipping a byte
      const corruptedSig = sig2.slice(0, 4) + 'ff' + sig2.slice(6)
      txData.vin[1].witness = [corruptedSig, TEST_PUBKEY_2]

      const result = verify_tx(txData)

      t.false(result.valid, 'Transaction should be invalid overall')
      t.true(result.inputs[0].valid, 'First input should be valid')
      t.false(result.inputs[1].valid, 'Second input should be invalid')
      t.ok(result.inputs[1].error, 'Second input should have error')
      t.ok(result.error, 'Overall error should be set')
    })

    t.end()
  })
}
