import { Test } from 'tape'
import { hash_segwit_tx, bip143_hash_outputs } from '@/lib/sighash/segwit.js'
import { hash_taproot_tx } from '@/lib/sighash/taproot.js'

import type { TxData, TxOutput } from '@/types/index.js'

// Minimal transaction for testing bounds checks
const minimalTx: TxData = {
  version: 2,
  vin: [
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000001',
      vout: 0,
      prevout: {
        value: 100000,
        script_pk: '0014' + '00'.repeat(20) // P2WPKH
      },
      sequence: 0xffffffff
    }
  ],
  vout: [
    {
      value: 50000,
      script_pk: '76a914' + '00'.repeat(20) + '88ac' // P2PKH
    }
  ],
  locktime: 0
}

// Transaction with multiple outputs for SIGHASH_SINGLE tests
const multiOutputTx: TxData = {
  version: 2,
  vin: [
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000001',
      vout: 0,
      prevout: {
        value: 100000,
        script_pk: '5120' + '00'.repeat(32) // P2TR
      },
      sequence: 0xffffffff
    },
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000002',
      vout: 0,
      prevout: {
        value: 100000,
        script_pk: '5120' + '00'.repeat(32)
      },
      sequence: 0xffffffff
    }
  ],
  vout: [
    {
      value: 50000,
      script_pk: '76a914' + '00'.repeat(20) + '88ac'
    },
    {
      value: 40000,
      script_pk: '76a914' + '11'.repeat(20) + '88ac'
    }
  ],
  locktime: 0
}

export default function (t: Test): void {
  t.test('Segwit SIGHASH_SINGLE index bounds validation', t => {
    t.plan(4)

    const redeemScript = '0014' + '00'.repeat(20)

    // Test 1: Negative index should throw
    try {
      bip143_hash_outputs(minimalTx.vout as TxOutput[], 0x03, -1)
      t.fail('Should have thrown for negative index')
    } catch (err: any) {
      t.ok(err.message.includes('non-negative'), 'Negative index throws with proper message')
    }

    // Test 2: Out-of-bounds index should return zeros (per BIP143 spec)
    // When txindex >= number of outputs, return 32 zero bytes
    const result = bip143_hash_outputs(minimalTx.vout as TxOutput[], 0x03, 10)
    const zeros = '00'.repeat(32)
    t.equal(result.toString('hex'), zeros, 'Out-of-bounds index returns 32 zero bytes per BIP143')

    // Test 3: Valid index at boundary should work
    const validResult = bip143_hash_outputs(minimalTx.vout as TxOutput[], 0x03, 0)
    t.ok(validResult.length === 32, 'Valid index returns 32-byte hash')

    // Test 4: Full segwit hash with negative index should throw
    try {
      hash_segwit_tx(minimalTx, {
        txindex: -1,
        sigflag: 0x03, // SIGHASH_SINGLE
        script: redeemScript
      })
      t.fail('Should have thrown for negative txindex in full hash')
    } catch (err: any) {
      t.ok(err.message, 'Full hash throws for negative index')
    }
  })

  t.test('Taproot SIGHASH_SINGLE index bounds validation', t => {
    t.plan(4)

    // Test 1: Negative index should throw
    try {
      hash_taproot_tx(multiOutputTx, {
        txindex: -1,
        sigflag: 0x03 // SIGHASH_SINGLE
      })
      t.fail('Should have thrown for negative txindex')
    } catch (err: any) {
      t.ok(err.message.includes('out of bounds') || err.message.includes('non-negative'),
        'Negative index throws with bounds error')
    }

    // Test 2: Out-of-bounds index should throw
    try {
      hash_taproot_tx(multiOutputTx, {
        txindex: 10, // Only 2 outputs exist
        sigflag: 0x03 // SIGHASH_SINGLE
      })
      t.fail('Should have thrown for out-of-bounds txindex')
    } catch (err: any) {
      t.ok(err.message.includes('out of bounds'),
        'Out-of-bounds index throws with proper message')
    }

    // Test 3: Index equal to output length should throw
    try {
      hash_taproot_tx(multiOutputTx, {
        txindex: 2, // Exactly at boundary (0 and 1 are valid)
        sigflag: 0x03
      })
      t.fail('Should have thrown for boundary index')
    } catch (err: any) {
      t.ok(err.message.includes('out of bounds'),
        'Boundary index throws with proper message')
    }

    // Test 4: Valid index should work
    try {
      const result = hash_taproot_tx(multiOutputTx, {
        txindex: 1,
        sigflag: 0x03
      })
      t.ok(result.length === 32, 'Valid index returns 32-byte hash')
    } catch (err: any) {
      t.fail('Valid index should not throw: ' + err.message)
    }
  })

  t.test('Taproot SIGHASH_SINGLE with ANYONECANPAY', t => {
    t.plan(2)

    // SIGHASH_SINGLE | ANYONECANPAY = 0x83
    // With ANYONECANPAY, txindex is still used for output selection

    // Test 1: Out-of-bounds should still throw
    try {
      hash_taproot_tx(multiOutputTx, {
        txindex: 5,
        sigflag: 0x83 // SINGLE | ANYONECANPAY
      })
      t.fail('Should have thrown for out-of-bounds with ANYONECANPAY')
    } catch (err: any) {
      t.ok(err.message.includes('out of bounds'),
        'SINGLE|ANYONECANPAY with bad index throws')
    }

    // Test 2: Valid index should work
    try {
      const result = hash_taproot_tx(multiOutputTx, {
        txindex: 0,
        sigflag: 0x83
      })
      t.ok(result.length === 32, 'SINGLE|ANYONECANPAY with valid index works')
    } catch (err: any) {
      t.fail('Valid SINGLE|ANYONECANPAY should not throw: ' + err.message)
    }
  })
}
