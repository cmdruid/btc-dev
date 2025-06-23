
import { Test }  from 'tape'
import { P2PKH } from '@/src/address'

const TEST_VECTOR = {
  network    : 'testnet',
  format     : 'base58',
  pubkey     : '037191e9be308354c79d9e0d596e74fce4a98768459a846a073799ad20b4c78770',
  address    : 'msi862KMaLR3jHcdKtAh9QMN2sS8Qcyywy',
  hex        : '85be4269276fd45d0b6f7ee963dd073b202d49ed',
  script_asm : [ 'OP_DUP', 'OP_HASH160', '85be4269276fd45d0b6f7ee963dd073b202d49ed', 'OP_EQUALVERIFY', 'OP_CHECKSIG' ],
  script_hex : '76a91485be4269276fd45d0b6f7ee963dd073b202d49ed88ac',
  size       : 20,
  type       : 'p2pkh',
  version    : 0x6F,
}

export default function (t : Test) : void {

  t.test('P2PKH unit test', t => {
    const addr1 = P2PKH.create(TEST_VECTOR.pubkey, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'pubkey should encode into proper address.')

    const addr2 = P2PKH.encode(TEST_VECTOR.hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const data = P2PKH.decode(TEST_VECTOR.address)

    t.equal(data.format,  TEST_VECTOR.format, 'format should match')
    t.equal(data.network, TEST_VECTOR.network, 'network should match')
    t.equal(data.version, TEST_VECTOR.version, 'version should match')
    t.equal(data.type,       'p2pkh', 'type should match')
    t.equal(data.size,       20, 'size should match')
    t.equal(data.hex,        TEST_VECTOR.hex, 'key should match')
    t.deepEqual(data.script_asm, TEST_VECTOR.script_asm, 'script_asm should match')
    t.equal(data.script_hex, TEST_VECTOR.script_hex, 'script_hex should match')

    t.end()
  })
}
