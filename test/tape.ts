import tape from 'tape'

import address_tests  from './src/address/addr.test.js'
import sig_tests      from './src/sig/sig.test.js'
import tx_tests       from './src/tx/tx.test.js'
import unit_tests     from './src/taproot/unit.test.js'
import tweak_test     from './src/taproot/tree.test.js'
import example_tests  from './example/ex_test.js'

tape('Tapscript Test Suite', async t => {

  address_tests(t)
  sig_tests(t)
  tx_tests(t)
  tweak_test(t)
  unit_tests(t)
  await example_tests(t)
})
