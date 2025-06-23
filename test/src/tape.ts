import tape from 'tape'

import p2pkh_test  from './case/address/p2pkh.test.js'
import p2sh_test   from './case/address/p2sh.test.js'
import p2wpkh_test from './case/address/p2wpkh.test.js'
import p2wsh_test  from './case/address/p2wsh.test.js'
import p2tr_test   from './case/address/p2tr.test.js'

tape('Tapscript Test Suite', async t => {
  p2pkh_test(t)
  p2sh_test(t)
  p2wpkh_test(t)
  p2wsh_test(t)
  p2tr_test(t)
  // sig_tests(t)
  // tx_tests(t)
  //tree_tests(t)
  //unit_tests(t)
})
