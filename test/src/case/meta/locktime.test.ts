import { Test } from 'tape'
import {
  encode_locktime,
  decode_locktime,
  LocktimeField
} from '@/lib/meta/locktime.js'

export default function (t: Test): void {
  t.test('META locktime module - BIP-65 compliance', t => {

    t.test('encode_locktime - block height', t => {
      t.plan(4)

      // Valid block height
      const height = 100000
      const encoded = encode_locktime({ type: 'heightlock', height })
      t.equal(encoded, height, 'Should encode height directly')

      // Minimum valid height
      const minHeight = 1
      const encodedMin = encode_locktime({ type: 'heightlock', height: minHeight })
      t.equal(encodedMin, minHeight, 'Should encode minimum height')

      // Maximum valid height (just below threshold)
      const maxHeight = 499999999
      const encodedMax = encode_locktime({ type: 'heightlock', height: maxHeight })
      t.equal(encodedMax, maxHeight, 'Should encode maximum height')

      // Invalid height (0 or negative)
      try {
        encode_locktime({ type: 'heightlock', height: 0 })
        t.fail('Should throw on height 0')
      } catch (e) {
        t.pass('Should throw on invalid height')
      }
    })

    t.test('encode_locktime - timestamp', t => {
      t.plan(3)

      // Valid timestamp (above threshold)
      const stamp = 1700000000 // Unix timestamp
      const encoded = encode_locktime({ type: 'timelock', stamp })
      t.equal(encoded, stamp, 'Should encode timestamp directly')

      // Minimum valid timestamp (at threshold)
      const minStamp = 500000000
      const encodedMin = encode_locktime({ type: 'timelock', stamp: minStamp })
      t.equal(encodedMin, minStamp, 'Should encode minimum timestamp')

      // Invalid timestamp (below threshold)
      try {
        encode_locktime({ type: 'timelock', stamp: 499999999 })
        t.fail('Should throw on timestamp below threshold')
      } catch (e) {
        t.pass('Should throw on invalid timestamp')
      }
    })

    t.test('decode_locktime - block height', t => {
      t.plan(5)

      // Decode block height
      const decoded = decode_locktime(100000)
      t.equal(decoded?.type, 'heightlock', 'Should decode as heightlock')
      t.equal(decoded?.type === 'heightlock' ? decoded.height : null, 100000, 'Should have correct height')

      // Decode minimum height
      const decodedMin = decode_locktime(1)
      t.equal(decodedMin?.type, 'heightlock', 'Should decode minimum as heightlock')

      // Decode maximum height
      const decodedMax = decode_locktime(499999999)
      t.equal(decodedMax?.type, 'heightlock', 'Should decode maximum as heightlock')
      t.equal(decodedMax?.type === 'heightlock' ? decodedMax.height : null, 499999999, 'Should have correct max height')
    })

    t.test('decode_locktime - timestamp', t => {
      t.plan(3)

      // Decode timestamp
      const decoded = decode_locktime(1700000000)
      t.equal(decoded?.type, 'timelock', 'Should decode as timelock')
      t.equal(decoded?.type === 'timelock' ? decoded.stamp : null, 1700000000, 'Should have correct timestamp')

      // Decode at threshold
      const decodedThreshold = decode_locktime(500000000)
      t.equal(decodedThreshold?.type, 'timelock', 'Should decode at threshold as timelock')
    })

    t.test('decode_locktime - invalid values', t => {
      t.plan(3)

      // Zero
      const decodedZero = decode_locktime(0)
      t.equal(decodedZero, null, 'Zero should return null')

      // Negative
      const decodedNeg = decode_locktime(-1)
      t.equal(decodedNeg, null, 'Negative should return null')

      // NaN
      const decodedNaN = decode_locktime(NaN)
      t.equal(decodedNaN, null, 'NaN should return null')
    })

    t.test('Round-trip encoding/decoding', t => {
      t.plan(4)

      // Height round-trip
      const height = 750000
      const encodedHeight = encode_locktime({ type: 'heightlock', height })
      const decodedHeight = decode_locktime(encodedHeight)
      t.equal(decodedHeight?.type, 'heightlock', 'Height round-trip type should match')
      t.equal(decodedHeight?.type === 'heightlock' ? decodedHeight.height : null, height, 'Height round-trip value should match')

      // Timestamp round-trip
      const stamp = 1609459200 // 2021-01-01
      const encodedStamp = encode_locktime({ type: 'timelock', stamp })
      const decodedStamp = decode_locktime(encodedStamp)
      t.equal(decodedStamp?.type, 'timelock', 'Timestamp round-trip type should match')
      t.equal(decodedStamp?.type === 'timelock' ? decodedStamp.stamp : null, stamp, 'Timestamp round-trip value should match')
    })

    t.test('Namespace API', t => {
      t.plan(2)

      // Test namespace export
      t.equal(typeof LocktimeField.encode, 'function', 'LocktimeField.encode should be a function')
      t.equal(typeof LocktimeField.decode, 'function', 'LocktimeField.decode should be a function')
    })

    t.end()
  })
}
