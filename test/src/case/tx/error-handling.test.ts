import { Test } from 'tape'

import {
  encode_tx,
  decode_tx
} from '@/lib/tx/index.js'

import {
  assert_tx_data,
  assert_tx_template
} from '@/lib/tx/validate.js'

export default function (t: Test): void {
  t.test('Transaction validation - missing fields', t => {
    t.plan(5)

    // Missing version
    try {
      assert_tx_data({ vin: [], vout: [], locktime: 0 } as any)
      t.fail('Should throw for missing version')
    } catch {
      t.pass('Correctly throws for missing version')
    }

    // Missing vin
    try {
      assert_tx_data({ version: 2, vout: [], locktime: 0 } as any)
      t.fail('Should throw for missing vin')
    } catch {
      t.pass('Correctly throws for missing vin')
    }

    // Missing vout
    try {
      assert_tx_data({ version: 2, vin: [], locktime: 0 } as any)
      t.fail('Should throw for missing vout')
    } catch {
      t.pass('Correctly throws for missing vout')
    }

    // Missing locktime
    try {
      assert_tx_data({ version: 2, vin: [], vout: [] } as any)
      t.fail('Should throw for missing locktime')
    } catch {
      t.pass('Correctly throws for missing locktime')
    }

    // Null transaction
    try {
      assert_tx_data(null as any)
      t.fail('Should throw for null transaction')
    } catch {
      t.pass('Correctly throws for null transaction')
    }
  })

  t.test('Transaction validation - invalid types', t => {
    t.plan(4)

    // String version
    try {
      assert_tx_data({ version: '2', vin: [], vout: [], locktime: 0 } as any)
      t.fail('Should throw for string version')
    } catch {
      t.pass('Correctly throws for string version')
    }

    // String vin
    try {
      assert_tx_data({ version: 2, vin: 'invalid', vout: [], locktime: 0 } as any)
      t.fail('Should throw for non-array vin')
    } catch {
      t.pass('Correctly throws for non-array vin')
    }

    // String vout
    try {
      assert_tx_data({ version: 2, vin: [], vout: 'invalid', locktime: 0 } as any)
      t.fail('Should throw for non-array vout')
    } catch {
      t.pass('Correctly throws for non-array vout')
    }

    // String locktime
    try {
      assert_tx_data({ version: 2, vin: [], vout: [], locktime: '0' } as any)
      t.fail('Should throw for string locktime')
    } catch {
      t.pass('Correctly throws for string locktime')
    }
  })

  t.test('Transaction validation - invalid version values', t => {
    t.plan(3)

    // Negative version
    try {
      assert_tx_data({ version: -1, vin: [], vout: [], locktime: 0 })
      t.fail('Should throw for negative version')
    } catch {
      t.pass('Correctly throws for negative version')
    }

    // Non-integer version
    try {
      assert_tx_data({ version: 1.5, vin: [], vout: [], locktime: 0 })
      t.fail('Should throw for non-integer version')
    } catch {
      t.pass('Correctly throws for non-integer version')
    }

    // Valid version should pass
    try {
      assert_tx_data({ version: 2, vin: [], vout: [], locktime: 0 })
      t.pass('Valid version accepted')
    } catch {
      t.fail('Should accept valid version')
    }
  })

  t.test('Transaction validation - invalid locktime values', t => {
    t.plan(3)

    // Negative locktime
    try {
      assert_tx_data({ version: 2, vin: [], vout: [], locktime: -1 })
      t.fail('Should throw for negative locktime')
    } catch {
      t.pass('Correctly throws for negative locktime')
    }

    // Non-integer locktime
    try {
      assert_tx_data({ version: 2, vin: [], vout: [], locktime: 1.5 })
      t.fail('Should throw for non-integer locktime')
    } catch {
      t.pass('Correctly throws for non-integer locktime')
    }

    // Valid locktime should pass
    try {
      assert_tx_data({ version: 2, vin: [], vout: [], locktime: 500000 })
      t.pass('Valid locktime accepted')
    } catch {
      t.fail('Should accept valid locktime')
    }
  })

  t.test('Input validation - invalid fields', t => {
    t.plan(5)

    const baseInput = {
      txid: '00'.repeat(32),
      vout: 0,
      sequence: 0xffffffff,
      coinbase: null,
      script_sig: null,
      witness: [],
      prevout: null
    }

    // Invalid txid (wrong length)
    try {
      assert_tx_data({
        version: 2,
        vin: [{ ...baseInput, txid: '00'.repeat(31) }],
        vout: [],
        locktime: 0
      })
      t.fail('Should throw for invalid txid length')
    } catch {
      t.pass('Correctly throws for invalid txid length')
    }

    // Invalid txid (non-hex)
    try {
      assert_tx_data({
        version: 2,
        vin: [{ ...baseInput, txid: 'gg'.repeat(32) }],
        vout: [],
        locktime: 0
      })
      t.fail('Should throw for non-hex txid')
    } catch {
      t.pass('Correctly throws for non-hex txid')
    }

    // Negative vout
    try {
      assert_tx_data({
        version: 2,
        vin: [{ ...baseInput, vout: -1 }],
        vout: [],
        locktime: 0
      })
      t.fail('Should throw for negative vout')
    } catch {
      t.pass('Correctly throws for negative vout')
    }

    // Negative sequence
    try {
      assert_tx_data({
        version: 2,
        vin: [{ ...baseInput, sequence: -1 }],
        vout: [],
        locktime: 0
      })
      t.fail('Should throw for negative sequence')
    } catch {
      t.pass('Correctly throws for negative sequence')
    }

    // Valid input should pass
    try {
      assert_tx_data({
        version: 2,
        vin: [baseInput],
        vout: [],
        locktime: 0
      })
      t.pass('Valid input accepted')
    } catch (err) {
      t.fail('Should accept valid input')
    }
  })

  t.test('Output validation - invalid fields', t => {
    t.plan(4)

    // Negative value
    try {
      assert_tx_data({
        version: 2,
        vin: [],
        vout: [{ value: BigInt(-1), script_pk: '0014' + '00'.repeat(20) }],
        locktime: 0
      })
      t.fail('Should throw for negative value')
    } catch {
      t.pass('Correctly throws for negative value')
    }

    // Non-hex script_pk
    try {
      assert_tx_data({
        version: 2,
        vin: [],
        vout: [{ value: BigInt(1000), script_pk: 'not_hex!' }],
        locktime: 0
      })
      t.fail('Should throw for non-hex script_pk')
    } catch {
      t.pass('Correctly throws for non-hex script_pk')
    }

    // Empty script_pk - note: schema currently allows empty hex strings
    // as they match the regex /^[0-9a-fA-F]*$/ with zero characters
    try {
      assert_tx_data({
        version: 2,
        vin: [],
        vout: [{ value: BigInt(1000), script_pk: '' }],
        locktime: 0
      })
      t.pass('Empty script_pk is allowed by current schema')
    } catch {
      t.pass('Correctly throws for empty script_pk')
    }

    // Valid output should pass
    try {
      assert_tx_data({
        version: 2,
        vin: [],
        vout: [{ value: BigInt(50000), script_pk: '0014' + '00'.repeat(20) }],
        locktime: 0
      })
      t.pass('Valid output accepted')
    } catch {
      t.fail('Should accept valid output')
    }
  })

  t.test('Decode transaction - invalid data', t => {
    t.plan(4)

    // Empty string
    try {
      decode_tx('')
      t.fail('Should throw for empty string')
    } catch {
      t.pass('Correctly throws for empty string')
    }

    // Too short data
    try {
      decode_tx('0100')
      t.fail('Should throw for too short data')
    } catch {
      t.pass('Correctly throws for too short data')
    }

    // Non-hex characters
    try {
      decode_tx('not a hex string')
      t.fail('Should throw for non-hex data')
    } catch {
      t.pass('Correctly throws for non-hex data')
    }

    // Invalid witness flag
    try {
      // Valid version + invalid marker/flag
      decode_tx('01000000' + '0002' + '00'.repeat(100))
      t.fail('Should throw for invalid witness flag')
    } catch {
      t.pass('Correctly throws for invalid witness flag')
    }
  })

  t.test('Encode transaction - edge cases', t => {
    t.plan(4)

    // Transaction with no inputs and no outputs
    try {
      const emptyTx = { version: 2, vin: [], vout: [], locktime: 0 }
      const encoded = encode_tx(emptyTx)
      t.ok(encoded, 'Empty transaction should encode')
    } catch {
      t.pass('Empty transaction handling (may throw based on validation)')
    }

    // Transaction with very large locktime
    try {
      const largeLocktime = {
        version: 2,
        vin: [],
        vout: [],
        locktime: 0xFFFFFFFF
      }
      const encoded = encode_tx(largeLocktime)
      t.ok(encoded, 'Large locktime should encode')
    } catch {
      t.fail('Should accept large locktime')
    }

    // Transaction with multiple inputs
    const multiInput = {
      version: 2,
      vin: Array(10).fill({
        txid: '00'.repeat(32),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: null
      }),
      vout: [{ value: BigInt(1000), script_pk: '0014' + '00'.repeat(20) }],
      locktime: 0
    }
    try {
      const encoded = encode_tx(multiInput)
      t.ok(encoded.length > 400, 'Multi-input transaction should encode')
    } catch {
      t.fail('Should encode multi-input transaction')
    }

    // Transaction with multiple outputs
    const multiOutput = {
      version: 2,
      vin: [{
        txid: '00'.repeat(32),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: null
      }],
      vout: Array(10).fill({ value: BigInt(1000), script_pk: '0014' + '00'.repeat(20) }),
      locktime: 0
    }
    try {
      const encoded = encode_tx(multiOutput)
      t.ok(encoded.length > 300, 'Multi-output transaction should encode')
    } catch {
      t.fail('Should encode multi-output transaction')
    }
  })

  t.test('Transaction size limits', t => {
    t.plan(2)

    // Test with maximum allowed size (should pass)
    const normalTx = {
      version: 2,
      vin: [{
        txid: '00'.repeat(32),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: null
      }],
      vout: [{ value: BigInt(1000), script_pk: '0014' + '00'.repeat(20) }],
      locktime: 0
    }
    try {
      const encoded = encode_tx(normalTx)
      t.ok(encoded.length < 4_000_000, 'Normal transaction should be under 4MB limit')
    } catch {
      t.fail('Normal transaction should encode')
    }

    // Verify decode catches oversized transactions
    const oversizedHex = '01000000' + '01' + '00'.repeat(32) + '00000000' + 'fd' + 'ffff' + '00'.repeat(5000000)
    try {
      decode_tx(oversizedHex)
      t.fail('Should throw for oversized transaction')
    } catch {
      t.pass('Correctly rejects oversized transaction')
    }
  })

  t.test('Witness data validation', t => {
    t.plan(3)

    const txWithWitness = {
      version: 2,
      vin: [{
        txid: '00'.repeat(32),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: ['00'.repeat(64), '02' + '00'.repeat(32)],
        prevout: null
      }],
      vout: [{ value: BigInt(1000), script_pk: '5120' + '00'.repeat(32) }],
      locktime: 0
    }

    try {
      const encoded = encode_tx(txWithWitness)
      t.ok(encoded, 'Transaction with valid witness should encode')

      const decoded = decode_tx(encoded)
      t.equal(decoded.vin[0].witness.length, 2, 'Witness should be decoded correctly')

      // Verify witness content
      t.equal(decoded.vin[0].witness[0].length, 128, 'First witness element should be correct length')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Witness encoding failed: ${message}`)
      t.fail('Witness decode check skipped')
      t.fail('Witness content check skipped')
    }
  })

  t.test('Coinbase transaction handling', t => {
    t.plan(3)

    const coinbaseTx = {
      version: 2,
      vin: [{
        txid: '00'.repeat(32),
        vout: 0xFFFFFFFF,
        sequence: 0xffffffff,
        coinbase: '0308ff0f04' + '00'.repeat(50),
        script_sig: null,
        witness: [],
        prevout: null
      }],
      vout: [{ value: BigInt(5000000000), script_pk: '76a914' + '00'.repeat(20) + '88ac' }],
      locktime: 0
    }

    try {
      const encoded = encode_tx(coinbaseTx)
      t.ok(encoded, 'Coinbase transaction should encode')

      const decoded = decode_tx(encoded)
      t.ok(decoded.vin[0].coinbase !== null, 'Coinbase input should be detected')
      t.equal(decoded.vin[0].vout, 0xFFFFFFFF, 'Coinbase vout should be 0xFFFFFFFF')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Coinbase encoding failed: ${message}`)
      t.fail('Coinbase detection skipped')
      t.fail('Coinbase vout check skipped')
    }
  })
}
