import { Test } from 'tape'
import { Buff } from '@vbyte/buff'

import { decode_script, is_valid_script } from '@/lib/script/decode.js'

export default function (t: Test): void {
  t.test('Malformed script - truncated varint push', t => {
    t.plan(3)

    // Script starts with 0x20 (push 32 bytes) but has no data
    const truncatedVarint = '20'
    try {
      decode_script(truncatedVarint)
      t.fail('Should have thrown for truncated varint')
    } catch (err: any) {
      t.ok(err.message.includes('Malformed script'),
        'Truncated varint throws descriptive error')
      t.ok(err.message.includes('position'),
        'Error includes position information')
    }

    t.equal(is_valid_script(truncatedVarint), false,
      'is_valid_script returns false for truncated varint')
  })

  t.test('Malformed script - truncated PUSHDATA1', t => {
    t.plan(4)

    // OP_PUSHDATA1 (0x4c) with no size byte
    const noSizeByte = '4c'
    try {
      decode_script(noSizeByte)
      t.fail('Should have thrown for missing size byte')
    } catch (err: any) {
      t.ok(err.message.includes('PUSHDATA1'),
        'Missing size byte throws PUSHDATA1 error')
    }

    // OP_PUSHDATA1 with size byte but truncated data
    const truncatedData = '4c20' + '00'.repeat(10) // Says 32 bytes, only has 10
    try {
      decode_script(truncatedData)
      t.fail('Should have thrown for truncated PUSHDATA1 data')
    } catch (err: any) {
      t.ok(err.message.includes('PUSHDATA1'),
        'Truncated data throws PUSHDATA1 error')
      t.ok(err.message.includes('32') || err.message.includes('position'),
        'Error includes size or position information')
    }

    t.equal(is_valid_script(truncatedData), false,
      'is_valid_script returns false for truncated PUSHDATA1')
  })

  t.test('Malformed script - truncated PUSHDATA2', t => {
    t.plan(4)

    // OP_PUSHDATA2 (0x4d) with incomplete size bytes
    const incompleteSizeBytes = '4d00' // Needs 2 size bytes, only has 1
    try {
      decode_script(incompleteSizeBytes)
      t.fail('Should have thrown for incomplete PUSHDATA2 size')
    } catch (err: any) {
      t.ok(err.message.includes('PUSHDATA2'),
        'Incomplete size throws PUSHDATA2 error')
    }

    // OP_PUSHDATA2 with size bytes but truncated data
    const truncatedData = '4d0001' + '00'.repeat(100) // Says 256 bytes, only has 100
    try {
      decode_script(truncatedData)
      t.fail('Should have thrown for truncated PUSHDATA2 data')
    } catch (err: any) {
      t.ok(err.message.includes('PUSHDATA2'),
        'Truncated data throws PUSHDATA2 error')
      t.ok(err.message.includes('256') || err.message.includes('position'),
        'Error includes expected size or position')
    }

    t.equal(is_valid_script(truncatedData), false,
      'is_valid_script returns false for truncated PUSHDATA2')
  })

  t.test('Malformed script - truncated PUSHDATA4', t => {
    t.plan(3)

    // OP_PUSHDATA4 (0x4e) with incomplete size bytes
    const incompleteSizeBytes = '4e000000' // Needs 4 size bytes, only has 3
    try {
      decode_script(incompleteSizeBytes)
      t.fail('Should have thrown for incomplete PUSHDATA4 size')
    } catch (err: any) {
      t.ok(err.message.includes('PUSHDATA4'),
        'Incomplete size throws PUSHDATA4 error')
    }

    // OP_PUSHDATA4 with valid size but truncated data
    const truncatedData = '4e10000000' + '00'.repeat(5) // Says 16 bytes, only has 5
    try {
      decode_script(truncatedData)
      t.fail('Should have thrown for truncated PUSHDATA4 data')
    } catch (err: any) {
      t.ok(err.message.includes('PUSHDATA4'),
        'Truncated data throws PUSHDATA4 error')
    }

    t.equal(is_valid_script(truncatedData), false,
      'is_valid_script returns false for truncated PUSHDATA4')
  })

  t.test('Malformed script - partial data in middle of script', t => {
    t.plan(2)

    // Valid P2PKH prefix, but truncated hash
    // OP_DUP OP_HASH160 <push 20 bytes> <only 10 bytes of data>
    const truncatedP2PKH = '76a914' + '00'.repeat(10)
    try {
      decode_script(truncatedP2PKH)
      t.fail('Should have thrown for truncated P2PKH')
    } catch (err: any) {
      t.ok(err.message.includes('Malformed script'),
        'Truncated mid-script data throws error')
    }

    t.equal(is_valid_script(truncatedP2PKH), false,
      'is_valid_script returns false for truncated P2PKH')
  })

  t.test('Valid scripts should not throw', t => {
    t.plan(5)

    // P2PKH
    const p2pkh = '76a914' + '00'.repeat(20) + '88ac'
    t.doesNotThrow(() => decode_script(p2pkh), 'Valid P2PKH decodes')

    // P2WPKH
    const p2wpkh = '0014' + '00'.repeat(20)
    t.doesNotThrow(() => decode_script(p2wpkh), 'Valid P2WPKH decodes')

    // P2WSH
    const p2wsh = '0020' + '00'.repeat(32)
    t.doesNotThrow(() => decode_script(p2wsh), 'Valid P2WSH decodes')

    // P2TR
    const p2tr = '5120' + '00'.repeat(32)
    t.doesNotThrow(() => decode_script(p2tr), 'Valid P2TR decodes')

    // OP_RETURN with data
    const opReturn = '6a' + '0b' + Buff.str('hello world').hex
    t.doesNotThrow(() => decode_script(opReturn), 'Valid OP_RETURN decodes')
  })

  t.test('Edge cases - empty and minimal scripts', t => {
    t.plan(3)

    // Empty script
    const emptyScript = ''
    const emptyResult = decode_script(emptyScript)
    t.deepEqual(emptyResult, [], 'Empty script decodes to empty array')

    // Single opcode
    const singleOp = '51' // OP_1
    const singleResult = decode_script(singleOp)
    t.deepEqual(singleResult, ['OP_1'], 'Single opcode decodes correctly')

    // Script with zero-length push (OP_0)
    const op0Script = '00'
    const op0Result = decode_script(op0Script)
    t.deepEqual(op0Result, ['OP_0'], 'OP_0 decodes correctly')
  })
}
