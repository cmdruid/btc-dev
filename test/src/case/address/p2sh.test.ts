
import { Test } from 'tape'
import { P2SH } from '@/dist/address'

export default function (t : Test) : void {

  const img     = '001494d325b4767d23020cec68a9ca75b8fe9264b7af'
  const address = '2NFbT9Fkp7yjp22dvu7tHgikd8Yfy87KnTc'
  const hash    = 'f52611446bdfa1f67da1fb7805dbee74c6d92a54'
  const asm     = [ 'OP_HASH160', hash, 'OP_EQUAL' ]
  const hex     = `a914${hash}87`
  const ref     = { asm, hex, key: hash, network: 'testnet', type: 'p2sh' }

  t.test('P2SH unit test', t => {
    t.plan(3)

    const addr1 = P2SH.create(img, 'regtest')
    t.equal(addr1, address, 'Script should encode into proper address.')

    const addr2 = P2SH.encode(hash, 'regtest')
    t.equal(addr2, address, 'Hash should encode into proper address')

    const data = P2SH.decode(address)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')
  })
}
