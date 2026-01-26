import { Test } from 'tape'
import { Buff } from '@vbyte/buff'
import { InscriptionUtil, encode_inscription, decode_inscription } from '@/lib/meta/scribe.js'
import { encode_script } from '@/lib/script/encode.js'

export default function (t: Test): void {
  t.test('META scribe module - Inscription utilities', t => {

    t.test('Basic inscription encoding/decoding', t => {
      t.plan(6)

      // Simple text inscription
      const data = [{
        mimetype: 'text/plain',
        content: Buff.str('Hello, Bitcoin!').hex
      }]

      const encoded = encode_inscription(data)
      t.ok(encoded instanceof Uint8Array, 'Encoded inscription should be Uint8Array')
      t.ok(encoded.length > 0, 'Encoded inscription should have content')

      // Decode it back
      const decoded = decode_inscription(encoded)
      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].mimetype, 'text/plain', 'Mimetype should match')
      t.equal(decoded[0].content, Buff.str('Hello, Bitcoin!').hex, 'Content should match')

      // Namespace export should work
      t.equal(InscriptionUtil.encode, encode_inscription, 'Namespace export should match')
    })

    t.test('Inscription with pointer', t => {
      t.plan(3)

      const data = [{
        mimetype: 'text/plain',
        content: Buff.str('Test').hex,
        pointer: 42
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].pointer, 42, 'Pointer should match')
      t.equal(decoded[0].mimetype, 'text/plain', 'Mimetype should be preserved')
    })

    t.test('Inscription with parent', t => {
      t.plan(2)

      const parentId = 'aa'.repeat(32) + 'i0'
      const data = [{
        mimetype: 'text/plain',
        content: Buff.str('Child inscription').hex,
        parent: parentId
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].parent, parentId, 'Parent should match')
    })

    t.test('Inscription with delegate', t => {
      t.plan(2)

      const delegateId = 'bb'.repeat(32) + 'i5'
      const data = [{
        delegate: delegateId
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].delegate, delegateId, 'Delegate should match')
    })

    t.test('Inscription with rune label', t => {
      t.plan(2)

      const data = [{
        mimetype: 'text/plain',
        content: Buff.str('Rune test').hex,
        rune: 'TESTTOKENNAME'
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].rune, 'TESTTOKENNAME', 'Rune label should match')
    })

    t.test('Rune label encoding - basic', t => {
      t.plan(4)

      // Simple rune names
      const data1 = [{ rune: 'A' }]
      const decoded1 = decode_inscription(encode_inscription(data1))
      t.equal(decoded1[0].rune, 'A', 'Single char rune should roundtrip')

      const data2 = [{ rune: 'AB' }]
      const decoded2 = decode_inscription(encode_inscription(data2))
      t.equal(decoded2[0].rune, 'AB', 'Two char rune should roundtrip')

      const data3 = [{ rune: 'Z' }]
      const decoded3 = decode_inscription(encode_inscription(data3))
      t.equal(decoded3[0].rune, 'Z', 'Z should roundtrip')

      const data4 = [{ rune: 'UNCOMMON' }]
      const decoded4 = decode_inscription(encode_inscription(data4))
      t.equal(decoded4[0].rune, 'UNCOMMON', 'UNCOMMON should roundtrip')
    })

    t.test('Rune label encoding - lowercase conversion', t => {
      t.plan(2)

      const data = [{ rune: 'lowercase' }]
      const decoded = decode_inscription(encode_inscription(data))
      t.equal(decoded[0].rune, 'LOWERCASE', 'Lowercase should be converted to uppercase')

      const data2 = [{ rune: 'MixedCase' }]
      const decoded2 = decode_inscription(encode_inscription(data2))
      t.equal(decoded2[0].rune, 'MIXEDCASE', 'Mixed case should be converted to uppercase')
    })

    t.test('Rune label encoding - invalid characters', t => {
      t.plan(1)

      // Invalid characters should throw
      const data = [{ rune: 'TEST123' }]
      try {
        encode_inscription(data)
        t.fail('Should throw for invalid rune characters')
      } catch (e) {
        t.ok(e instanceof Error && e.message.includes('invalid character'), 'Should throw with clear message')
      }
    })

    t.test('Large content chunking', t => {
      t.plan(3)

      // Content larger than 520 bytes should be chunked
      const largeContent = 'aa'.repeat(600) // 600 hex chars = 1200 raw bytes
      const data = [{
        mimetype: 'application/octet-stream',
        content: largeContent
      }]

      const encoded = encode_inscription(data)
      t.ok(encoded.length > 600, 'Encoded should include multiple chunks')

      const decoded = decode_inscription(encoded)
      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].content, largeContent, 'Large content should roundtrip correctly')
    })

    t.test('Inscription with opcode field', t => {
      t.plan(2)

      const data = [{
        mimetype: 'text/plain',
        content: Buff.str('Test').hex,
        opcode: 123
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].opcode, 123, 'Opcode should match')
    })

    t.test('Inscription with ref field', t => {
      t.plan(2)

      const refData = 'cc'.repeat(16)
      const data = [{
        mimetype: 'text/plain',
        content: Buff.str('Test').hex,
        ref: refData
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].ref, refData, 'Ref should match')
    })

    t.test('Full inscription with all fields', t => {
      t.plan(7)

      const data = [{
        mimetype: 'image/png',
        content: 'deadbeef',
        pointer: 100,
        parent: 'dd'.repeat(32) + 'i2',
        delegate: 'ee'.repeat(32) + 'i3',
        opcode: 50,
        rune: 'TESTCOIN'
      }]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded[0].mimetype, 'image/png', 'Mimetype should match')
      t.equal(decoded[0].content, 'deadbeef', 'Content should match')
      t.equal(decoded[0].pointer, 100, 'Pointer should match')
      t.equal(decoded[0].parent, 'dd'.repeat(32) + 'i2', 'Parent should match')
      t.equal(decoded[0].delegate, 'ee'.repeat(32) + 'i3', 'Delegate should match')
      t.equal(decoded[0].opcode, 50, 'Opcode should match')
      t.equal(decoded[0].rune, 'TESTCOIN', 'Rune should match')
    })

    t.test('Multiple inscriptions in single encoding', t => {
      t.plan(4)

      const data = [
        { mimetype: 'text/plain', content: Buff.str('First').hex },
        { mimetype: 'text/html', content: Buff.str('<html>').hex }
      ]

      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 2, 'Should decode two inscriptions')
      t.equal(decoded[0].mimetype, 'text/plain', 'First mimetype should match')
      t.equal(decoded[1].mimetype, 'text/html', 'Second mimetype should match')
      t.equal(decoded[1].content, Buff.str('<html>').hex, 'Second content should match')
    })

    t.test('Missing envelope error', t => {
      t.plan(1)

      // Script without inscription envelope
      const invalidScript = encode_script(['OP_1', 'OP_DROP'])
      try {
        decode_inscription(invalidScript)
        t.fail('Should throw for missing envelope')
      } catch (e) {
        t.ok(e instanceof Error && e.message.includes('envelope not found'), 'Should throw envelope not found')
      }
    })

    t.test('Missing OP_IF error', t => {
      t.plan(1)

      // Script with OP_0 but missing OP_IF
      const invalidScript = encode_script(['OP_0', 'OP_1', '6f7264', 'OP_ENDIF'])
      try {
        decode_inscription(invalidScript)
        t.fail('Should throw for missing OP_IF')
      } catch (e) {
        t.ok(e instanceof Error && e.message.includes('OP_IF'), 'Should throw OP_IF missing')
      }
    })

    t.test('Missing magic bytes error', t => {
      t.plan(1)

      // Script with OP_0 OP_IF but wrong magic bytes
      const invalidScript = encode_script(['OP_0', 'OP_IF', 'deadbeef', 'OP_ENDIF'])
      try {
        decode_inscription(invalidScript)
        t.fail('Should throw for missing magic bytes')
      } catch (e) {
        t.ok(e instanceof Error && e.message.includes('magic bytes'), 'Should throw magic bytes missing')
      }
    })

    t.test('Missing OP_ENDIF error', t => {
      t.plan(1)

      // Script with envelope start but no OP_ENDIF
      const invalidScript = encode_script(['OP_0', 'OP_IF', '6f7264', 'OP_1', Buff.str('text/plain').hex])
      try {
        decode_inscription(invalidScript)
        t.fail('Should throw for missing OP_ENDIF')
      } catch (e) {
        t.ok(e instanceof Error && e.message.includes('OP_ENDIF'), 'Should throw OP_ENDIF missing')
      }
    })

    t.test('Empty inscription', t => {
      t.plan(2)

      // Inscription with no content
      const data = [{}]
      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded.length, 1, 'Should decode one inscription')
      t.equal(decoded[0].content, undefined, 'Content should be undefined')
    })

    t.test('Pointer encoding edge cases', t => {
      t.plan(3)

      // Zero pointer
      const data0 = [{ pointer: 0 }]
      const decoded0 = decode_inscription(encode_inscription(data0))
      t.equal(decoded0[0].pointer, 0, 'Zero pointer should roundtrip')

      // Large pointer
      const data1 = [{ pointer: 65535 }]
      const decoded1 = decode_inscription(encode_inscription(data1))
      t.equal(decoded1[0].pointer, 65535, 'Large pointer should roundtrip')

      // Very large pointer
      const data2 = [{ pointer: 16777215 }]
      const decoded2 = decode_inscription(encode_inscription(data2))
      t.equal(decoded2[0].pointer, 16777215, 'Very large pointer should roundtrip')
    })

    t.test('Inscription ID encoding edge cases', t => {
      t.plan(4)

      // ID with index 0
      const id0 = 'ff'.repeat(32) + 'i0'
      const data0 = [{ parent: id0 }]
      const decoded0 = decode_inscription(encode_inscription(data0))
      t.equal(decoded0[0].parent, id0, 'ID with index 0 should roundtrip')

      // ID with non-zero index
      const id1 = 'aa'.repeat(32) + 'i10'
      const data1 = [{ parent: id1 }]
      const decoded1 = decode_inscription(encode_inscription(data1))
      t.equal(decoded1[0].parent, id1, 'ID with non-zero index should roundtrip')

      // ID with large index
      const id2 = 'bb'.repeat(32) + 'i255'
      const data2 = [{ delegate: id2 }]
      const decoded2 = decode_inscription(encode_inscription(data2))
      t.equal(decoded2[0].delegate, id2, 'ID with large index should roundtrip')

      // Multiple IDs in same inscription
      const data3 = [{
        parent: 'cc'.repeat(32) + 'i1',
        delegate: 'dd'.repeat(32) + 'i2'
      }]
      const decoded3 = decode_inscription(encode_inscription(data3))
      t.equal(decoded3[0].parent, 'cc'.repeat(32) + 'i1', 'Multiple IDs should work together')
    })

    t.test('Content-only inscription (no mimetype)', t => {
      t.plan(2)

      const data = [{ content: 'deadbeef' }]
      const encoded = encode_inscription(data)
      const decoded = decode_inscription(encoded)

      t.equal(decoded[0].content, 'deadbeef', 'Content should decode without mimetype')
      t.equal(decoded[0].mimetype, undefined, 'Mimetype should be undefined')
    })

    t.end()
  })
}
