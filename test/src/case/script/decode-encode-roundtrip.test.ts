import { Test } from 'tape'
import { Buff } from '@vbyte/buff'

import {
  encode_script,
  decode_script
} from '@/lib/script/index.js'

export default function (t: Test): void {
  t.test('Basic opcode encoding', t => {
    t.plan(12)

    const basicOpcodes = [
      { asm: 'OP_0',             hex: '00' },
      { asm: 'OP_1',             hex: '51' },
      { asm: 'OP_2',             hex: '52' },
      { asm: 'OP_16',            hex: '60' },
      { asm: 'OP_DUP',           hex: '76' },
      { asm: 'OP_HASH160',       hex: 'a9' },
      { asm: 'OP_EQUALVERIFY',   hex: '88' },
      { asm: 'OP_CHECKSIG',      hex: 'ac' },
      { asm: 'OP_EQUAL',         hex: '87' },
      { asm: 'OP_RETURN',        hex: '6a' },
      { asm: 'OP_CHECKMULTISIG', hex: 'ae' },
      { asm: 'OP_CHECKLOCKTIMEVERIFY', hex: 'b1' }
    ]

    for (const { asm, hex } of basicOpcodes) {
      const encoded = encode_script([asm])
      t.equal(encoded.hex, hex, `${asm} should encode to ${hex}`)
    }
  })

  t.test('Data push encoding - small data (1-75 bytes)', t => {
    t.plan(4)

    // 20-byte hash (P2PKH/P2WPKH pubkey hash)
    const hash20 = '00'.repeat(20)
    const encoded20 = encode_script([hash20])
    t.equal(encoded20[0], 20, '20-byte data should have length prefix 0x14')

    // 32-byte hash (P2WSH script hash / P2TR key)
    const hash32 = '00'.repeat(32)
    const encoded32 = encode_script([hash32])
    t.equal(encoded32[0], 32, '32-byte data should have length prefix 0x20')

    // 33-byte pubkey (compressed)
    const pubkey33 = '02' + '00'.repeat(32)
    const encoded33 = encode_script([pubkey33])
    t.equal(encoded33[0], 33, '33-byte pubkey should have length prefix 0x21')

    // 65-byte pubkey (uncompressed)
    const pubkey65 = '04' + '00'.repeat(64)
    const encoded65 = encode_script([pubkey65])
    t.equal(encoded65[0], 65, '65-byte pubkey should have length prefix 0x41')
  })

  t.test('Data push encoding - OP_PUSHDATA1 (76-255 bytes)', t => {
    t.plan(3)

    // 76 bytes - minimum for OP_PUSHDATA1
    const data76 = '00'.repeat(76)
    const encoded76 = encode_script([data76])
    t.equal(encoded76[0], 0x4c, '76-byte data should use OP_PUSHDATA1')

    // 100 bytes
    const data100 = 'ff'.repeat(100)
    const encoded100 = encode_script([data100])
    t.equal(encoded100[0], 0x4c, '100-byte data should use OP_PUSHDATA1')
    t.equal(encoded100[1], 100, 'Length byte should be 100')
  })

  t.test('Data push encoding - OP_PUSHDATA2 (256-520 bytes)', t => {
    t.plan(3)

    // 256 bytes - minimum for OP_PUSHDATA2
    const data256 = '00'.repeat(256)
    const encoded256 = encode_script([data256])
    t.equal(encoded256[0], 0x4d, '256-byte data should use OP_PUSHDATA2')

    // 520 bytes - maximum standard script element
    const data520 = 'aa'.repeat(520)
    const encoded520 = encode_script([data520])
    t.equal(encoded520[0], 0x4d, '520-byte data should use OP_PUSHDATA2')

    // Check length encoding (little-endian)
    t.equal(encoded520[1] + encoded520[2] * 256, 520, 'Length should be 520 in little-endian')
  })

  t.test('P2PKH script encode/decode roundtrip', t => {
    t.plan(4)

    const pubkeyHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const p2pkhScript = ['OP_DUP', 'OP_HASH160', pubkeyHash, 'OP_EQUALVERIFY', 'OP_CHECKSIG']

    const encoded = encode_script(p2pkhScript)
    t.ok(encoded, 'P2PKH script should encode')

    // Expected format: 76 a9 14 <20-byte-hash> 88 ac
    t.equal(encoded.hex.slice(0, 6), '76a914', 'P2PKH prefix should be 76a914')
    t.equal(encoded.hex.slice(-4), '88ac', 'P2PKH suffix should be 88ac')

    // Decode and verify
    const decoded = decode_script(encoded)
    t.ok(decoded.length === 5, 'Decoded P2PKH should have 5 elements')
  })

  t.test('P2SH script encode/decode roundtrip', t => {
    t.plan(3)

    const scriptHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const p2shScript = ['OP_HASH160', scriptHash, 'OP_EQUAL']

    const encoded = encode_script(p2shScript)
    t.ok(encoded, 'P2SH script should encode')

    // Expected format: a9 14 <20-byte-hash> 87
    t.equal(encoded.hex.slice(0, 4), 'a914', 'P2SH prefix should be a914')
    t.equal(encoded.hex.slice(-2), '87', 'P2SH suffix should be 87')
  })

  t.test('P2WPKH script encode/decode roundtrip', t => {
    t.plan(3)

    const pubkeyHash = '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    const p2wpkhScript = ['OP_0', pubkeyHash]

    const encoded = encode_script(p2wpkhScript)
    t.ok(encoded, 'P2WPKH script should encode')

    // Expected format: 00 14 <20-byte-hash>
    t.equal(encoded.hex.slice(0, 4), '0014', 'P2WPKH prefix should be 0014')
    t.equal(encoded.length, 22, 'P2WPKH script should be 22 bytes')
  })

  t.test('P2WSH script encode/decode roundtrip', t => {
    t.plan(3)

    const scriptHash = '00'.repeat(32)
    const p2wshScript = ['OP_0', scriptHash]

    const encoded = encode_script(p2wshScript)
    t.ok(encoded, 'P2WSH script should encode')

    // Expected format: 00 20 <32-byte-hash>
    t.equal(encoded.hex.slice(0, 4), '0020', 'P2WSH prefix should be 0020')
    t.equal(encoded.length, 34, 'P2WSH script should be 34 bytes')
  })

  t.test('P2TR script encode/decode roundtrip', t => {
    t.plan(3)

    const xOnlyPubkey = '00'.repeat(32)
    const p2trScript = ['OP_1', xOnlyPubkey]

    const encoded = encode_script(p2trScript)
    t.ok(encoded, 'P2TR script should encode')

    // Expected format: 51 20 <32-byte-pubkey>
    t.equal(encoded.hex.slice(0, 4), '5120', 'P2TR prefix should be 5120')
    t.equal(encoded.length, 34, 'P2TR script should be 34 bytes')
  })

  t.test('Multisig script encode/decode roundtrip', t => {
    t.plan(4)

    const pubkey1 = '02' + '11'.repeat(32)
    const pubkey2 = '02' + '22'.repeat(32)
    const pubkey3 = '02' + '33'.repeat(32)

    // 2-of-3 multisig
    const multisigScript = ['OP_2', pubkey1, pubkey2, pubkey3, 'OP_3', 'OP_CHECKMULTISIG']

    const encoded = encode_script(multisigScript)
    t.ok(encoded, 'Multisig script should encode')

    // Verify structure
    t.equal(encoded[0], 0x52, 'Should start with OP_2')
    t.equal(encoded[encoded.length - 1], 0xae, 'Should end with OP_CHECKMULTISIG')

    const decoded = decode_script(encoded)
    t.ok(decoded.length === 6, 'Decoded multisig should have 6 elements')
  })

  t.test('OP_RETURN script encoding', t => {
    t.plan(3)

    // Simple OP_RETURN with text
    const opReturnScript = ['OP_RETURN', Buffer.from('hello world').toString('hex')]

    const encoded = encode_script(opReturnScript)
    t.ok(encoded, 'OP_RETURN script should encode')
    t.equal(encoded[0], 0x6a, 'Should start with OP_RETURN')

    // OP_RETURN with empty data
    const emptyOpReturn = encode_script(['OP_RETURN'])
    t.equal(emptyOpReturn.hex, '6a', 'Empty OP_RETURN should be single byte')
  })

  t.test('Number encoding (OP_1 through OP_16)', t => {
    t.plan(16)

    for (let i = 1; i <= 16; i++) {
      const encoded = encode_script([`OP_${i}`])
      t.equal(encoded[0], 0x50 + i, `OP_${i} should encode to ${(0x50 + i).toString(16)}`)
    }
  })

  t.test('Conditional script encoding', t => {
    t.plan(2)

    const conditionalScript = ['OP_IF', '01', 'OP_ELSE', '02', 'OP_ENDIF']

    const encoded = encode_script(conditionalScript)
    t.ok(encoded, 'Conditional script should encode')

    // Check structure: OP_IF (63) data OP_ELSE (67) data OP_ENDIF (68)
    t.ok(encoded.includes(0x63) && encoded.includes(0x67) && encoded.includes(0x68),
      'Should contain IF, ELSE, ENDIF opcodes')
  })

  t.test('Script with varint prefix', t => {
    t.plan(3)

    const script = ['OP_DUP', 'OP_HASH160', '00'.repeat(20), 'OP_EQUALVERIFY', 'OP_CHECKSIG']

    // Without varint
    const withoutVarint = encode_script(script, false)

    // With varint
    const withVarint = encode_script(script, true)

    t.ok(withVarint.length > withoutVarint.length, 'Script with varint should be longer')

    // First byte of varint script should be length
    t.equal(withVarint[0], withoutVarint.length, 'Varint should indicate script length')

    // Rest should match
    t.equal(withVarint.slice(1).hex, withoutVarint.hex, 'Content after varint should match')
  })

  t.test('Decode script - basic opcodes', t => {
    t.plan(5)

    // P2PKH script hex
    const p2pkhHex = '76a914' + '00'.repeat(20) + '88ac'
    const decoded = decode_script(p2pkhHex)

    t.equal(decoded.length, 5, 'P2PKH should decode to 5 elements')
    t.equal(decoded[0], 'OP_DUP', 'First element should be OP_DUP')
    t.equal(decoded[1], 'OP_HASH160', 'Second element should be OP_HASH160')
    t.equal(decoded[3], 'OP_EQUALVERIFY', 'Fourth element should be OP_EQUALVERIFY')
    t.equal(decoded[4], 'OP_CHECKSIG', 'Fifth element should be OP_CHECKSIG')
  })

  t.test('Decode script - data elements', t => {
    t.plan(3)

    // P2WPKH script
    const p2wpkhHex = '0014' + 'aa'.repeat(20)
    const decoded = decode_script(p2wpkhHex)

    t.equal(decoded.length, 2, 'P2WPKH should decode to 2 elements')
    t.equal(decoded[0], 'OP_0', 'First element should be OP_0')
    t.equal(decoded[1], 'aa'.repeat(20), 'Second element should be the pubkey hash')
  })

  t.test('Roundtrip consistency', t => {
    t.plan(3)

    const scripts = [
      ['OP_DUP', 'OP_HASH160', '00'.repeat(20), 'OP_EQUALVERIFY', 'OP_CHECKSIG'],
      ['OP_0', '00'.repeat(32)],
      ['OP_1', '00'.repeat(32)]
    ]

    for (const script of scripts) {
      const encoded = encode_script(script)
      const decoded = decode_script(encoded)
      const reencoded = encode_script(decoded)

      t.equal(encoded.hex, reencoded.hex, 'Encode-decode-encode should be consistent')
    }
  })
}
