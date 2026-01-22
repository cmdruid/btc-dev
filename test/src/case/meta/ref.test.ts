import { Test } from 'tape'
import { RefPointer } from '@/lib/meta/ref.js'

export default function (t: Test): void {
  t.test('META ref module - Reference pointers', t => {

    t.test('Outpoint encoding/decoding', t => {
      t.plan(7)

      // Valid outpoint
      const txid = 'aa'.repeat(32)
      const vout = 0
      const encoded = RefPointer.outpoint.encode(txid, vout)
      t.equal(encoded, `${txid}:${vout}`, 'Should encode outpoint correctly')

      // Decode outpoint
      const decoded = RefPointer.outpoint.decode(encoded)
      t.equal(decoded.txid, txid, 'Decoded txid should match')
      t.equal(decoded.vout, vout, 'Decoded vout should match')

      // Higher vout
      const encodedHigh = RefPointer.outpoint.encode(txid, 999)
      const decodedHigh = RefPointer.outpoint.decode(encodedHigh)
      t.equal(decodedHigh.vout, 999, 'Should handle higher vout values')

      // Verify valid outpoint
      t.true(RefPointer.outpoint.verify(encoded), 'Valid outpoint should verify')

      // Verify invalid outpoint
      t.false(RefPointer.outpoint.verify('invalid'), 'Invalid outpoint should not verify')
      t.false(RefPointer.outpoint.verify('aa:0'), 'Short txid should not verify')
    })

    t.test('Outpoint assertion', t => {
      t.plan(2)

      const validOutpoint = 'aa'.repeat(32) + ':0'
      try {
        RefPointer.outpoint.assert(validOutpoint)
        t.pass('Valid outpoint should not throw')
      } catch (e) {
        t.fail('Valid outpoint should not throw')
      }

      const invalidOutpoint = 'invalid:0'
      try {
        RefPointer.outpoint.assert(invalidOutpoint)
        t.fail('Invalid outpoint should throw')
      } catch (e) {
        t.pass('Invalid outpoint should throw')
      }
    })

    t.test('Inscription ID encoding/decoding', t => {
      t.plan(8)

      // Valid inscription ID
      const txid = 'bb'.repeat(32)
      const order = 0
      const encoded = RefPointer.record_id.encode(txid, order)
      t.equal(encoded, `${txid}i${order}`, 'Should encode inscription ID correctly')

      // Decode inscription ID
      const decoded = RefPointer.record_id.decode(encoded)
      t.equal(decoded.txid, txid, 'Decoded txid should match')
      t.equal(decoded.order, order, 'Decoded order should match')

      // Higher order
      const encodedHigh = RefPointer.record_id.encode(txid, 42)
      const decodedHigh = RefPointer.record_id.decode(encodedHigh)
      t.equal(decodedHigh.order, 42, 'Should handle higher order values')

      // Default order
      const encodedDefault = RefPointer.record_id.encode(txid)
      t.equal(encodedDefault, `${txid}i0`, 'Default order should be 0')

      // Verify valid inscription ID
      t.true(RefPointer.record_id.verify(encoded), 'Valid inscription ID should verify')

      // Verify invalid inscription IDs
      t.false(RefPointer.record_id.verify('invalid'), 'Invalid inscription ID should not verify')
      t.false(RefPointer.record_id.verify('aa'.repeat(32) + ':0'), 'Colon format should not verify')
    })

    t.test('Inscription ID assertion', t => {
      t.plan(2)

      const validId = 'cc'.repeat(32) + 'i0'
      try {
        RefPointer.record_id.assert(validId)
        t.pass('Valid inscription ID should not throw')
      } catch (e) {
        t.fail('Valid inscription ID should not throw')
      }

      const invalidId = 'cc'.repeat(32) + ':0' // Wrong separator
      try {
        RefPointer.record_id.assert(invalidId)
        t.fail('Invalid inscription ID should throw')
      } catch (e) {
        t.pass('Invalid inscription ID should throw')
      }
    })

    t.test('Rune ID encoding/decoding', t => {
      t.plan(7)

      // Valid rune ID
      const blockHeight = 840000
      const blockIndex = 15
      const encoded = RefPointer.rune_id.encode(blockHeight, blockIndex)
      t.equal(encoded, `${blockHeight}:${blockIndex}`, 'Should encode rune ID correctly')

      // Decode rune ID
      const decoded = RefPointer.rune_id.decode(encoded)
      t.equal(decoded.block_height, blockHeight, 'Decoded block_height should match')
      t.equal(decoded.block_index, blockIndex, 'Decoded block_index should match')

      // Large values
      const encodedLarge = RefPointer.rune_id.encode(999999, 9999)
      const decodedLarge = RefPointer.rune_id.decode(encodedLarge)
      t.equal(decodedLarge.block_height, 999999, 'Should handle large block_height')
      t.equal(decodedLarge.block_index, 9999, 'Should handle large block_index')

      // Verify valid rune ID
      t.true(RefPointer.rune_id.verify(encoded), 'Valid rune ID should verify')

      // Verify invalid rune ID
      t.false(RefPointer.rune_id.verify('invalid'), 'Invalid rune ID should not verify')
    })

    t.test('Rune ID assertion', t => {
      t.plan(2)

      const validRuneId = '840000:15'
      try {
        RefPointer.rune_id.assert(validRuneId)
        t.pass('Valid rune ID should not throw')
      } catch (e) {
        t.fail('Valid rune ID should not throw')
      }

      const invalidRuneId = '840000i15' // Wrong separator
      try {
        RefPointer.rune_id.assert(invalidRuneId)
        t.fail('Invalid rune ID should throw')
      } catch (e) {
        t.pass('Invalid rune ID should throw')
      }
    })

    t.test('Edge cases', t => {
      t.plan(4)

      // Zero values
      const zeroOutpoint = RefPointer.outpoint.encode('00'.repeat(32), 0)
      t.true(RefPointer.outpoint.verify(zeroOutpoint), 'Zero txid outpoint should verify')

      const zeroRuneId = RefPointer.rune_id.encode(0, 0)
      t.true(RefPointer.rune_id.verify(zeroRuneId), 'Zero rune ID should verify')

      // Very large order/index
      const largeInscription = RefPointer.record_id.encode('dd'.repeat(32), 999999)
      t.true(RefPointer.record_id.verify(largeInscription), 'Large order inscription ID should verify')

      // Verify returns boolean, not truthy/falsy
      const result = RefPointer.outpoint.verify('aa'.repeat(32) + ':0')
      t.equal(typeof result, 'boolean', 'Verify should return boolean')
    })

    t.end()
  })
}
