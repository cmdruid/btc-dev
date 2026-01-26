import { Test } from 'tape'
import { Buff } from '@vbyte/buff'
import { create_taproot } from '@/lib/taproot/cblock.js'
import { encode_tapscript } from '@/lib/taproot/encode.js'
import { encode_script } from '@/lib/script/encode.js'

/**
 * Test taproot tree depth limits (BIP-341 specifies max depth of 128)
 */
export default function (t: Test): void {
  // Generate a test internal key (32 bytes, x-only pubkey)
  const TEST_INTERNAL_KEY = '0000000000000000000000000000000000000000000000000000000000000001'

  // Helper to create a tapscript from opcodes
  const makeLeaf = (opcodes: (string | number | Uint8Array)[]) => {
    const scriptBytes = encode_script(opcodes)
    return encode_tapscript(scriptBytes).hex
  }

  t.test('Taproot tree depth - shallow tree (depth 1)', t => {
    t.plan(4)

    // Create a simple tapscript
    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    t.ok(ctx.tapkey, 'Creates tapkey for depth 1 tree')
    t.ok(ctx.cblock, 'Creates control block')
    t.equal(ctx.path.length, 0, 'Path is empty for single leaf')
    t.equal(ctx.int_key, TEST_INTERNAL_KEY, 'Internal key matches')
  })

  t.test('Taproot tree depth - moderate tree (depth 3-4)', t => {
    t.plan(4)

    // Create multiple leaves to form a deeper tree
    const leaves: string[] = []
    for (let i = 0; i < 8; i++) {
      // Create unique scripts with different data
      const leaf = makeLeaf([Buff.num(i, 1).hex, 'OP_DROP', 'OP_1'])
      leaves.push(leaf)
    }

    const target = leaves[0]

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves,
      target
    })

    t.ok(ctx.tapkey, 'Creates tapkey for 8-leaf tree')
    t.ok(ctx.cblock, 'Creates control block')
    t.ok(ctx.path.length > 0, 'Path has elements for multi-leaf tree')
    t.ok(ctx.path.length <= 4, 'Path depth is reasonable for 8 leaves')
  })

  t.test('Taproot tree depth - deep tree (depth ~7)', t => {
    t.plan(3)

    // Create 128 leaves (depth ~7)
    const leaves: string[] = []
    for (let i = 0; i < 128; i++) {
      // Use different data to create unique leaves
      const leaf = makeLeaf([Buff.num(i, 2).hex, 'OP_DROP', 'OP_1'])
      leaves.push(leaf)
    }

    const target = leaves[0]

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves,
      target
    })

    t.ok(ctx.tapkey, 'Creates tapkey for 128-leaf tree')
    t.ok(ctx.cblock, 'Creates control block for deep tree')
    // log2(128) = 7, so path should be around 7 elements
    t.ok(ctx.path.length <= 8, 'Path depth reasonable for 128 leaves')
  })

  t.test('Taproot control block structure', t => {
    t.plan(5)

    const leaf = makeLeaf(['OP_1'])

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf],
      target: leaf
    })

    // Control block structure: version (1 byte) + internal key (32 bytes) + path (32 * n bytes)
    const cblockBytes = Buff.hex(ctx.cblock)

    t.ok(cblockBytes.length >= 33, 'Control block has minimum size (version + internal key)')
    t.equal((cblockBytes.length - 33) % 32, 0, 'Path is multiple of 32 bytes')

    // First byte is version | parity
    const versionParity = cblockBytes.at(0)
    t.ok(versionParity !== undefined, 'Version/parity byte exists')
    t.ok((versionParity! & 0xfe) === 0xc0, 'Version is 0xc0 (tapscript v0)')

    // Internal key is bytes 1-32
    const internalKey = cblockBytes.slice(1, 33).hex
    t.equal(internalKey, TEST_INTERNAL_KEY, 'Internal key in control block matches')
  })

  t.test('Taproot tree - key path only (no scripts)', t => {
    t.plan(4)

    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY
    })

    t.ok(ctx.tapkey, 'Creates tapkey for key-path-only')
    t.ok(ctx.cblock, 'Creates control block')
    t.equal(ctx.path.length, 0, 'Path is empty for key-path-only')
    t.equal(ctx.taproot, null, 'No taproot merkle root for key-path-only')
  })

  t.test('Taproot tree - balanced vs unbalanced', t => {
    t.plan(4)

    // Create a balanced tree with 4 leaves
    const balancedLeaves: string[] = []
    for (let i = 0; i < 4; i++) {
      const leaf = makeLeaf([Buff.num(i, 1).hex, 'OP_DROP', 'OP_1'])
      balancedLeaves.push(leaf)
    }

    const ctxFirst = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: balancedLeaves,
      target: balancedLeaves[0]
    })

    const ctxLast = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: balancedLeaves,
      target: balancedLeaves[3]
    })

    t.ok(ctxFirst.cblock, 'Creates control block for first leaf')
    t.ok(ctxLast.cblock, 'Creates control block for last leaf')

    // In a balanced tree of 4 leaves, each path should be ~2 elements
    t.ok(ctxFirst.path.length <= 2, 'First leaf path is short')
    t.ok(ctxLast.path.length <= 2, 'Last leaf path is short')
  })

  t.test('Taproot tree - duplicate leaves', t => {
    t.plan(2)

    const leaf = makeLeaf(['OP_1'])

    // Tree with duplicate leaves
    const ctx = create_taproot({
      pubkey: TEST_INTERNAL_KEY,
      leaves: [leaf, leaf, leaf],
      target: leaf
    })

    t.ok(ctx.tapkey, 'Creates tapkey with duplicate leaves')
    t.ok(ctx.cblock, 'Creates control block with duplicate leaves')
  })
}
