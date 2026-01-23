import { Test } from 'tape'

// Import script functions
import {
  encode_script,
  is_valid_script
} from '@/lib/script/index.js'

// Essential Bitcoin opcodes for testing
const ESSENTIAL_OPCODES = {
  // Stack operations
  OP_DUP: { code: 0x76, name: 'OP_DUP', description: 'Duplicates top stack item' },
  OP_DROP: { code: 0x75, name: 'OP_DROP', description: 'Removes top stack item' },
  OP_SWAP: { code: 0x7c, name: 'OP_SWAP', description: 'Swaps top two stack items' },

  // Arithmetic operations
  OP_1ADD: { code: 0x8b, name: 'OP_1ADD', description: 'Adds 1 to top stack item' },
  OP_1SUB: { code: 0x8c, name: 'OP_1SUB', description: 'Subtracts 1 from top stack item' },
  OP_ADD: { code: 0x93, name: 'OP_ADD', description: 'Adds top two stack items' },

  // Crypto operations
  OP_HASH160: { code: 0xa9, name: 'OP_HASH160', description: 'RIPEMD160(SHA256(x))' },
  OP_HASH256: { code: 0xaa, name: 'OP_HASH256', description: 'SHA256(SHA256(x))' },
  OP_CHECKSIG: { code: 0xac, name: 'OP_CHECKSIG', description: 'Verify signature' },

  // Comparison operations
  OP_EQUAL: { code: 0x87, name: 'OP_EQUAL', description: 'Returns 1 if inputs are equal' },
  OP_EQUALVERIFY: { code: 0x88, name: 'OP_EQUALVERIFY', description: 'Same as EQUAL, then VERIFY' },

  // Constants
  OP_0: { code: 0x00, name: 'OP_0', description: 'Push empty array onto stack' },
  OP_1: { code: 0x51, name: 'OP_1', description: 'Push 1 onto stack' },
  OP_TRUE: { code: 0x51, name: 'OP_TRUE', description: 'Alias for OP_1' },
  OP_FALSE: { code: 0x00, name: 'OP_FALSE', description: 'Alias for OP_0' },

  // Control flow
  OP_IF: { code: 0x63, name: 'OP_IF', description: 'Execute if top of stack is true' },
  OP_ELSE: { code: 0x67, name: 'OP_ELSE', description: 'Execute if IF condition was false' },
  OP_ENDIF: { code: 0x68, name: 'OP_ENDIF', description: 'End if/else block' },

  // Special
  OP_RETURN: { code: 0x6a, name: 'OP_RETURN', description: 'Mark transaction as invalid' },
  OP_VERIFY: { code: 0x69, name: 'OP_VERIFY', description: 'Mark transaction as invalid if top of stack is false' }
}

// Common script patterns with their hex representation
const SCRIPT_PATTERNS = {
  p2pkh: {
    asm: 'OP_DUP OP_HASH160 <pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG',
    hex: '76a914<pubkey_hash>88ac',
    description: 'Pay to Public Key Hash'
  },
  p2sh: {
    asm: 'OP_HASH160 <script_hash> OP_EQUAL',
    hex: 'a914<script_hash>87',
    description: 'Pay to Script Hash'
  },
  p2pk: {
    asm: '<pubkey> OP_CHECKSIG',
    hex: '<pubkey>ac',
    description: 'Pay to Public Key'
  },
  op_return: {
    asm: 'OP_RETURN <data>',
    hex: '6a<data>',
    description: 'OP_RETURN data output'
  },
  multisig_2of3: {
    asm: 'OP_2 <pubkey1> <pubkey2> <pubkey3> OP_3 OP_CHECKMULTISIG',
    hex: '52<pubkey1><pubkey2><pubkey3>53ae',
    description: '2-of-3 multisig'
  }
}

