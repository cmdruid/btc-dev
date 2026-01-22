import { Test } from 'tape'
import { Buff } from '@vbyte/buff'
import { ADDRESS, TX, SCRIPT, WITNESS, TAPROOT, META } from '@/index.js'

export default function (t: Test): void {
  t.test('Integration Tests - End-to-End Workflows', t => {

    t.test('Create address -> Build TX workflow', t => {
      t.plan(6)

      // Step 1: Create a P2WPKH address
      const pubkey = '02' + 'aa'.repeat(32)
      const address = ADDRESS.P2WPKH.create_address(pubkey, 'testnet')
      const script = ADDRESS.P2WPKH.create_script(pubkey)

      t.ok(address.startsWith('tb1q'), 'Address should be testnet bech32')

      // Step 2: Build a transaction spending from this address
      const prevTxid = 'bb'.repeat(32)
      const template = {
        version: 2,
        locktime: 0,
        vin: [{
          txid: prevTxid,
          vout: 0,
          sequence: 0xffffffff,
          prevout: {
            value: 100000n,
            script_pk: script.hex
          }
        }],
        vout: [{
          value: 90000n,
          script_pk: '0014' + 'cc'.repeat(20) // Another P2WPKH
        }]
      }

      const tx = TX.create_tx(template)
      t.equal(tx.vin.length, 1, 'TX should have 1 input')
      t.equal(tx.vout.length, 1, 'TX should have 1 output')

      // Step 3: Calculate transaction size
      const size = TX.get_txsize(tx)
      t.ok(size.vsize > 0, 'Should calculate vsize')
      t.ok(size.weight > 0, 'Should calculate weight')

      // Step 4: Check scriptPubKey detection
      const scriptType = SCRIPT.get_lock_script_type(tx.vout[0].script_pk)
      t.equal(scriptType, 'p2wpkh', 'Output should be P2WPKH')
    })

    t.test('Parse transaction -> Re-encode -> Compare', t => {
      t.plan(5)

      // This is a simplified test transaction structure
      const txdata = {
        version: 2,
        locktime: 0,
        vin: [{
          txid: 'dd'.repeat(32),
          vout: 0,
          coinbase: null,
          prevout: null,
          script_sig: null,
          sequence: 0xffffffff,
          witness: []
        }],
        vout: [{
          value: 50000n,
          script_pk: '76a914' + 'ee'.repeat(20) + '88ac' // P2PKH
        }]
      }

      // Step 1: Encode transaction
      const encoded = TX.encode_tx(txdata, false)
      t.ok(encoded.length > 0, 'Should encode transaction')

      // Step 2: Decode back
      const decoded = TX.decode_tx(encoded)
      t.equal(decoded.version, txdata.version, 'Version should match')
      t.equal(decoded.locktime, txdata.locktime, 'Locktime should match')
      t.equal(decoded.vin.length, txdata.vin.length, 'Input count should match')
      t.equal(decoded.vout.length, txdata.vout.length, 'Output count should match')
    })

    t.test('Witness parsing workflow', t => {
      t.plan(6)

      // P2WPKH witness: [signature, pubkey]
      const sig = '304402203e2b3b7a3b2b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b02203b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b01'
      const pubkey = '02' + 'ff'.repeat(32)

      const witness = [Buff.hex(sig), Buff.hex(pubkey)]
      const parsed = WITNESS.parse_witness(witness)

      t.equal(parsed.type, 'p2wpkh', 'Should detect P2WPKH')
      t.equal(parsed.version, 0, 'Should be witness v0')
      t.equal(parsed.params.length, 2, 'Should have 2 params')
      t.equal(parsed.params[0], sig, 'First param should be signature')
      t.equal(parsed.params[1], pubkey, 'Second param should be pubkey')
      t.equal(parsed.stack.length, 2, 'Stack should have 2 elements')
    })

    t.test('Taproot context creation workflow', t => {
      t.plan(5)

      // Create taproot with internal key
      const internalPubkey = 'aa'.repeat(32)

      const ctx = TAPROOT.create_taproot({
        pubkey: internalPubkey
      })

      t.ok(ctx.tapkey, 'Should create tapkey')
      t.ok(ctx.taptweak, 'Should create taptweak')
      t.equal(ctx.int_key, internalPubkey, 'Internal key should match')
      t.ok(ctx.cblock.length > 0, 'Should have control block')
      t.equal(ctx.parity === 0 || ctx.parity === 1, true, 'Parity should be 0 or 1')
    })

    t.test('Metadata encoding/decoding workflow', t => {
      t.plan(6)

      // Locktime workflow
      const heightLock = META.encode_locktime({ type: 'heightlock', height: 800000 })
      const decodedLock = META.decode_locktime(heightLock)
      t.equal(decodedLock?.type, 'heightlock', 'Should decode heightlock')
      t.equal(decodedLock?.type === 'heightlock' ? decodedLock.height : null, 800000, 'Height should match')

      // Sequence workflow
      const seqHeight = META.encode_sequence({ mode: 'height', height: 144 })
      const decodedSeq = META.decode_sequence(seqHeight)
      t.equal(decodedSeq?.mode, 'height', 'Should decode height mode')
      t.equal(decodedSeq?.mode === 'height' ? decodedSeq.height : null, 144, 'Height should match')

      // Reference pointers
      const txid = 'aa'.repeat(32)
      const outpoint = META.RefPointer.outpoint.encode(txid, 0)
      const decodedOut = META.RefPointer.outpoint.decode(outpoint)
      t.equal(decodedOut.txid, txid, 'Txid should match')
      t.equal(decodedOut.vout, 0, 'Vout should match')
    })

    t.test('Script type detection across all types', t => {
      t.plan(6)

      const scripts = {
        p2pkh: '76a914' + '11'.repeat(20) + '88ac',
        p2sh: 'a914' + '22'.repeat(20) + '87',
        p2wpkh: '0014' + '33'.repeat(20),
        p2wsh: '0020' + '44'.repeat(32),
        p2tr: '5120' + '55'.repeat(32),
        opreturn: '6a04deadbeef'
      }

      Object.entries(scripts).forEach(([expected, script]) => {
        const detected = SCRIPT.get_lock_script_type(script)
        t.equal(detected, expected, `Should detect ${expected}`)
      })
    })

    t.test('Multi-input transaction handling', t => {
      t.plan(4)

      const tx = TX.create_tx({
        version: 2,
        locktime: 0,
        vin: [
          { txid: 'aa'.repeat(32), vout: 0, sequence: 0xffffffff },
          { txid: 'bb'.repeat(32), vout: 1, sequence: 0xffffffff },
          { txid: 'cc'.repeat(32), vout: 0, sequence: 0xffffffff }
        ],
        vout: [
          { value: 100000n, script_pk: '0014' + 'dd'.repeat(20) },
          { value: 50000n, script_pk: '0014' + 'ee'.repeat(20) }
        ]
      })

      t.equal(tx.vin.length, 3, 'Should have 3 inputs')
      t.equal(tx.vout.length, 2, 'Should have 2 outputs')

      const encoded = TX.encode_tx(tx, false)
      const decoded = TX.decode_tx(encoded)
      t.equal(decoded.vin.length, 3, 'Decoded should have 3 inputs')
      t.equal(decoded.vout.length, 2, 'Decoded should have 2 outputs')
    })

    t.test('Address format validation', t => {
      t.plan(5)

      // Test different address types using namespace API
      const p2pkhAddr = ADDRESS.P2PKH.create_address('02' + 'aa'.repeat(32), 'main')
      t.ok(p2pkhAddr.startsWith('1') || p2pkhAddr.startsWith('3'), 'P2PKH address format')

      const p2wpkhAddr = ADDRESS.P2WPKH.create_address('02' + 'bb'.repeat(32), 'main')
      t.ok(p2wpkhAddr.startsWith('bc1q'), 'P2WPKH address format')

      const p2trAddr = ADDRESS.P2TR.create_address('cc'.repeat(32), 'main')
      t.ok(p2trAddr.startsWith('bc1p'), 'P2TR address format')

      // Test testnet
      const testP2wpkhAddr = ADDRESS.P2WPKH.create_address('02' + 'dd'.repeat(32), 'testnet')
      t.ok(testP2wpkhAddr.startsWith('tb1q'), 'Testnet P2WPKH address format')

      const testP2trAddr = ADDRESS.P2TR.create_address('ee'.repeat(32), 'testnet')
      t.ok(testP2trAddr.startsWith('tb1p'), 'Testnet P2TR address format')
    })

    t.test('Transaction value calculations', t => {
      t.plan(3)

      const tx = TX.create_tx({
        version: 2,
        locktime: 0,
        vin: [{
          txid: 'aa'.repeat(32),
          vout: 0,
          sequence: 0xffffffff,
          prevout: { value: 100000n, script_pk: '0014' + 'bb'.repeat(20) }
        }],
        vout: [
          { value: 50000n, script_pk: '0014' + 'cc'.repeat(20) },
          { value: 40000n, script_pk: '0014' + 'dd'.repeat(20) }
        ]
      })

      const inputValue = tx.vin.reduce((sum, vin) =>
        sum + (vin.prevout?.value ?? 0n), 0n)
      const outputValue = tx.vout.reduce((sum, vout) =>
        sum + vout.value, 0n)
      const fee = inputValue - outputValue

      t.equal(inputValue, 100000n, 'Input value should be 100000')
      t.equal(outputValue, 90000n, 'Output value should be 90000')
      t.equal(fee, 10000n, 'Fee should be 10000')
    })

    t.end()
  })
}
