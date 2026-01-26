import tape from 'tape'

import p2pkh_test  from './case/address/p2pkh.test.js'
import p2sh_test   from './case/address/p2sh.test.js'
import p2wpkh_test from './case/address/p2wpkh.test.js'
import p2wsh_test  from './case/address/p2wsh.test.js'
import p2tr_test   from './case/address/p2tr.test.js'

import segwit_sighash_test  from './case/sighash/segwit/sighash.test.js'
import sighash_bounds_test  from './case/sighash/bounds.test.js'

import taproot_sighash_test from './case/sighash/taproot/sighash.test.js'
import taproot_unit_test    from './case/sighash/taproot/unit.test.js'
import taproot_sign_test    from './case/sighash/taproot/sign.test.js'

import tree_tests from './case/taproot/tree.test.js'
import unit_tests from './case/taproot/unit.test.js'

// New essential tests
import signer_essential_test from './case/signer/schnorr-essential.test.js'
import signer_scenarios_test from './case/signer/transaction-scenarios.test.js'
import signer_sighash_test from './case/signer/sighash-coverage.test.js'
import signer_verify_test from './case/signer/verify-tx.test.js'
import script_basic_test from './case/script/basic-patterns.test.js'
import script_opcode_test from './case/script/opcode-essentials.test.js'
import script_size_test from './case/script/size-limits.test.js'
import tx_essential_test from './case/tx/essential-operations.test.js'
import tx_create_test from './case/tx/create.test.js'

// Phase 2 module tests
import witness_parse_test from './case/witness/parse.test.js'
import witness_edge_test from './case/witness/edge-cases.test.js'
import script_lock_test from './case/script/lock.test.js'
import meta_locktime_test from './case/meta/locktime.test.js'
import meta_sequence_test from './case/meta/sequence.test.js'
import meta_ref_test from './case/meta/ref.test.js'
import meta_scribe_test from './case/meta/scribe.test.js'
import tx_size_test from './case/tx/size.test.js'

// v2.0.0 release tests
import tx_encoding_test from './case/tx/encoding-functions.test.js'
import tx_error_test from './case/tx/error-handling.test.js'
import taproot_parse_test from './case/taproot/parse-operations.test.js'
import script_roundtrip_test from './case/script/decode-encode-roundtrip.test.js'
import script_malformed_test from './case/script/malformed.test.js'

// Integration tests
import integration_e2e_test from './case/integration/e2e.test.js'

// Custom error tests
import error_custom_test from './case/error/custom-errors.test.js'

// Additional taproot tests
import taproot_depth_test from './case/taproot/depth.test.js'
import taproot_cblock_test from './case/taproot/cblock.test.js'

tape('Tapscript Test Suite', async t => {
  // Existing tests
  p2pkh_test(t)
  p2sh_test(t)
  p2wpkh_test(t)
  p2wsh_test(t)
  p2tr_test(t)
  segwit_sighash_test(t)
  sighash_bounds_test(t)
  taproot_sighash_test(t)
  taproot_unit_test(t)
  taproot_sign_test(t)
  tree_tests(t)
  unit_tests(t)

  // New essential tests for critical modules
  signer_essential_test(t)
  signer_scenarios_test(t)
  signer_sighash_test(t)
  signer_verify_test(t)
  script_basic_test(t)
  script_opcode_test(t)
  script_size_test(t)
  tx_essential_test(t)
  tx_create_test(t)

  // Phase 2 module tests
  witness_parse_test(t)
  witness_edge_test(t)
  script_lock_test(t)
  meta_locktime_test(t)
  meta_sequence_test(t)
  meta_ref_test(t)
  meta_scribe_test(t)
  tx_size_test(t)

  // Integration tests
  integration_e2e_test(t)

  // v2.0.0 release tests
  tx_encoding_test(t)
  tx_error_test(t)
  taproot_parse_test(t)
  script_roundtrip_test(t)
  script_malformed_test(t)

  // Custom error class tests
  error_custom_test(t)

  // Additional taproot tests
  taproot_depth_test(t)
  taproot_cblock_test(t)
})
