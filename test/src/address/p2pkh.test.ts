
import { Test } from 'tape'

import {
  create_address,
  P2PKH
} from '@cmdcode/tapscript2/address'

export default function (t : Test) : void {

  const pubkeydata  = '037191e9be308354c79d9e0d596e74fce4a98768459a846a073799ad20b4c78770'
  const address = 'msi862KMaLR3jHcdKtAh9QMN2sS8Qcyywy'
  const keydata = '85be4269276fd45d0b6f7ee963dd073b202d49ed'
  const asm = [ 'OP_DUP', 'OP_HASH160', keydata, 'OP_EQUALVERIFY', 'OP_CHECKSIG' ]
  const hex = `76a914${keydata}88ac`
  const ref        = { asm, hex, keydata, network: 'testnet', type: 'p2pkh' }

  t.test('P2PKH unit test', t => {
    t.plan(4)

    const addr1 = P2PKH.create(pubkeydata, 'regtest')
    t.equal(addr1, address, 'Pubkeydata should encode into proper address.')

    const addr2 = P2PKH.encode(keydata, 'regtest')
    t.equal(addr2, address, 'Hash should encode into proper address')

    const data  = P2PKH.decode(address)
    t.deepEqual(data, ref, 'Address should produce proper AddressData')

    const addr3 = create_address(asm, 'regtest')
    t.equal(addr3, address, 'script should produce proper address.')
  })
}
