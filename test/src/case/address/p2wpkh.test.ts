import { Test }   from 'tape'
import { P2WPKH } from '@/pkg/address'

const TEST_VECTOR = {
  network    : 'regtest',
  format     : 'bech32',
  pubkey     : '03d5af2a3e89cb72ff9ca1b36091ca46e4d4399abc5574b13d3e56bca6c0784679',
  address    : 'bcrt1q738hdjlatdx9xmg3679kwq9cwd7fa2c84my9zk',
  hex        : 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07',
  script_asm : [ 'OP_0', 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07' ],
  script_hex : '0014f44f76cbfd5b4c536d11d78b6700b8737c9eab07',
  size       : 20,
  type       : 'p2w-pkh',
  version    : 0,
}

export default function (t : Test) : void {

  t.test('P2WPKH unit test', t => {
    const addr1 = P2WPKH.create(TEST_VECTOR.pubkey, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Pubkey should encode into proper address.')

    const addr2 = P2WPKH.encode(TEST_VECTOR.hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const data = P2WPKH.decode(TEST_VECTOR.address)

    t.equal(data.format,  TEST_VECTOR.format, 'format should match')
    t.equal(data.network, TEST_VECTOR.network, 'network should match')
    t.equal(data.version, TEST_VECTOR.version, 'version should match')
    t.equal(data.type,       'p2w-pkh', 'type should match')
    t.equal(data.size,       20, 'size should match')
    t.equal(data.hex,        TEST_VECTOR.hex, 'key should match')
    t.deepEqual(data.script_asm, TEST_VECTOR.script_asm, 'script_asm should match')
    t.equal(data.script_hex, TEST_VECTOR.script_hex, 'script_hex should match')

    t.end()
  })
}
