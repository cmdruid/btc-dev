import { Test } from 'tape'
import { Buff } from '@vbyte/buff'

import {
  encode_tx,
  encode_tx_version,
  encode_txin_txid,
  encode_txin_vout,
  encode_txin_sequence,
  encode_tx_inputs,
  encode_vin,
  encode_vout_value,
  encode_tx_outputs,
  encode_tx_vout,
  encode_vin_witness,
  encode_tx_locktime,
  encode_script_data
} from '@/lib/tx/encode.js'

import { decode_tx } from '@/lib/tx/decode.js'

export default function (t: Test): void {
  t.test('encode_tx_version', t => {
    t.plan(4)

    // Version 1
    const v1 = encode_tx_version(1)
    t.equal(v1.hex, '01000000', 'Version 1 should encode to 01000000')

    // Version 2
    const v2 = encode_tx_version(2)
    t.equal(v2.hex, '02000000', 'Version 2 should encode to 02000000')

    // Version 0
    const v0 = encode_tx_version(0)
    t.equal(v0.hex, '00000000', 'Version 0 should encode to 00000000')

    // Large version number
    const vMax = encode_tx_version(0x7fffffff)
    t.equal(vMax.length, 4, 'Large version should be 4 bytes')
  })

  t.test('encode_txin_txid', t => {
    t.plan(3)

    // All zeros
    const zeroTxid = '00'.repeat(32)
    const encoded1 = encode_txin_txid(zeroTxid)
    t.equal(encoded1.hex, zeroTxid, 'Zero txid should encode correctly')

    // All ones (ff)
    const onesTxid = 'ff'.repeat(32)
    const encoded2 = encode_txin_txid(onesTxid)
    t.equal(encoded2.hex, onesTxid, 'All-ff txid should encode correctly')

    // Real txid (reversed for internal representation)
    const realTxid = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
    const encoded3 = encode_txin_txid(realTxid)
    t.equal(encoded3.length, 32, 'Real txid should be 32 bytes')
  })

  t.test('encode_txin_vout', t => {
    t.plan(4)

    // Output index 0
    const vout0 = encode_txin_vout(0)
    t.equal(vout0.hex, '00000000', 'Vout 0 should encode to 00000000')

    // Output index 1
    const vout1 = encode_txin_vout(1)
    t.equal(vout1.hex, '01000000', 'Vout 1 should encode to 01000000')

    // Coinbase vout (0xFFFFFFFF)
    const coinbaseVout = encode_txin_vout(0xFFFFFFFF)
    t.equal(coinbaseVout.hex, 'ffffffff', 'Coinbase vout should encode to ffffffff')

    // Large output index
    const voutLarge = encode_txin_vout(256)
    t.equal(voutLarge.hex, '00010000', 'Vout 256 should encode to 00010000')
  })

  t.test('encode_txin_sequence', t => {
    t.plan(4)

    // Default sequence (0xFFFFFFFF)
    const seqDefault = encode_txin_sequence(0xFFFFFFFF)
    t.equal(seqDefault.hex, 'ffffffff', 'Default sequence should encode to ffffffff')

    // Zero sequence
    const seqZero = encode_txin_sequence(0)
    t.equal(seqZero.hex, '00000000', 'Zero sequence should encode to 00000000')

    // RBF sequence (0xFFFFFFFD)
    const seqRbf = encode_txin_sequence(0xFFFFFFFD)
    t.equal(seqRbf.hex, 'fdffffff', 'RBF sequence should encode to fdffffff')

    // Timelock sequence
    const seqTimelock = encode_txin_sequence(0xFFFFFFFE)
    t.equal(seqTimelock.hex, 'feffffff', 'Timelock sequence should encode to feffffff')
  })

  t.test('encode_vout_value', t => {
    t.plan(4)

    // Zero satoshis
    const zero = encode_vout_value(BigInt(0))
    t.equal(zero.hex, '0000000000000000', 'Zero value should encode correctly')

    // 1 BTC (100,000,000 satoshis)
    const oneBtc = encode_vout_value(BigInt(100000000))
    t.equal(oneBtc.length, 8, '1 BTC value should be 8 bytes')

    // 21 million BTC max supply
    const maxBtc = encode_vout_value(BigInt(2100000000000000))
    t.equal(maxBtc.length, 8, 'Max BTC value should be 8 bytes')

    // 1 satoshi
    const oneSat = encode_vout_value(BigInt(1))
    t.equal(oneSat.hex, '0100000000000000', '1 satoshi should encode to 0100000000000000')
  })

  t.test('encode_tx_locktime', t => {
    t.plan(4)

    // Zero locktime
    const ltZero = encode_tx_locktime(0)
    t.equal(ltZero.hex, '00000000', 'Zero locktime should encode to 00000000')

    // Block height locktime (< 500,000,000)
    const ltBlock = encode_tx_locktime(500000)
    t.equal(ltBlock.length, 4, 'Block locktime should be 4 bytes')

    // Unix timestamp locktime (>= 500,000,000)
    const ltTime = encode_tx_locktime(1700000000)
    t.equal(ltTime.length, 4, 'Timestamp locktime should be 4 bytes')

    // Max locktime
    const ltMax = encode_tx_locktime(0xFFFFFFFF)
    t.equal(ltMax.hex, 'ffffffff', 'Max locktime should encode to ffffffff')
  })

  t.test('encode_script_data', t => {
    t.plan(5)

    // Null script (empty)
    const nullScript = encode_script_data(null)
    t.equal(nullScript.hex, '00', 'Null script should encode to 00')

    // Empty script is treated as non-null, so test with single byte
    const singleByte = encode_script_data('ff')
    t.equal(singleByte.hex, '01ff', 'Single byte script should have varint prefix')

    // Simple P2PKH pubkey hash (25 bytes)
    const p2pkhData = '76a914' + '00'.repeat(20) + '88ac'
    const p2pkh = encode_script_data(p2pkhData)
    t.ok(p2pkh.length > 25, 'P2PKH script should encode with varint prefix')

    // P2WPKH script (22 bytes)
    const p2wpkhData = '0014' + '00'.repeat(20)
    const p2wpkh = encode_script_data(p2wpkhData)
    t.equal(p2wpkh[0], 22, 'P2WPKH script varint should be 22')

    // P2TR script (34 bytes)
    const p2trData = '5120' + '00'.repeat(32)
    const p2tr = encode_script_data(p2trData)
    t.equal(p2tr[0], 34, 'P2TR script varint should be 34')
  })

  t.test('encode_vin_witness', t => {
    t.plan(4)

    // Empty witness
    const emptyWitness = encode_vin_witness([])
    t.equal(emptyWitness.hex, '00', 'Empty witness should encode to 00')

    // Single element witness (P2TR key spend)
    const sig = '00'.repeat(64)
    const singleWitness = encode_vin_witness([sig])
    t.ok(singleWitness.length > 65, 'Single element witness should include varint')

    // Two element witness (P2WPKH)
    const pubkey = '02' + '00'.repeat(32)
    const twoWitness = encode_vin_witness([sig, pubkey])
    t.ok(twoWitness[0] === 2, 'Two element witness should have count 2')

    // Three element witness (P2WSH with script)
    const script = '5121' + '02' + '00'.repeat(32) + '51ae' // multisig script
    const threeWitness = encode_vin_witness([sig, pubkey, script])
    t.ok(threeWitness[0] === 3, 'Three element witness should have correct count')
  })

  t.test('encode_tx_vout', t => {
    t.plan(3)

    // Standard output
    const output = {
      value: BigInt(50000),
      script_pk: '0014' + '00'.repeat(20)
    }
    const encoded = encode_tx_vout(output)
    t.ok(encoded.length > 8, 'Output should include value and script')

    // Zero value output (OP_RETURN)
    const opReturnOutput = {
      value: BigInt(0),
      script_pk: '6a0568656c6c6f' // OP_RETURN "hello"
    }
    const opReturn = encode_tx_vout(opReturnOutput)
    t.ok(opReturn.slice(0, 8).every(b => b === 0), 'OP_RETURN should have zero value')

    // Large value output
    const largeOutput = {
      value: BigInt(2100000000000000),
      script_pk: '76a914' + '00'.repeat(20) + '88ac'
    }
    const large = encode_tx_vout(largeOutput)
    t.ok(large.length > 30, 'Large output should encode correctly')
  })

  t.test('encode_vin basic input', t => {
    t.plan(3)

    // Standard input with null script_sig (segwit)
    const input = {
      txid: '11'.repeat(32),
      vout: 0,
      sequence: 0xffffffff,
      coinbase: null,
      script_sig: null,
      witness: [],
      prevout: null
    }
    const encoded = encode_vin(input)
    t.ok(encoded.length >= 41, 'Standard input should be at least 41 bytes')

    // Input with script_sig
    const inputWithSig = {
      ...input,
      script_sig: '76a914' + '00'.repeat(20) + '88ac'
    }
    const encodedWithSig = encode_vin(inputWithSig)
    t.ok(encodedWithSig.length > encoded.length, 'Input with script_sig should be larger')

    // Coinbase input
    const coinbaseInput = {
      txid: '00'.repeat(32),
      vout: 0xFFFFFFFF,
      sequence: 0xffffffff,
      coinbase: '0102030405',
      script_sig: null,
      witness: [],
      prevout: null
    }
    const coinbase = encode_vin(coinbaseInput)
    t.ok(coinbase.length > 40, 'Coinbase input should encode correctly')
  })

  t.test('encode_tx_inputs', t => {
    t.plan(3)

    // Empty inputs
    const emptyInputs = encode_tx_inputs([])
    t.equal(emptyInputs.hex, '00', 'Empty inputs should encode to 00')

    // Single input (use null script_sig for segwit)
    const singleInput = [{
      txid: '11'.repeat(32),
      vout: 0,
      sequence: 0xffffffff,
      coinbase: null,
      script_sig: null,
      witness: [],
      prevout: null
    }]
    const single = encode_tx_inputs(singleInput)
    t.equal(single[0], 1, 'Single input should have count 1')

    // Multiple inputs
    const multiInputs = [
      {
        txid: '11'.repeat(32),
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: null
      },
      {
        txid: '22'.repeat(32),
        vout: 1,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: [],
        prevout: null
      }
    ]
    const multi = encode_tx_inputs(multiInputs)
    t.equal(multi[0], 2, 'Multiple inputs should have correct count')
  })

  t.test('encode_tx_outputs', t => {
    t.plan(3)

    // Empty outputs
    const emptyOutputs = encode_tx_outputs([])
    t.equal(emptyOutputs.hex, '00', 'Empty outputs should encode to 00')

    // Single output
    const singleOutput = [{
      value: BigInt(50000),
      script_pk: '0014' + '00'.repeat(20)
    }]
    const single = encode_tx_outputs(singleOutput)
    t.equal(single[0], 1, 'Single output should have count 1')

    // Multiple outputs
    const multiOutputs = [
      { value: BigInt(30000), script_pk: '0014' + '11'.repeat(20) },
      { value: BigInt(20000), script_pk: '0014' + '22'.repeat(20) }
    ]
    const multi = encode_tx_outputs(multiOutputs)
    t.equal(multi[0], 2, 'Multiple outputs should have correct count')
  })

  t.test('Full transaction encode/decode roundtrip', t => {
    t.plan(5)

    const txData = {
      version: 2,
      vin: [{
        txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: ['00'.repeat(64), '02' + '00'.repeat(32)],
        prevout: null
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '0014' + '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
      }],
      locktime: 0
    }

    const encoded = encode_tx(txData)
    t.ok(encoded, 'Transaction should encode')

    const decoded = decode_tx(encoded)
    t.equal(decoded.version, txData.version, 'Version should match')
    t.equal(decoded.vin.length, txData.vin.length, 'Input count should match')
    t.equal(decoded.vout.length, txData.vout.length, 'Output count should match')
    t.equal(decoded.locktime, txData.locktime, 'Locktime should match')
  })

  t.test('Segwit vs non-segwit encoding', t => {
    t.plan(2)

    const txData = {
      version: 2,
      vin: [{
        txid: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        vout: 0,
        sequence: 0xffffffff,
        coinbase: null,
        script_sig: null,
        witness: ['00'.repeat(64)],
        prevout: null
      }],
      vout: [{
        value: BigInt(50000),
        script_pk: '5120' + '00'.repeat(32)
      }],
      locktime: 0
    }

    const segwit = encode_tx(txData, true)
    const legacy = encode_tx(txData, false)

    t.ok(segwit.length > legacy.length, 'Segwit encoding should be larger than legacy')

    // Segwit marker should be present
    t.equal(segwit.slice(4, 6).hex, '0001', 'Segwit marker should be present')
  })
}
