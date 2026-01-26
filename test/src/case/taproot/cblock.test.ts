import { Test } from 'tape'
import { Buff } from '@vbyte/buff'
import { create_taproot, verify_taproot } from '@/lib/taproot/cblock.js'
import { encode_tapscript } from '@/lib/taproot/encode.js'
import { parse_cblock } from '@/lib/taproot/parse.js'
import { encode_script } from '@/lib/script/encode.js'

/**
 * Test control block creation and verification
 */
export default function (t: Test): void {
  // Test internal key (32 bytes, x-only pubkey)
  const TEST_INTERNAL_KEY = '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

  // Helper to create a tapscript from opcodes
  const makeLeaf = (opcodes: (string | number | Uint8Array)[]) => {
    const scriptBytes = encode_script(opcodes)
    return encode_tapscript(scriptBytes).hex
  }

  t.test('Control block creation - single leaf', t => {
    t.plan(6)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    t.ok(ctx.cblock, 'Control block created')
    t.ok(ctx.tapkey, 'Tapkey created')
    t.equal(ctx.int_key, TEST_INTERNAL_KEY, 'Internal key preserved')
    t.ok(ctx.parity === 0 || ctx.parity === 1, 'Parity is 0 or 1')
    t.ok(ctx.taptweak, 'Taptweak created')
    t.equal(ctx.path.length, 0, 'Single leaf has no path')
  })

  t.test('Control block verification - success case', t => {
    t.plan(3)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    // Verify the control block
    const isValid = verify_taproot(ctx.tapkey, leaf, ctx.cblock)

    t.ok(isValid, 'Control block verifies successfully')
    t.equal(typeof isValid, 'boolean', 'verify_taproot returns boolean')
    t.ok(ctx.tapkey.length === 64, 'Tapkey is 32 bytes (64 hex chars)')
  })

  t.test('Control block verification - wrong tapkey', t => {
    t.plan(2)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    // Use a different tapkey
    const wrongTapkey = '0'.repeat(64)

    const isValid = verify_taproot(wrongTapkey, leaf, ctx.cblock)
    t.notOk(isValid, 'Verification fails with wrong tapkey')

    // Use modified tapkey (flip one bit)
    const modifiedTapkey = ctx.tapkey.slice(0, -1) + (ctx.tapkey.slice(-1) === '0' ? '1' : '0')
    const isValidModified = verify_taproot(modifiedTapkey, leaf, ctx.cblock)
    t.notOk(isValidModified, 'Verification fails with modified tapkey')
  })

  t.test('Control block verification - wrong target', t => {
    t.plan(2)

    const leaf1 = makeLeaf(['OP_1'])
    const leaf2 = makeLeaf(['OP_0'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf1],
      target: leaf1
    })

    // Verify with wrong target
    const isValid = verify_taproot(ctx.tapkey, leaf2, ctx.cblock)
    t.notOk(isValid, 'Verification fails with wrong target')

    // Verify with garbage target
    const garbageTarget = '00'.repeat(32)
    const isValidGarbage = verify_taproot(ctx.tapkey, garbageTarget, ctx.cblock)
    t.notOk(isValidGarbage, 'Verification fails with garbage target')
  })

  t.test('Control block verification - wrong control block', t => {
    t.plan(2)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    // Create a different control block with different internal key
    const differentKey = 'c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5'
    const ctx2 = create_taproot({
      pubkey: differentKey,
      leaves: [leaf],
      target: leaf
    })

    // Use cblock from different tree
    const isValid = verify_taproot(ctx.tapkey, leaf, ctx2.cblock)
    t.notOk(isValid, 'Verification fails with wrong control block')

    // Modify control block (corrupt internal key by changing one byte)
    // This may throw an error due to invalid EC point, which is also a "failure"
    const corruptCblock = ctx.cblock.slice(0, 4) + 'ff' + ctx.cblock.slice(6)
    try {
      const isValidCorrupt = verify_taproot(ctx.tapkey, leaf, corruptCblock)
      t.notOk(isValidCorrupt, 'Verification fails with corrupted control block')
    } catch {
      t.pass('Verification fails with corrupted control block (throws error)')
    }
  })

  t.test('Control block with merkle path', t => {
    t.plan(5)

    // Create a tree with multiple leaves
    const leaves: string[] = []
    for (let i = 0; i < 4; i++) {
      const leaf = makeLeaf([Buff.num(i, 1).hex, 'OP_DROP', 'OP_1'])
      leaves.push(leaf)
    }

    // Create control block for the first leaf
    const ctx0 = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves,
      target: leaves[0]
    })

    // Create control block for the last leaf
    const ctx3 = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves,
      target: leaves[3]
    })

    // Both should produce the same tapkey
    t.equal(ctx0.tapkey, ctx3.tapkey, 'Same tree produces same tapkey')

    // But different control blocks
    t.notEqual(ctx0.cblock, ctx3.cblock, 'Different leaves have different control blocks')

    // Both should verify
    const isValid0 = verify_taproot(ctx0.tapkey, leaves[0], ctx0.cblock)
    t.ok(isValid0, 'First leaf verifies with its control block')

    const isValid3 = verify_taproot(ctx3.tapkey, leaves[3], ctx3.cblock)
    t.ok(isValid3, 'Last leaf verifies with its control block')

    // Cross verification should fail
    const isCrossValid = verify_taproot(ctx0.tapkey, leaves[0], ctx3.cblock)
    t.notOk(isCrossValid, 'Cross verification fails')
  })

  t.test('Control block parsing', t => {
    t.plan(5)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    const parsed = parse_cblock(ctx.cblock)

    t.ok('parity' in parsed, 'Parsed cblock has parity')
    t.ok('path' in parsed, 'Parsed cblock has path')
    t.ok('int_key' in parsed, 'Parsed cblock has int_key')
    t.equal(parsed.int_key, TEST_INTERNAL_KEY, 'Parsed internal key matches')
    t.ok(Array.isArray(parsed.path), 'Path is an array')
  })

  t.test('Control block version and parity', t => {
    t.plan(4)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    const cblockBytes = Buff.hex(ctx.cblock)
    const versionParity = cblockBytes.at(0)!

    // Version is bits 1-7, parity is bit 0
    const version = versionParity & 0xfe
    const parity = versionParity & 0x01

    t.equal(version, 0xc0, 'Version is 0xc0 (tapscript default)')
    t.ok(parity === 0 || parity === 1, 'Parity is valid')
    t.equal(parity, ctx.parity, 'Parity matches context')

    // Test custom version
    const ctx2 = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf,
      version: 0xc0
    })
    t.ok(ctx2.cblock, 'Custom version creates valid cblock')
  })

  t.test('Control block - tapkey length validation', t => {
    t.plan(2)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    // Invalid tapkey length
    try {
      verify_taproot('abcd', leaf, ctx.cblock) // Too short
      t.fail('Should reject short tapkey')
    } catch (err) {
      t.pass('Rejects short tapkey')
    }

    // Valid 32-byte tapkey
    try {
      verify_taproot(ctx.tapkey, leaf, ctx.cblock)
      t.pass('Accepts valid 32-byte tapkey')
    } catch (err) {
      t.fail('Should accept valid tapkey')
    }
  })
}
