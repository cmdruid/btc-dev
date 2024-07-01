
import { Test } from 'tape'

import {
  create_address,
  P2WSH
} from '@cmdcode/tapscript2/address'

export default function p2wsh_test (t : Test) : void {

  const img  = [ 1, 2, 'OP_ADD', 3, 'OP_EQUAL' ]
  const addr = 'bcrt1qetz4my584ckcqd0acdm7h788lkmslz44q5wc0rd3eknmmzc85sjq9sle8n'
  const keydata  = 'cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424'
  const asm  = [ 'OP_0', keydata, ]
  const hex  = `0020${keydata}`
  const ref  = { asm, hex, keydata, network: 'regtest', type: 'p2w-sh' }

  t.test('P2WSH unit test', t => {
    t.plan(4)

    const addr1 = P2WSH.create(img, 'regtest')
    t.equal(addr1, addr, 'Script should encode into proper address.')

    const addr2 = P2WSH.encode(keydata, 'regtest')
    t.equal(addr2, addr, 'Hash should encode into proper address')

    const data = P2WSH.decode(addr)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')

    const addr3 = create_address(asm, 'regtest')
    t.equal(addr3, addr, 'scriptPubKey should produce proper address.')
  })
}