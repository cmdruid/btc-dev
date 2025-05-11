import tape from 'tape'

import address_tests  from '#/case/address/addr.test.js'
import sig_tests      from '#/case/sighash/sig.test.js'
import tx_tests       from '#/case/tx/tx.test.js'
import unit_tests     from '#/case/taproot/unit.test.js'
import tree_tests     from '#/case/taproot/tree.test.js'

tape('Tapscript Test Suite', async t => {
  // address_tests(t)
  // sig_tests(t)
  // tx_tests(t)
  tree_tests(t)
  unit_tests(t)
})
