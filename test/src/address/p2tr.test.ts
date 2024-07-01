
import { Test } from 'tape'

import {
  create_address,
  P2TR
} from '@cmdcode/tapscript2/address'

export default function (t : Test) : void {

  const keydata  = '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605'
  const addr = 'bcrt1pjxmy65eywgafs5tsunw95ruycpqcqnev6ynxp7jaasylcgtcxczsqzdc9v'
  const asm  = [ 'OP_1', keydata ]
  const hex  = `5120${keydata}`
  const ref  = { asm, hex, keydata, network: 'regtest', type: 'p2tr' }

  t.test('P2TR unit test', t => {
    t.plan(4)

    const addr1 = P2TR.create(keydata, 'regtest')
    t.equal(addr1, addr, 'Pubkeydata should encode into proper address.')

    const addr2 = P2TR.encode(keydata, 'regtest')
    t.equal(addr2, addr, 'Pubkeydata should encode into proper address')

    const data = P2TR.decode(addr)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')

    const addr3 = create_address(asm, 'regtest')
    t.equal(addr3, addr, 'scriptPubKey should produce proper address.')
  })
}
