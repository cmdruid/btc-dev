
import { Test }       from 'tape'
import { P2WSH }      from '@/dist/address'
import { ScriptUtil } from '@/dist/script'

export default function p2wsh_test (t : Test) : void {

  const script  = ScriptUtil.encode([ 1, 2, 'OP_ADD', 3, 'OP_EQUAL' ])
  const address = 'bcrt1qetz4my584ckcqd0acdm7h788lkmslz44q5wc0rd3eknmmzc85sjq9sle8n'
  const hash    = 'cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424'
  const asm     = [ 'OP_0', hash ]
  const hex     = `0020${hash}`
  const ref     = { asm, hex, key: hash, network: 'regtest', type: 'p2w-sh' }

  t.test('P2WSH unit test', t => {
    t.plan(4)

    const addr1 = P2WSH.create(script, 'regtest')
    t.equal(addr1, address, 'Script should encode into proper address.')

    const addr2 = P2WSH.encode(hash, 'regtest')
    t.equal(addr2, address, 'Hash should encode into proper address')

    const data = P2WSH.decode(address)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')
  })
}