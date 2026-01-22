import { Test } from 'tape'
import {
  encode_sequence,
  decode_sequence,
  SequenceField
} from '@/lib/meta/sequence.js'

export default function (t: Test): void {
  t.test('META sequence module - BIP-68 compliance', t => {

    t.test('encode_sequence - block height mode', t => {
      t.plan(4)

      // Valid height
      const encoded = encode_sequence({ mode: 'height', height: 100 })
      t.equal(encoded, 100, 'Should encode height value')

      // Zero height
      const encodedZero = encode_sequence({ mode: 'height', height: 0 })
      t.equal(encodedZero, 0, 'Should encode zero height')

      // Maximum height (2^16 - 1)
      const maxHeight = 65535
      const encodedMax = encode_sequence({ mode: 'height', height: maxHeight })
      t.equal(encodedMax, maxHeight, 'Should encode maximum height')

      // Invalid height (exceeds maximum)
      try {
        encode_sequence({ mode: 'height', height: 65536 })
        t.fail('Should throw on height exceeding maximum')
      } catch (e) {
        t.pass('Should throw on invalid height')
      }
    })

    t.test('encode_sequence - timestamp mode', t => {
      t.plan(4)

      // Valid timestamp (512 seconds = 1 unit)
      const encoded = encode_sequence({ mode: 'stamp', stamp: 512 })
      // TIMELOCK_TYPE (0x00400000) | value (1)
      t.equal(encoded, 0x00400001, 'Should encode 512 seconds as 1 unit with type flag')

      // Larger timestamp
      const encoded2 = encode_sequence({ mode: 'stamp', stamp: 5120 })
      // 5120 / 512 = 10 units
      t.equal(encoded2, 0x0040000a, 'Should encode 5120 seconds as 10 units')

      // Maximum timestamp (65535 * 512 seconds)
      const maxStamp = 65535 * 512
      const encodedMax = encode_sequence({ mode: 'stamp', stamp: maxStamp })
      t.equal(encodedMax, 0x0040ffff, 'Should encode maximum timestamp')

      // Invalid mode
      try {
        encode_sequence({ mode: 'invalid' as any })
        t.fail('Should throw on invalid mode')
      } catch (e) {
        t.pass('Should throw on invalid mode')
      }
    })

    t.test('decode_sequence - block height mode', t => {
      t.plan(4)

      // Decode height
      const decoded = decode_sequence(100)
      t.equal(decoded?.mode, 'height', 'Should decode as height mode')
      t.equal(decoded?.mode === 'height' ? decoded.height : null, 100, 'Should have correct height')

      // Decode zero
      const decodedZero = decode_sequence(0)
      t.equal(decodedZero?.mode, 'height', 'Should decode zero as height')
      t.equal(decodedZero?.mode === 'height' ? decodedZero.height : null, 0, 'Should have zero height')
    })

    t.test('decode_sequence - timestamp mode', t => {
      t.plan(4)

      // Decode timestamp (with TIMELOCK_TYPE flag set)
      const decoded = decode_sequence(0x00400001)
      t.equal(decoded?.mode, 'stamp', 'Should decode as stamp mode')
      t.equal(decoded?.mode === 'stamp' ? decoded.stamp : null, 512, 'Should have 512 seconds (1 unit)')

      // Decode larger timestamp
      const decoded2 = decode_sequence(0x0040000a)
      t.equal(decoded2?.mode, 'stamp', 'Should decode as stamp mode')
      t.equal(decoded2?.mode === 'stamp' ? decoded2.stamp : null, 5120, 'Should have 5120 seconds (10 units)')
    })

    t.test('decode_sequence - disabled flag', t => {
      t.plan(2)

      // Sequence with disable flag (bit 31 set)
      const disabled = 0x80000000
      const decoded = decode_sequence(disabled)
      t.equal(decoded, null, 'Disabled sequence should return null')

      // Sequence with disable flag and other bits
      const disabledWithData = 0x80000100
      const decoded2 = decode_sequence(disabledWithData)
      t.equal(decoded2, null, 'Disabled sequence with data should return null')
    })

    t.test('decode_sequence - hex string input', t => {
      t.plan(2)

      // Decode from hex string
      const decoded = decode_sequence('64') // 100 in hex
      t.equal(decoded?.mode, 'height', 'Should decode hex string as height')
      t.equal(decoded?.mode === 'height' ? decoded.height : null, 100, 'Should have correct height from hex')
    })

    t.test('Round-trip encoding/decoding', t => {
      t.plan(4)

      // Height round-trip
      const height = 1000
      const encodedHeight = encode_sequence({ mode: 'height', height })
      const decodedHeight = decode_sequence(encodedHeight)
      t.equal(decodedHeight?.mode, 'height', 'Height round-trip mode should match')
      t.equal(decodedHeight?.mode === 'height' ? decodedHeight.height : null, height, 'Height round-trip value should match')

      // Timestamp round-trip
      const stamp = 10240 // 20 units * 512
      const encodedStamp = encode_sequence({ mode: 'stamp', stamp })
      const decodedStamp = decode_sequence(encodedStamp)
      t.equal(decodedStamp?.mode, 'stamp', 'Timestamp round-trip mode should match')
      t.equal(decodedStamp?.mode === 'stamp' ? decodedStamp.stamp : null, stamp, 'Timestamp round-trip value should match')
    })

    t.test('Invalid sequence values', t => {
      t.plan(3)

      // Negative value
      try {
        decode_sequence(-1)
        t.fail('Should throw on negative sequence')
      } catch (e) {
        t.pass('Should throw on negative sequence')
      }

      // Exceeds 32-bit
      try {
        decode_sequence(0x100000000)
        t.fail('Should throw on value exceeding 32 bits')
      } catch (e) {
        t.pass('Should throw on value exceeding 32 bits')
      }

      // Non-integer
      try {
        decode_sequence(1.5)
        t.fail('Should throw on non-integer')
      } catch (e) {
        t.pass('Should throw on non-integer')
      }
    })

    t.test('Namespace API', t => {
      t.plan(2)

      t.equal(typeof SequenceField.encode, 'function', 'SequenceField.encode should be a function')
      t.equal(typeof SequenceField.decode, 'function', 'SequenceField.decode should be a function')
    })

    t.end()
  })
}
