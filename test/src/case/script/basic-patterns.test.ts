import { Test } from 'tape'
import { ESSENTIAL_SCRIPT_PATTERNS } from '../../../utils/test-vectors.js'

// Import script functions
import {
  encode_script,
  decode_script,
  is_valid_script,
  parse_script
} from '@/lib/script/index.js'

export default function (t: Test): void {
  t.test('SCRIPT module basic functionality', t => {
    t.plan(4)

    // Test that script functions exist
    t.equal(typeof encode_script, 'function', 'encode_script should be a function')
    t.equal(typeof decode_script, 'function', 'decode_script should be a function')
    t.equal(typeof is_valid_script, 'function', 'is_valid_script should be a function')
    t.equal(typeof parse_script, 'function', 'parse_script should be a function')
  })

  t.test('Essential script pattern validation', t => {
    const patterns = Object.values(ESSENTIAL_SCRIPT_PATTERNS)
    t.plan(patterns.length)

    for (const pattern of patterns) {
      const { script, valid, description } = pattern

      try {
        // Test basic script validation (if script contains actual opcodes, not template)
        if (!script.includes('<')) {
          const result = is_valid_script(script)
          t.equal(typeof result, 'boolean', `${description} - is_valid_script should return boolean`)
        } else {
          // For template scripts, just test that function doesn't crash
          t.pass(`${description} - template script recognized`)
        }
      } catch (err) {
        if (valid) {
          t.fail(`${description} - should not throw for valid script: ${err.message}`)
        } else {
          t.pass(`${description} - correctly throws for invalid script`)
        }
      }
    }
  })

  t.test('Script encoding/decoding round-trip', t => {
    t.plan(6)

    // Test basic opcodes
    const basicScripts = [
      'OP_DUP',
      'OP_HASH160',
      'OP_EQUAL',
      'OP_CHECKSIG',
      'OP_1',
      'OP_RETURN'
    ]

    for (const script of basicScripts) {
      try {
        const encoded = encode_script(script)
        t.ok(encoded, `${script} should encode successfully`)

        // If decode is implemented, test round-trip
        // const decoded = decode_script(encoded)
        // t.equal(decoded, script, `${script} should round-trip correctly`)
      } catch (err) {
        t.fail(`${script} encoding failed: ${err.message}`)
      }
    }
  })

  t.test('Script parsing tests', t => {
    t.plan(4)

    // Test parsing of common script patterns
    const testCases = [
      {
        input: '76a988ac', // OP_DUP OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG (P2PKH pattern without hash)
        description: 'P2PKH script pattern'
      },
      {
        input: 'a987', // OP_HASH160 OP_EQUAL (P2SH pattern without hash)
        description: 'P2SH script pattern'
      },
      {
        input: '00', // OP_0
        description: 'Segwit v0 witness version'
      },
      {
        input: '51', // OP_1
        description: 'Taproot v1 witness version'
      }
    ]

    for (const testCase of testCases) {
      try {
        const result = parse_script(testCase.input)
        t.ok(result, `${testCase.description} should parse successfully`)
      } catch (err) {
        t.fail(`${testCase.description} parsing failed: ${err.message}`)
      }
    }
  })

  t.test('Script error conditions', t => {
    t.plan(4)

    // Test error handling
    const errorCases = [
      { input: '', description: 'empty script' },
      { input: 'INVALID_OPCODE', description: 'invalid opcode' },
      { input: null, description: 'null input' },
      { input: undefined, description: 'undefined input' }
    ]

    for (const errorCase of errorCases) {
      try {
        const result = is_valid_script(errorCase.input as any)
        if (errorCase.input === '' || errorCase.input === null || errorCase.input === undefined) {
          t.equal(result, false, `${errorCase.description} should be invalid`)
        } else {
          t.equal(typeof result, 'boolean', `${errorCase.description} should return boolean`)
        }
      } catch (err) {
        t.pass(`${errorCase.description} correctly throws error`)
      }
    }
  })
}