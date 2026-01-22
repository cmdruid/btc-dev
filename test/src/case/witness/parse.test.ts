import { Test } from 'tape'
import { Buff } from '@vbyte/buff'
import { parse_witness } from '@/lib/witness/parse.js'

export default function (t: Test): void {
  t.test('WITNESS module - parse_witness function', t => {

    t.test('P2WPKH witness parsing', t => {
      t.plan(6)

      // P2WPKH witness: [signature, pubkey]
      // Signature is typically 71-72 bytes (DER encoded), pubkey is 33 bytes (compressed)
      const signature = '304402203e2b3b7a3b2b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b02203b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b01'
      const pubkey = '02' + '11'.repeat(32) // 33-byte compressed pubkey

      const witness = [
        Buff.hex(signature),
        Buff.hex(pubkey)
      ]

      const result = parse_witness(witness)

      t.equal(result.type, 'p2wpkh', 'Should detect P2WPKH type')
      t.equal(result.version, 0, 'Should have witness version 0')
      t.equal(result.params.length, 2, 'Should have 2 params')
      t.equal(result.cblock, null, 'Should have no control block')
      t.equal(result.annex, null, 'Should have no annex')
      t.equal(result.script, null, 'Should have no script')
    })

    t.test('P2WSH witness parsing', t => {
      t.plan(6)

      // P2WSH witness: [sig, pubkey, witnessScript]
      // The witnessScript is the last element
      const signature = '304402203e2b3b7a3b2b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b02203b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b01'
      const pubkey = '02' + '11'.repeat(32)
      // OP_1 <pubkey> OP_1 OP_CHECKMULTISIG script (valid witness script)
      const witnessScript = '5121' + '02' + '11'.repeat(32) + '51ae'

      const witness = [
        Buff.hex(signature),
        Buff.hex(pubkey),
        Buff.hex(witnessScript)
      ]

      const result = parse_witness(witness)

      t.equal(result.type, 'p2wsh', 'Should detect P2WSH type')
      t.equal(result.version, 0, 'Should have witness version 0')
      t.equal(result.params.length, 2, 'Should have 2 params (sig and pubkey)')
      t.equal(result.script, witnessScript, 'Should extract the witness script')
      t.equal(result.cblock, null, 'Should have no control block')
      t.equal(result.annex, null, 'Should have no annex')
    })

    t.test('P2TR key-path witness parsing', t => {
      t.plan(5)

      // P2TR key-path: single 64-byte Schnorr signature
      const schnorrSig = 'aa'.repeat(64) // 64-byte Schnorr signature

      const witness = [Buff.hex(schnorrSig)]

      const result = parse_witness(witness)

      t.equal(result.type, 'p2tr', 'Should detect P2TR key-path type')
      t.equal(result.version, 1, 'Should have witness version 1')
      t.equal(result.params.length, 1, 'Should have 1 param (signature)')
      t.equal(result.cblock, null, 'Should have no control block')
      t.equal(result.script, null, 'Should have no script')
    })

    t.test('P2TS script-path witness parsing', t => {
      t.plan(6)

      // P2TS script-path: [sig, script, cblock]
      // Control block: version byte (0xc0) + internal pubkey (32 bytes)
      const schnorrSig = 'aa'.repeat(64)
      const tapscript = '20' + 'bb'.repeat(32) + 'ac' // <pubkey> OP_CHECKSIG
      const cblock = 'c0' + 'cc'.repeat(32) // Version 0xc0 + 32-byte internal pubkey

      const witness = [
        Buff.hex(schnorrSig),
        Buff.hex(tapscript),
        Buff.hex(cblock)
      ]

      const result = parse_witness(witness)

      t.equal(result.type, 'p2ts', 'Should detect P2TS script-path type')
      t.equal(result.version, 1, 'Should have witness version 1')
      t.equal(result.params.length, 1, 'Should have 1 param (signature)')
      t.equal(result.cblock, cblock, 'Should extract the control block')
      t.equal(result.script, tapscript, 'Should extract the tapscript')
      t.equal(result.annex, null, 'Should have no annex')
    })

    t.test('Annex parsing (0x50 prefix)', t => {
      t.plan(4)

      // Annex must start with 0x50 and have at least 2 elements
      const schnorrSig = 'aa'.repeat(64)
      const annex = '50' + 'dd'.repeat(10) // 0x50 prefix indicates annex

      const witness = [
        Buff.hex(schnorrSig),
        Buff.hex(annex)
      ]

      const result = parse_witness(witness)

      t.equal(result.annex, annex, 'Should extract the annex')
      t.equal(result.stack.length, 2, 'Stack should have 2 elements')
      t.equal(result.type, 'p2tr', 'Should detect P2TR type (after annex removal)')
      t.equal(result.version, 1, 'Should have witness version 1')
    })

    t.test('Empty witness handling', t => {
      t.plan(4)

      const witness: Uint8Array[] = []
      const result = parse_witness(witness)

      t.equal(result.type, null, 'Empty witness should have null type')
      t.equal(result.version, null, 'Empty witness should have null version')
      t.equal(result.params.length, 0, 'Empty witness should have no params')
      t.equal(result.stack.length, 0, 'Empty witness should have empty stack')
    })

    t.test('Unknown witness type handling', t => {
      t.plan(2)

      // Single element that's not a valid Schnorr sig (wrong size)
      const weirdData = 'ff'.repeat(50)
      const witness = [Buff.hex(weirdData)]

      const result = parse_witness(witness)

      t.equal(result.type, null, 'Unknown witness format should have null type')
      t.equal(result.version, null, 'Unknown witness format should have null version')
    })

    t.test('Witness stack preservation', t => {
      t.plan(2)

      const sig = '304402203e2b3b7a3b2b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b02203b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b01'
      const pubkey = '02' + '11'.repeat(32)

      const witness = [
        Buff.hex(sig),
        Buff.hex(pubkey)
      ]

      const result = parse_witness(witness)

      t.equal(result.stack.length, 2, 'Stack should preserve all original elements')
      t.deepEqual(result.stack, [sig, pubkey], 'Stack should contain hex strings of original data')
    })

    t.end()
  })
}
