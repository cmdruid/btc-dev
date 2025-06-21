
import { Test }   from 'tape'
import { P2WPKH } from '@/dist/address'

export default function (t : Test) : void {

  const pubkey = '03d5af2a3e89cb72ff9ca1b36091ca46e4d4399abc5574b13d3e56bca6c0784679'
  const address = 'bcrt1q738hdjlatdx9xmg3679kwq9cwd7fa2c84my9zk'
  const hash    = 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07'
  const asm     = [ 'OP_0', hash ]
  const hex     = `0014${hash}`
  const ref     = { asm, hex, key: hash, network: 'regtest', type: 'p2w-pkh' }

  t.test('P2WPKH unit test', t => {
    t.plan(4)

    const addr1 = P2WPKH.create(pubkey, 'regtest')
    t.equal(addr1, address, 'Pubkey should encode into proper address.')

    const addr2 = P2WPKH.encode(hash, 'regtest')
    t.equal(addr2, address, 'Hash should encode into proper address')

    const data = P2WPKH.decode(address)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')
  })
}