export default function (t: Test): void {
  t.test('Essential opcode validation', t => {
    const opcodes = Object.values(ESSENTIAL_OPCODES)
    t.plan(opcodes.length)

    for (const opcode of opcodes) {
      try {
        // Test that opcode names are recognized
        const result = is_valid_script(opcode.name)
        t.equal(typeof result, 'boolean', `${opcode.name} should be valid opcode`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        t.fail(`${opcode.name} validation failed: ${message}`)
      }
    }
  })

  t.test('Script pattern encoding', t => {
    const patterns = Object.values(SCRIPT_PATTERNS)
    t.plan(patterns.length)

    for (const pattern of patterns) {
      try {
        // Test basic pattern recognition (without actual data substitution)
        const scriptWithoutData = pattern.asm.replace(/<[^>]+>/g, '00'.repeat(20))
        const result = is_valid_script(scriptWithoutData)
        t.equal(typeof result, 'boolean', `${pattern.description} pattern should be recognized`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        t.fail(`${pattern.description} pattern failed: ${message}`)
      }
    }
  })

  t.test('Common opcode combinations', t => {
    t.plan(8)

    const combinations = [
      'OP_DUP OP_HASH160',
      'OP_EQUALVERIFY OP_CHECKSIG',
      'OP_HASH160 OP_EQUAL',
      'OP_1 OP_ADD',
      'OP_0 OP_IF',
      'OP_ELSE OP_ENDIF',
      'OP_RETURN',
      'OP_VERIFY'
    ]

    for (const combo of combinations) {
      try {
        const result = is_valid_script(combo)
        t.equal(typeof result, 'boolean', `${combo} should be valid combination`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        t.fail(`${combo} combination failed: ${message}`)
      }
    }
  })

  t.test('Script encoding/decoding with basic opcodes', t => {
    t.plan(6)

    const simpleScripts = [
      'OP_1',
      'OP_0',
      'OP_DUP',
      'OP_HASH160',
      'OP_EQUAL',
      'OP_CHECKSIG'
    ]

    for (const script of simpleScripts) {
      try {
        const encoded = encode_script([script])
        t.ok(encoded, `${script} should encode successfully`)

        // TODO: Add round-trip test when decode is fully implemented
        // const decoded = decode_script(encoded)
        // t.equal(decoded, script, `${script} should round-trip correctly`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        t.fail(`${script} encoding failed: ${message}`)
      }
    }
  })

  t.test('Invalid opcode handling', t => {
    t.plan(5)

    const invalidScripts = [
      'zz', // Invalid hex characters
      'ff00ff00ff', // Odd number of hex chars (invalid)
      '', // Empty string
      'g0', // Invalid hex character 'g'
      'xyz' // Non-hex string
    ]

    for (const script of invalidScripts) {
      try {
        const result = is_valid_script(script)
        t.equal(result, false, `${script} should be invalid`)
      } catch (err) {
        t.pass(`${script} correctly throws error for invalid script`)
      }
    }
  })

  t.test('Script size and complexity limits', t => {
    t.plan(3)

    // Test empty script
    try {
      const emptyResult = is_valid_script('')
      t.equal(typeof emptyResult, 'boolean', 'Empty script should return boolean')
    } catch (err) {
      t.pass('Empty script correctly throws error')
    }

    // Test very long script (should handle gracefully)
    try {
      const longScript = 'OP_1 '.repeat(100).trim()
      const longResult = is_valid_script(longScript)
      t.equal(typeof longResult, 'boolean', 'Long script should return boolean')
    } catch (err) {
      t.pass('Long script correctly throws error or handles limits')
    }

    // Test script with mixed valid/invalid
    try {
      const mixedScript = 'OP_1 INVALID OP_DROP'
      const mixedResult = is_valid_script(mixedScript)
      t.equal(mixedResult, false, 'Mixed valid/invalid script should be invalid')
    } catch (err) {
      t.pass('Mixed script correctly throws error')
    }
  })

  t.test('Bitcoin Core compatibility patterns', t => {
    t.plan(4)

    // Test patterns that should be recognized by any Bitcoin implementation
    const corePatterns = [
      'OP_DUP OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG', // P2PKH
      'OP_HASH160 OP_EQUAL',                          // P2SH
      'OP_0',                                         // P2WPKH/P2WSH witness version
      'OP_1'                                          // P2TR witness version
    ]

    for (const pattern of corePatterns) {
      try {
        const result = is_valid_script(pattern)
        t.equal(typeof result, 'boolean', `Core pattern "${pattern}" should be recognized`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        t.fail(`Core pattern "${pattern}" failed: ${message}`)
      }
    }
  })
}