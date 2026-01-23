import { Test } from 'tape'
import { Buff } from '@vbyte/buff'

import {
  parse_cblock,
  parse_cblock_parity,
  parse_pubkey_parity
} from '@/lib/taproot/parse.js'

import {
  create_taproot,
  verify_taproot
} from '@/lib/taproot/cblock.js'

import { encode_tapscript } from '@/lib/taproot/encode.js'

export default function (t: Test): void {
  t.test('parse_cblock - basic control block parsing', t => {
    t.plan(5)

    // Simple control block: version byte + 32-byte internal pubkey
    const version = 0xc0
    const intKey = '00'.repeat(32)
    const cblock = Buff.num(version, 1).hex + intKey

    const result = parse_cblock(cblock)

    t.equal(result.version, 0xc0, 'Version should be 0xc0')
    t.equal(result.parity, 0x02, 'Parity should be 0x02 for even version')
    t.equal(result.int_key, intKey, 'Internal key should match')
    t.equal(result.path.length, 0, 'Path should be empty for single leaf')
    t.ok(typeof result === 'object', 'Result should be an object')
  })

  t.test('parse_cblock - control block with merkle path', t => {
    t.plan(4)

    // Control block with one merkle sibling
    const version = 0xc0
    const intKey = '11'.repeat(32)
    const sibling = '22'.repeat(32)
    const cblock = Buff.num(version, 1).hex + intKey + sibling

    const result = parse_cblock(cblock)

    t.equal(result.int_key, intKey, 'Internal key should match')
    t.equal(result.path.length, 1, 'Path should have one element')
    t.equal(result.path[0], sibling, 'Path sibling should match')
    t.equal(result.version, 0xc0, 'Version should be 0xc0')
  })

  t.test('parse_cblock - control block with multiple merkle siblings', t => {
    t.plan(5)

    // Control block with three merkle siblings (depth 3)
    const version = 0xc0
    const intKey = '11'.repeat(32)
    const sib1 = 'aa'.repeat(32)
    const sib2 = 'bb'.repeat(32)
    const sib3 = 'cc'.repeat(32)
    const cblock = Buff.num(version, 1).hex + intKey + sib1 + sib2 + sib3

    const result = parse_cblock(cblock)

    t.equal(result.path.length, 3, 'Path should have three elements')
    t.equal(result.path[0], sib1, 'First sibling should match')
    t.equal(result.path[1], sib2, 'Second sibling should match')
    t.equal(result.path[2], sib3, 'Third sibling should match')
    t.equal(result.int_key, intKey, 'Internal key should match')
  })

  t.test('parse_cblock - odd parity version', t => {
    t.plan(3)

    // Odd version byte for odd parity
    const version = 0xc1 // 0xc0 + 1 for odd parity
    const intKey = '00'.repeat(32)
    const cblock = Buff.num(version, 1).hex + intKey

    const result = parse_cblock(cblock)

    t.equal(result.version, 0xc0, 'Version should be stripped to 0xc0')
    t.equal(result.parity, 0x03, 'Parity should be 0x03 for odd version')
    t.equal(result.int_key, intKey, 'Internal key should match')
  })

  t.test('parse_cblock_parity - even/odd detection', t => {
    t.plan(6)

    // Even version bytes
    const [ver0, par0] = parse_cblock_parity(0xc0)
    t.equal(ver0, 0xc0, 'Version 0xc0 should stay 0xc0')
    t.equal(par0, 0x02, 'Version 0xc0 should have parity 0x02')

    const [ver2, par2] = parse_cblock_parity(0xc2)
    t.equal(ver2, 0xc2, 'Version 0xc2 should stay 0xc2')
    t.equal(par2, 0x02, 'Version 0xc2 should have parity 0x02')

    // Odd version bytes
    const [ver1, par1] = parse_cblock_parity(0xc1)
    t.equal(ver1, 0xc0, 'Version 0xc1 should be 0xc0')
    t.equal(par1, 0x03, 'Version 0xc1 should have parity 0x03')
  })

  t.test('parse_pubkey_parity - compressed pubkey parity', t => {
    t.plan(4)

    // 0x02 prefix (even y-coordinate)
    const evenPubkey = '02' + '00'.repeat(32)
    const evenParity = parse_pubkey_parity(evenPubkey)
    t.equal(evenParity, 0, 'Even pubkey should return parity 0')

    // 0x03 prefix (odd y-coordinate)
    const oddPubkey = '03' + '00'.repeat(32)
    const oddParity = parse_pubkey_parity(oddPubkey)
    t.equal(oddParity, 1, 'Odd pubkey should return parity 1')

    // Test with Uint8Array
    const evenBytes = Buff.hex(evenPubkey)
    const evenParityBytes = parse_pubkey_parity(evenBytes)
    t.equal(evenParityBytes, 0, 'Even pubkey as bytes should return parity 0')

    const oddBytes = Buff.hex(oddPubkey)
    const oddParityBytes = parse_pubkey_parity(oddBytes)
    t.equal(oddParityBytes, 1, 'Odd pubkey as bytes should return parity 1')
  })

  t.test('parse_pubkey_parity - invalid input', t => {
    t.plan(3)

    // Invalid prefix
    try {
      parse_pubkey_parity('04' + '00'.repeat(32))
      t.fail('Should throw for uncompressed pubkey prefix')
    } catch {
      t.pass('Correctly throws for uncompressed pubkey prefix')
    }

    // Too short
    try {
      parse_pubkey_parity('02' + '00'.repeat(31))
      t.fail('Should throw for too short pubkey')
    } catch {
      t.pass('Correctly throws for too short pubkey')
    }

    // Too long
    try {
      parse_pubkey_parity('02' + '00'.repeat(33))
      t.fail('Should throw for too long pubkey')
    } catch {
      t.pass('Correctly throws for too long pubkey')
    }
  })

  t.test('parse_cblock - invalid control block', t => {
    t.plan(2)

    // Too short (less than 33 bytes)
    try {
      parse_cblock('c0' + '00'.repeat(31))
      t.fail('Should throw for too short control block')
    } catch {
      t.pass('Correctly throws for too short control block')
    }

    // Non-aligned path (not multiple of 32 bytes after pubkey)
    try {
      parse_cblock('c0' + '00'.repeat(32) + '11'.repeat(16))
      t.fail('Should throw for non-aligned merkle path')
    } catch {
      t.pass('Correctly throws for non-aligned merkle path')
    }
  })

  t.test('encode_tapscript - basic tapscript encoding', t => {
    t.plan(3)

    // Simple tapscript: <pubkey> OP_CHECKSIG
    const pubkey = '00'.repeat(32)
    const script = '20' + pubkey + 'ac' // PUSH32 <pubkey> OP_CHECKSIG

    const result = encode_tapscript(script)

    t.ok(result, 'Should encode tapscript')
    t.equal(result.length, 32, 'Tapleaf hash should be 32 bytes')
    t.ok(Buff.is_hex(result.hex), 'Result should be valid hex')
  })

  t.test('encode_tapscript - with custom version', t => {
    t.plan(2)

    const script = '20' + '00'.repeat(32) + 'ac'

    // Default version (0xc0)
    const resultDefault = encode_tapscript(script)

    // Explicit version
    const resultExplicit = encode_tapscript(script, 0xc0)

    t.equal(resultDefault.hex, resultExplicit.hex, 'Default and explicit 0xc0 should match')

    // Different version should produce different hash
    const resultOther = encode_tapscript(script, 0xc2)
    t.notEqual(resultDefault.hex, resultOther.hex, 'Different versions should produce different hashes')
  })

  t.test('verify_taproot - roundtrip verification', t => {
    t.plan(2)

    // Use a valid x-only pubkey from secp256k1 (generator point G's x-coordinate)
    const intKey = '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

    // Create a simple tapscript
    const script = '20' + '00'.repeat(32) + 'ac'
    const target = encode_tapscript(script).hex

    try {
      // Create taproot output
      const taproot = create_taproot({
        pubkey: intKey,
        target: target
      })

      t.ok(taproot.tapkey, 'Taproot should be created')

      // Verify the taproot
      const isValid = verify_taproot(taproot.tapkey, target, taproot.cblock)
      t.ok(isValid, 'Taproot verification should pass')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Taproot creation failed: ${message}`)
      t.fail('Verification skipped')
    }
  })

  t.test('verify_taproot - invalid control block', t => {
    t.plan(2)

    const tapkey = '00'.repeat(32)
    const target = '11'.repeat(32)

    // Invalid control block (wrong internal key)
    const wrongCblock = 'c0' + 'ff'.repeat(32) // Different internal key

    try {
      const isValid = verify_taproot(tapkey, target, wrongCblock)
      t.equal(isValid, false, 'Verification should fail with wrong control block')
    } catch {
      t.pass('Correctly rejects invalid control block')
    }

    // Invalid tapkey size
    try {
      verify_taproot('00'.repeat(31), target, 'c0' + '00'.repeat(32))
      t.fail('Should throw for invalid tapkey size')
    } catch {
      t.pass('Correctly throws for invalid tapkey size')
    }
  })

  t.test('create_taproot - single leaf', t => {
    t.plan(5)

    // Use a valid x-only pubkey from secp256k1
    const intKey = '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
    const script = '20' + '00'.repeat(32) + 'ac'
    const target = encode_tapscript(script).hex

    const result = create_taproot({
      pubkey: intKey,
      target: target
    })

    t.ok(result.tapkey, 'Should produce tapkey')
    t.equal(result.tapkey.length, 64, 'Tapkey should be 32 bytes (64 hex)')
    t.ok(result.cblock, 'Should produce control block')
    t.ok(result.taptweak, 'Should produce taptweak')
    t.equal(result.int_key, intKey, 'Internal key should be preserved')
  })

  t.test('create_taproot - multiple leaves', t => {
    t.plan(4)

    // Use a valid x-only pubkey
    const intKey = '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

    // Multiple tapscripts
    const script1 = '20' + '11'.repeat(32) + 'ac'
    const script2 = '20' + '22'.repeat(32) + 'ac'

    const leaf1 = encode_tapscript(script1).hex
    const leaf2 = encode_tapscript(script2).hex

    try {
      const result = create_taproot({
        pubkey: intKey,
        leaves: [leaf1, leaf2],
        target: leaf1
      })

      t.ok(result.tapkey, 'Should produce tapkey')
      t.ok(result.cblock.length > 66, 'Control block should include merkle path')
      t.ok(result.path.length > 0, 'Should have merkle path')
      t.ok(result.taproot, 'Should have taproot merkle root')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      t.fail(`Multi-leaf taproot failed: ${message}`)
      t.fail('Control block check skipped')
      t.fail('Path check skipped')
      t.fail('Taproot check skipped')
    }
  })
}
