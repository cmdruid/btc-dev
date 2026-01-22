import { Test } from 'tape'
import {
  get_lock_script_type,
  get_lock_script_version,
  get_lock_script_info,
  is_p2pkh_script,
  is_p2sh_script,
  is_p2wpkh_script,
  is_p2wsh_script,
  is_p2tr_script,
  is_opreturn_script,
  is_return_script
} from '@/lib/script/lock.js'

export default function (t: Test): void {
  t.test('SCRIPT lock detection module', t => {

    t.test('P2PKH script detection', t => {
      t.plan(6)

      // Valid P2PKH: OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
      const validP2PKH = '76a914' + '89'.repeat(20) + '88ac'
      t.true(is_p2pkh_script(validP2PKH), 'Valid P2PKH should be detected')
      t.equal(get_lock_script_type(validP2PKH), 'p2pkh', 'Type should be p2pkh')

      // Invalid P2PKH: wrong hash length
      const invalidP2PKH = '76a914' + '89'.repeat(19) + '88ac'
      t.false(is_p2pkh_script(invalidP2PKH), 'Invalid P2PKH (wrong length) should not match')

      // Invalid P2PKH: wrong opcodes
      const wrongOpcodes = '77a914' + '89'.repeat(20) + '88ac' // Wrong first opcode
      t.false(is_p2pkh_script(wrongOpcodes), 'Invalid P2PKH (wrong opcodes) should not match')

      // Edge case: empty
      t.false(is_p2pkh_script(''), 'Empty script should not match P2PKH')
      t.false(is_p2pkh_script(new Uint8Array(0)), 'Empty bytes should not match P2PKH')
    })

    t.test('P2SH script detection', t => {
      t.plan(5)

      // Valid P2SH: OP_HASH160 <20 bytes> OP_EQUAL
      const validP2SH = 'a914' + '89'.repeat(20) + '87'
      t.true(is_p2sh_script(validP2SH), 'Valid P2SH should be detected')
      t.equal(get_lock_script_type(validP2SH), 'p2sh', 'Type should be p2sh')

      // Invalid P2SH: wrong hash length
      const invalidP2SH = 'a914' + '89'.repeat(21) + '87'
      t.false(is_p2sh_script(invalidP2SH), 'Invalid P2SH (wrong length) should not match')

      // Invalid P2SH: wrong opcodes
      const wrongOpcodes = 'a914' + '89'.repeat(20) + '88' // Wrong last opcode
      t.false(is_p2sh_script(wrongOpcodes), 'Invalid P2SH (wrong opcodes) should not match')

      // Edge case: empty
      t.false(is_p2sh_script(''), 'Empty script should not match P2SH')
    })

    t.test('P2WPKH script detection', t => {
      t.plan(5)

      // Valid P2WPKH: OP_0 <20 bytes>
      const validP2WPKH = '0014' + '89'.repeat(20)
      t.true(is_p2wpkh_script(validP2WPKH), 'Valid P2WPKH should be detected')
      t.equal(get_lock_script_type(validP2WPKH), 'p2wpkh', 'Type should be p2wpkh')

      // Invalid P2WPKH: wrong hash length
      const invalidP2WPKH = '0014' + '89'.repeat(21)
      t.false(is_p2wpkh_script(invalidP2WPKH), 'Invalid P2WPKH (wrong length) should not match')

      // Invalid P2WPKH: wrong version
      const wrongVersion = '0114' + '89'.repeat(20) // OP_1 instead of OP_0
      t.false(is_p2wpkh_script(wrongVersion), 'Invalid P2WPKH (wrong version) should not match')

      // Edge case: empty
      t.false(is_p2wpkh_script(''), 'Empty script should not match P2WPKH')
    })

    t.test('P2WSH script detection', t => {
      t.plan(5)

      // Valid P2WSH: OP_0 <32 bytes>
      const validP2WSH = '0020' + '89'.repeat(32)
      t.true(is_p2wsh_script(validP2WSH), 'Valid P2WSH should be detected')
      t.equal(get_lock_script_type(validP2WSH), 'p2wsh', 'Type should be p2wsh')

      // Invalid P2WSH: wrong hash length
      const invalidP2WSH = '0020' + '89'.repeat(31)
      t.false(is_p2wsh_script(invalidP2WSH), 'Invalid P2WSH (wrong length) should not match')

      // Invalid P2WSH: wrong version
      const wrongVersion = '0120' + '89'.repeat(32) // OP_1 instead of OP_0
      t.false(is_p2wsh_script(wrongVersion), 'Invalid P2WSH (wrong version) should not match')

      // Edge case: empty
      t.false(is_p2wsh_script(''), 'Empty script should not match P2WSH')
    })

    t.test('P2TR script detection', t => {
      t.plan(5)

      // Valid P2TR: OP_1 <32 bytes>
      const validP2TR = '5120' + '89'.repeat(32)
      t.true(is_p2tr_script(validP2TR), 'Valid P2TR should be detected')
      t.equal(get_lock_script_type(validP2TR), 'p2tr', 'Type should be p2tr')

      // Invalid P2TR: wrong hash length
      const invalidP2TR = '5120' + '89'.repeat(31)
      t.false(is_p2tr_script(invalidP2TR), 'Invalid P2TR (wrong length) should not match')

      // Invalid P2TR: wrong version
      const wrongVersion = '0020' + '89'.repeat(32) // OP_0 instead of OP_1
      t.false(is_p2tr_script(wrongVersion), 'Invalid P2TR (wrong version) should not match')

      // Edge case: empty
      t.false(is_p2tr_script(''), 'Empty script should not match P2TR')
    })

    t.test('OP_RETURN script detection', t => {
      t.plan(5)

      // Valid OP_RETURN: 0x6a followed by data
      const validOpReturn = '6a' + '04' + 'deadbeef'
      t.true(is_opreturn_script(validOpReturn), 'Valid OP_RETURN should be detected')
      t.equal(get_lock_script_type(validOpReturn), 'opreturn', 'Type should be opreturn')

      // OP_RETURN with longer data
      const longerOpReturn = '6a' + '14' + 'aa'.repeat(20)
      t.true(is_opreturn_script(longerOpReturn), 'Longer OP_RETURN should be detected')

      // Edge case: just OP_RETURN without data (must have at least 1 byte after 6a)
      const justOpReturn = '6a'
      t.false(is_opreturn_script(justOpReturn), 'Just OP_RETURN without data should not match')

      // Edge case: empty
      t.false(is_opreturn_script(''), 'Empty script should not match OP_RETURN')
    })

    t.test('is_return_script (0x6a prefix)', t => {
      t.plan(3)

      // Script starting with 0x6a
      const opReturnScript = '6a0461746f6d'
      t.true(is_return_script(opReturnScript), 'Script starting with 0x6a should be return script')

      // Script not starting with 0x6a
      const normalScript = '76a914' + '89'.repeat(20) + '88ac'
      t.false(is_return_script(normalScript), 'P2PKH script should not be return script')

      // Empty script
      t.false(is_return_script(new Uint8Array(0)), 'Empty script should not be return script')
    })

    t.test('get_lock_script_version', t => {
      t.plan(4)

      // Segwit v0 (starts with 0x00)
      const p2wpkh = '0014' + '89'.repeat(20)
      t.equal(get_lock_script_version(p2wpkh), 0, 'P2WPKH should be version 0')

      const p2wsh = '0020' + '89'.repeat(32)
      t.equal(get_lock_script_version(p2wsh), 0, 'P2WSH should be version 0')

      // Taproot v1 (starts with 0x51)
      const p2tr = '5120' + '89'.repeat(32)
      t.equal(get_lock_script_version(p2tr), 1, 'P2TR should be version 1')

      // Legacy (no witness version)
      const p2pkh = '76a914' + '89'.repeat(20) + '88ac'
      t.equal(get_lock_script_version(p2pkh), null, 'P2PKH should have null version')
    })

    t.test('get_lock_script_info', t => {
      t.plan(4)

      const p2tr = '5120' + '89'.repeat(32)
      const info = get_lock_script_info(p2tr)
      t.equal(info.type, 'p2tr', 'Info type should be p2tr')
      t.equal(info.version, 1, 'Info version should be 1')

      const p2wpkh = '0014' + '89'.repeat(20)
      const info2 = get_lock_script_info(p2wpkh)
      t.equal(info2.type, 'p2wpkh', 'Info type should be p2wpkh')
      t.equal(info2.version, 0, 'Info version should be 0')
    })

    t.test('Unknown script type', t => {
      t.plan(2)

      // Random invalid script
      const unknownScript = 'deadbeef'
      t.equal(get_lock_script_type(unknownScript), null, 'Unknown script should return null type')

      // Script that looks like multiple types but matches none
      const ambiguousScript = '76a914' + '89'.repeat(19) + '88ac' // Wrong length for P2PKH
      t.equal(get_lock_script_type(ambiguousScript), null, 'Invalid script should return null type')
    })

    t.test('Case insensitivity', t => {
      t.plan(2)

      // Uppercase hex
      const upperP2TR = '5120' + '89'.repeat(32).toUpperCase()
      t.equal(get_lock_script_type(upperP2TR), 'p2tr', 'Uppercase hex should work')

      // Mixed case (need exactly 20 bytes = 40 hex chars for the hash)
      const mixedP2WPKH = '0014' + 'AbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd'
      t.equal(get_lock_script_type(mixedP2WPKH), 'p2wpkh', 'Mixed case hex should work')
    })

    t.test('Uint8Array input support', t => {
      t.plan(3)

      // P2TR as Uint8Array
      const p2trHex = '5120' + '89'.repeat(32)
      const p2trBytes = new Uint8Array(Buffer.from(p2trHex, 'hex'))

      t.equal(get_lock_script_type(p2trBytes), 'p2tr', 'Uint8Array input should work')
      t.true(is_p2tr_script(p2trBytes), 'Uint8Array input should work with is_p2tr_script')
      t.equal(get_lock_script_version(p2trBytes), 1, 'Uint8Array input should work with get_lock_script_version')
    })

    t.end()
  })
}
