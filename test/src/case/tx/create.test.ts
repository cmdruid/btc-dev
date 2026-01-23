import { Test } from 'tape'

import {
  create_tx,
  create_tx_input,
  create_tx_output,
  create_coinbase_input,
  create_spend_input,
  create_virtual_input
} from '@/lib/tx/create.js'

import { COINBASE, DEFAULT } from '@/const.js'

export default function (t: Test): void {
  t.test('create_tx - basic transaction creation', t => {
    t.plan(8)

    // Create empty transaction (with empty arrays)
    const emptyTx = create_tx({ vin: [], vout: [] })
    t.equal(emptyTx.version, DEFAULT.VERSION, 'Default version should be used')
    t.equal(emptyTx.locktime, DEFAULT.LOCKTIME, 'Default locktime should be used')
    t.deepEqual(emptyTx.vin, [], 'Empty vin array')
    t.deepEqual(emptyTx.vout, [], 'Empty vout array')

    // Create with custom version/locktime
    const customTx = create_tx({ version: 1, locktime: 500000, vin: [], vout: [] })
    t.equal(customTx.version, 1, 'Custom version should be used')
    t.equal(customTx.locktime, 500000, 'Custom locktime should be used')

    // Create with inputs and outputs
    const fullTx = create_tx({
      vin: [{
        txid: '00'.repeat(32),
        vout: 0,
        prevout: { value: 100000, script_pk: '76a914' + '00'.repeat(20) + '88ac' }
      }],
      vout: [{
        value: 50000,
        script_pk: '76a914' + '11'.repeat(20) + '88ac'
      }]
    })
    t.equal(fullTx.vin.length, 1, 'Should have 1 input')
    t.equal(fullTx.vout.length, 1, 'Should have 1 output')
  })

  t.test('create_tx_input - input type detection', t => {
    t.plan(6)

    // Coinbase input
    const coinbaseInput = create_tx_input({
      txid: COINBASE.TXID,
      vout: COINBASE.VOUT,
      coinbase: '03123456'
    })
    t.equal(coinbaseInput.coinbase, '03123456', 'Coinbase script should be set')
    t.equal(coinbaseInput.prevout, null, 'Coinbase should have null prevout')

    // Spend input (with prevout)
    const spendInput = create_tx_input({
      txid: '11'.repeat(32),
      vout: 1,
      prevout: { value: 100000, script_pk: '0014' + '00'.repeat(20) }
    })
    t.notEqual(spendInput.prevout, null, 'Spend input should have prevout')
    t.equal(spendInput.coinbase, null, 'Spend input should have null coinbase')

    // Virtual input (no prevout, no coinbase)
    const virtualInput = create_tx_input({
      txid: '22'.repeat(32),
      vout: 0
    })
    t.equal(virtualInput.prevout, null, 'Virtual input should have null prevout')
    t.equal(virtualInput.coinbase, null, 'Virtual input should have null coinbase')
  })

  t.test('create_coinbase_input - coinbase specifics', t => {
    t.plan(5)

    const coinbase = create_coinbase_input({
      txid: COINBASE.TXID, // Must be all zeros for coinbase
      vout: COINBASE.VOUT, // Must be 0xFFFFFFFF for coinbase
      coinbase: '03' + 'ff'.repeat(3),
      witness: ['00'.repeat(32)]
    })

    t.equal(coinbase.txid, COINBASE.TXID, 'Coinbase txid must be all zeros')
    t.equal(coinbase.vout, COINBASE.VOUT, 'Coinbase vout must be 0xFFFFFFFF')
    t.equal(coinbase.coinbase, '03' + 'ff'.repeat(3), 'Coinbase script should be preserved')
    t.equal(coinbase.witness?.length, 1, 'Witness should be preserved')
    t.equal(coinbase.sequence, DEFAULT.SEQUENCE, 'Default sequence should be used')
  })

  t.test('create_spend_input - spend input validation', t => {
    t.plan(6)

    const spend = create_spend_input({
      txid: 'aa'.repeat(32),
      vout: 2,
      prevout: { value: 250000, script_pk: '5120' + 'bb'.repeat(32) },
      sequence: 0xfffffffe,
      witness: ['cc'.repeat(64)]
    })

    t.equal(spend.txid, 'aa'.repeat(32), 'txid should be preserved')
    t.equal(spend.vout, 2, 'vout should be preserved')
    t.equal(spend.prevout?.value, BigInt(250000), 'prevout value should be normalized to BigInt')
    t.equal(spend.prevout?.script_pk, '5120' + 'bb'.repeat(32), 'prevout script_pk should be preserved')
    t.equal(spend.sequence, 0xfffffffe, 'Custom sequence should be used')
    t.equal(spend.witness?.length, 1, 'Witness should be preserved')
  })

  t.test('create_virtual_input - virtual input validation', t => {
    t.plan(5)

    const virtual = create_virtual_input({
      txid: 'dd'.repeat(32),
      vout: 0,
      script_sig: '00'.repeat(10),
      sequence: 0
    })

    t.equal(virtual.txid, 'dd'.repeat(32), 'txid should be preserved')
    t.equal(virtual.vout, 0, 'vout should be preserved')
    t.equal(virtual.script_sig, '00'.repeat(10), 'script_sig should be preserved')
    t.equal(virtual.sequence, 0, 'Custom sequence should be used')
    t.equal(virtual.prevout, null, 'Virtual input should have null prevout')
  })

  t.test('create_tx_output - output creation', t => {
    t.plan(4)

    // P2PKH output
    const p2pkhOutput = create_tx_output({
      value: 100000,
      script_pk: '76a914' + '00'.repeat(20) + '88ac'
    })
    t.equal(p2pkhOutput.value, BigInt(100000), 'Value should be normalized to BigInt')
    t.equal(p2pkhOutput.script_pk, '76a914' + '00'.repeat(20) + '88ac', 'script_pk should be preserved')

    // OP_RETURN output with zero value
    const opReturnOutput = create_tx_output({
      value: 0,
      script_pk: '6a' + '0b' + '68656c6c6f20776f726c64'
    })
    t.equal(opReturnOutput.value, BigInt(0), 'Zero value should work')
    t.ok(opReturnOutput.script_pk.startsWith('6a'), 'OP_RETURN script should be preserved')
  })

  t.test('create_tx - sequence handling', t => {
    t.plan(3)

    // Default sequence
    const defaultSeq = create_tx({
      vin: [{ txid: '00'.repeat(32), vout: 0 }],
      vout: []
    })
    t.equal(defaultSeq.vin[0].sequence, DEFAULT.SEQUENCE, 'Default sequence for undefined')

    // Custom sequence (number)
    const customSeq = create_tx({
      vin: [{ txid: '00'.repeat(32), vout: 0, sequence: 0xfffffffe }],
      vout: []
    })
    t.equal(customSeq.vin[0].sequence, 0xfffffffe, 'Custom sequence preserved')

    // RBF sequence (enable RBF)
    const rbfSeq = create_tx({
      vin: [{ txid: '00'.repeat(32), vout: 0, sequence: 0xfffffffd }],
      vout: []
    })
    t.equal(rbfSeq.vin[0].sequence, 0xfffffffd, 'RBF sequence preserved')
  })

  t.test('create_tx - value normalization', t => {
    t.plan(3)

    // Number value
    const numValue = create_tx({
      vin: [],
      vout: [{ value: 100000, script_pk: '00'.repeat(22) }]
    })
    t.equal(numValue.vout[0].value, BigInt(100000), 'Number value normalized to BigInt')

    // BigInt value
    const bigintValue = create_tx({
      vin: [],
      vout: [{ value: BigInt(200000), script_pk: '00'.repeat(22) }]
    })
    t.equal(bigintValue.vout[0].value, BigInt(200000), 'BigInt value preserved')

    // Zero value (OP_RETURN)
    const zeroValue = create_tx({
      vin: [],
      vout: [{ value: 0, script_pk: '6a00' }]
    })
    t.equal(zeroValue.vout[0].value, BigInt(0), 'Zero value works')
  })

  t.test('create_tx - error handling', t => {
    t.plan(3)

    // Missing required fields for coinbase
    try {
      create_coinbase_input({ txid: '00'.repeat(32), vout: 0 } as any)
      t.fail('Should throw for missing coinbase script')
    } catch (err: any) {
      t.ok(err.message.includes('coinbase'), 'Error should mention coinbase')
    }

    // Missing required fields for spend
    try {
      create_spend_input({ txid: '00'.repeat(32), vout: 0 } as any)
      t.fail('Should throw for missing prevout')
    } catch (err: any) {
      t.ok(err.message.includes('prevout'), 'Error should mention prevout')
    }

    // Invalid txid format
    try {
      create_tx({
        vin: [{ txid: 'invalid', vout: 0 }],
        vout: []
      })
      t.fail('Should throw for invalid txid')
    } catch (err: any) {
      t.pass('Invalid txid throws error')
    }
  })

  t.test('create_tx - multiple inputs and outputs', t => {
    t.plan(4)

    const tx = create_tx({
      version: 2,
      locktime: 0,
      vin: [
        { txid: 'aa'.repeat(32), vout: 0, prevout: { value: 100000, script_pk: '0014' + '00'.repeat(20) } },
        { txid: 'bb'.repeat(32), vout: 1, prevout: { value: 200000, script_pk: '0014' + '11'.repeat(20) } },
        { txid: 'cc'.repeat(32), vout: 2, prevout: { value: 300000, script_pk: '0014' + '22'.repeat(20) } }
      ],
      vout: [
        { value: 150000, script_pk: '76a914' + '33'.repeat(20) + '88ac' },
        { value: 250000, script_pk: '76a914' + '44'.repeat(20) + '88ac' },
        { value: 0, script_pk: '6a04deadbeef' } // OP_RETURN
      ]
    })

    t.equal(tx.vin.length, 3, 'Should have 3 inputs')
    t.equal(tx.vout.length, 3, 'Should have 3 outputs')
    t.equal(tx.vin[1].txid, 'bb'.repeat(32), 'Second input txid correct')
    t.equal(tx.vout[2].value, BigInt(0), 'OP_RETURN output has zero value')
  })
}
