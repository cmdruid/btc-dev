
import { Test } from 'tape'

import {
  create_address,
  P2WPKH
} from '@cmdcode/tapscript2/address'

export default function (t : Test) : void {

  const pubkeydata = '03d5af2a3e89cb72ff9ca1b36091ca46e4d4399abc5574b13d3e56bca6c0784679'
  const addr = 'bcrt1q738hdjlatdx9xmg3679kwq9cwd7fa2c84my9zk'
  const keydata  = 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07'
  const asm  = [ 'OP_0', keydata ]
  const hex  = `0014${keydata}`
  const ref  = { asm, hex, keydata, network: 'regtest', type: 'p2w-pkh' }

  t.test('P2WPKH unit test', t => {
    t.plan(4)

    const addr1 = P2WPKH.create(pubkeydata, 'regtest')
    t.equal(addr1, addr, 'Pubkeydata should encode into proper address.')

    const addr2 = P2WPKH.encode(keydata, 'regtest')
    t.equal(addr2, addr, 'Hash should encode into proper address')

    const data = P2WPKH.decode(addr)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')

    const addr3 = create_address(asm, 'regtest')
    t.equal(addr3, addr, 'scriptPubKey should produce proper address.')
  })
}
