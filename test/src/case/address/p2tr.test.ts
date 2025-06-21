
import { Test } from 'tape'
import { P2TR } from '@/dist/address'

export default function (t : Test) : void {

  const pubkey  = '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605'
  const address = 'bcrt1pjxmy65eywgafs5tsunw95ruycpqcqnev6ynxp7jaasylcgtcxczsqzdc9v'
  const asm     = [ 'OP_1', pubkey ]
  const hex     = `5120${pubkey}`
  const ref     = { asm, hex, key: pubkey, network: 'regtest', type: 'p2tr' }

  t.test('P2TR unit test', t => {
    t.plan(2)

    const addr1 = P2TR.encode(pubkey, 'regtest')
    t.equal(addr1, address, 'Pubkey should encode into proper address')

    const data = P2TR.decode(address)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')
  })
}