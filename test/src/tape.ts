import tape from 'tape'

import p2pkh_test  from './case/address/p2pkh.test.js'
import p2sh_test   from './case/address/p2sh.test.js'
import p2wpkh_test from './case/address/p2wpkh.test.js'
import p2wsh_test  from './case/address/p2wsh.test.js'
import p2tr_test   from './case/address/p2tr.test.js'

import segwit_sighash_test  from './case/sighash/segwit/sighash.test.js'

import taproot_sighash_test from './case/sighash/taproot/sighash.test.js'
import taproot_unit_test    from './case/sighash/taproot/unit.test.js'
import taproot_sign_test    from './case/sighash/taproot/sign.test.js'

import tree_tests from './case/taproot/tree.test.js'
import unit_tests from './case/taproot/unit.test.js'

// New essential tests
import signer_essential_test from './case/signer/schnorr-essential.test.js'
import signer_scenarios_test from './case/signer/transaction-scenarios.test.js'
import script_basic_test from './case/script/basic-patterns.test.js'
import script_opcode_test from './case/script/opcode-essentials.test.js'
import tx_essential_test from './case/tx/essential-operations.test.js'

tape('Tapscript Test Suite', async t => {
  // Existing tests
  p2pkh_test(t)
  p2sh_test(t)
  p2wpkh_test(t)
  p2wsh_test(t)
  p2tr_test(t)
  segwit_sighash_test(t)
  taproot_sighash_test(t)
  taproot_unit_test(t)
  taproot_sign_test(t)
  tree_tests(t)
  unit_tests(t)

  // New essential tests for critical modules
  signer_essential_test(t)
  signer_scenarios_test(t)
  script_basic_test(t)
  script_opcode_test(t)
  tx_essential_test(t)
})
