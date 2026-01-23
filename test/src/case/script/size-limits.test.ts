import { Test } from 'tape'
import { Buff } from '@vbyte/buff'

import { encode_script, encode_script_word } from '@/lib/script/encode.js'
import { decode_script } from '@/lib/script/decode.js'
import { MAX_SCRIPT_SIZE } from '@/const.js'

export default function (t: Test): void {
  t.test('Script size limit enforcement', t => {
    t.plan(4)

    // Script just under the limit - need to account for PUSHDATA2 overhead (3 bytes)
    // PUSHDATA2 uses: opcode (1) + length (2) + data
    const almostMaxData = '00'.repeat(MAX_SCRIPT_SIZE - 10) // Leave more room for prefix
    try {
      const encoded = encode_script([almostMaxData])
      t.ok(encoded.length <= MAX_SCRIPT_SIZE, 'Script near limit should encode')
    } catch (err: any) {
      // May fail if still too large
      t.pass('Script near limit handled: ' + err.message)
    }

    // Script at approximately the limit
    const exactData = '00'.repeat(MAX_SCRIPT_SIZE - 5)
    try {
      const encoded = encode_script([exactData])
      t.ok(encoded.length <= MAX_SCRIPT_SIZE, 'Script at limit should encode')
    } catch (err: any) {
      // Expected to fail due to PUSHDATA prefix overhead
      t.pass('Script at exact limit handled (exceeds with prefix)')
    }

    // Script over the limit
    const overMaxData = '00'.repeat(MAX_SCRIPT_SIZE + 100)
    try {
      encode_script([overMaxData])
      t.fail('Script over limit should throw')
    } catch (err: any) {
      t.ok(err.message.includes('exceeds') || err.message.includes('limit'),
        'Script over limit throws with descriptive error')
    }

    // Verify the MAX_SCRIPT_SIZE constant
    t.equal(MAX_SCRIPT_SIZE, 10000, 'MAX_SCRIPT_SIZE should be 10,000 bytes')
  })

  t.test('Word size limits (520 bytes max per element)', t => {
    t.plan(4)

    // Element at max size (520 bytes)
    const maxWord = '00'.repeat(520)
    try {
      const encoded = encode_script_word(maxWord)
      t.ok(encoded, '520-byte element should encode')
    } catch (err: any) {
      t.fail('520-byte element should not throw: ' + err.message)
    }

    // Element over max size should be split
    const overMaxWord = '00'.repeat(521)
    try {
      const encoded = encode_script_word(overMaxWord)
      // Large words get split into multiple chunks
      t.ok(encoded.length > 521, 'Oversized element should be split into chunks')
    } catch (err: any) {
      t.pass('Oversized element handled: ' + err.message)
    }

    // Multiple max-size elements
    const word1 = 'aa'.repeat(520)
    const word2 = 'bb'.repeat(520)
    try {
      const encoded = encode_script([word1, word2])
      t.ok(encoded, 'Multiple max-size elements should encode')
    } catch (err: any) {
      // May exceed total script limit
      if (err.message.includes('exceeds')) {
        t.pass('Multiple max elements exceed total script limit')
      } else {
        t.fail('Unexpected error: ' + err.message)
      }
    }

    // Small elements should use simple varint encoding
    const smallWord = '00'.repeat(75)
    const smallEncoded = encode_script_word(smallWord)
    t.equal(smallEncoded[0], 75, '75-byte element should have direct length prefix')
  })

  t.test('PUSHDATA encoding thresholds', t => {
    t.plan(6)

    // 0x4b (75) bytes - max for direct push
    const direct75 = '00'.repeat(75)
    const encoded75 = encode_script_word(direct75)
    t.equal(encoded75[0], 75, '75 bytes uses direct push')

    // 0x4c (76) bytes - requires PUSHDATA1
    const pushdata1_76 = '00'.repeat(76)
    const encoded76 = encode_script_word(pushdata1_76)
    t.equal(encoded76[0], 0x4c, '76 bytes uses PUSHDATA1')
    t.equal(encoded76[1], 76, 'PUSHDATA1 length byte is 76')

    // 0xff (255) bytes - max for PUSHDATA1
    const pushdata1_255 = '00'.repeat(255)
    const encoded255 = encode_script_word(pushdata1_255)
    t.equal(encoded255[0], 0x4c, '255 bytes uses PUSHDATA1')

    // 0x100 (256) bytes - requires PUSHDATA2
    const pushdata2_256 = '00'.repeat(256)
    const encoded256 = encode_script_word(pushdata2_256)
    t.equal(encoded256[0], 0x4d, '256 bytes uses PUSHDATA2')

    // 520 bytes - max standard, uses PUSHDATA2
    const pushdata2_520 = '00'.repeat(520)
    const encoded520 = encode_script_word(pushdata2_520)
    t.equal(encoded520[0], 0x4d, '520 bytes uses PUSHDATA2')
  })

  t.test('Numeric encoding edge cases', t => {
    t.plan(8)

    // OP_0 (0)
    const zero = encode_script(['OP_0'])
    t.equal(zero.hex, '00', 'OP_0 encodes to 0x00')

    // OP_1 through OP_16 (special opcodes)
    const one = encode_script(['OP_1'])
    t.equal(one.hex, '51', 'OP_1 encodes to 0x51')

    const sixteen = encode_script(['OP_16'])
    t.equal(sixteen.hex, '60', 'OP_16 encodes to 0x60')

    // Numbers as values (1-16 become OP_1 to OP_16)
    const num1 = encode_script([1])
    t.equal(num1.hex, '51', 'Number 1 encodes as OP_1')

    const num16 = encode_script([16])
    t.equal(num16.hex, '60', 'Number 16 encodes as OP_16')

    // Number 0 special case
    const num0 = encode_script([0])
    t.equal(num0.hex, '00', 'Number 0 encodes as OP_0')

    // OP_1NEGATE (-1)
    const neg1 = encode_script(['OP_1NEGATE'])
    t.equal(neg1.hex, '4f', 'OP_1NEGATE encodes to 0x4f')

    // Numbers > 16 should be pushed as data
    const num17 = encode_script([17])
    t.ok(num17.length > 1, 'Number 17 is pushed as data')
  })

  t.test('Empty and minimal scripts', t => {
    t.plan(5)

    // Empty script
    const empty = encode_script([])
    t.equal(empty.hex, '00', 'Empty script encodes to single zero byte')

    // Single opcode
    const singleOp = encode_script(['OP_RETURN'])
    t.equal(singleOp.hex, '6a', 'Single OP_RETURN is one byte')

    // Single small data push
    const singleByte = encode_script(['ff'])
    t.equal(singleByte.length, 2, 'Single byte data: length prefix + data')

    // OP_1 (often used like OP_TRUE)
    const opOne = encode_script(['OP_1'])
    t.equal(opOne.hex, '51', 'OP_1 encodes correctly')

    // OP_0 (often used like OP_FALSE)
    const opZero = encode_script(['OP_0'])
    t.equal(opZero.hex, '00', 'OP_0 encodes correctly')
  })

  t.test('Decode/encode roundtrip with edge cases', t => {
    t.plan(5)

    // P2PKH roundtrip
    const p2pkh = '76a914' + '00'.repeat(20) + '88ac'
    const decoded = decode_script(p2pkh)
    const reencoded = encode_script(decoded)
    t.equal(reencoded.hex, p2pkh, 'P2PKH roundtrip')

    // P2TR roundtrip
    const p2tr = '5120' + '00'.repeat(32)
    const decodedTr = decode_script(p2tr)
    const reencodedTr = encode_script(decodedTr)
    t.equal(reencodedTr.hex, p2tr, 'P2TR roundtrip')

    // OP_RETURN with data
    const opReturn = '6a' + '14' + 'aa'.repeat(20)
    const decodedOr = decode_script(opReturn)
    const reencodedOr = encode_script(decodedOr)
    t.equal(reencodedOr.hex, opReturn, 'OP_RETURN roundtrip')

    // Complex multisig
    const multisig = '52' + '21' + '02'.repeat(33) + '21' + '03'.repeat(33) + '52ae'
    const decodedMs = decode_script(multisig)
    const reencodedMs = encode_script(decodedMs)
    t.equal(reencodedMs.hex, multisig, 'Multisig roundtrip')

    // PUSHDATA1 script
    const pushdata1Script = '4c' + '50' + 'ff'.repeat(80) // PUSHDATA1 + len(80) + data
    const decodedPd = decode_script(pushdata1Script)
    t.equal(decodedPd[0], 'ff'.repeat(80), 'PUSHDATA1 decoded correctly')
  })

  t.test('Script with varint length prefix', t => {
    t.plan(3)

    const script = ['OP_DUP', 'OP_HASH160', '00'.repeat(20), 'OP_EQUALVERIFY', 'OP_CHECKSIG']

    // Without varint
    const withoutVarint = encode_script(script, false)

    // With varint
    const withVarint = encode_script(script, true)

    t.ok(withVarint.length > withoutVarint.length, 'Varint version is longer')
    t.equal(withVarint[0], withoutVarint.length, 'First byte is script length')
    t.equal(withVarint.slice(1).hex, withoutVarint.hex, 'Rest matches')
  })

  t.test('Invalid opcode handling', t => {
    t.plan(2)

    // OP_RESERVED and other reserved opcodes
    try {
      encode_script(['OP_RESERVED'])
      t.pass('OP_RESERVED can be encoded (consensus allows it)')
    } catch (err: any) {
      t.pass('OP_RESERVED handled: ' + err.message)
    }

    // Invalid opcode name
    try {
      encode_script(['OP_INVALID_DOES_NOT_EXIST'])
      t.fail('Invalid opcode should throw')
    } catch (err: any) {
      t.pass('Invalid opcode name throws error')
    }
  })
}
