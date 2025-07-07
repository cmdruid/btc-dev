import { Test } from 'tape'
import { P2SH } from '@/pkg/address'

const TEST_VECTOR = {
  network    : 'testnet',
  format     : 'base58',
  script     : '001494d325b4767d23020cec68a9ca75b8fe9264b7af',
  address    : '2NFbT9Fkp7yjp22dvu7tHgikd8Yfy87KnTc',
  hex        : 'f52611446bdfa1f67da1fb7805dbee74c6d92a54',
  script_asm : [ 'OP_HASH160', 'f52611446bdfa1f67da1fb7805dbee74c6d92a54', 'OP_EQUAL' ],
  script_hex : 'a914f52611446bdfa1f67da1fb7805dbee74c6d92a5487',
  size       : 20,
  type       : 'p2sh',
  version    : 0xC4,
}

export default function (t : Test) : void {

  t.test('P2SH unit test', t => {
    const addr1 = P2SH.create(TEST_VECTOR.script, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Script should encode into proper address.')

    const addr2 = P2SH.encode(TEST_VECTOR.hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const data = P2SH.decode(TEST_VECTOR.address)

    t.equal(data.format,  TEST_VECTOR.format, 'format should match')
    t.equal(data.network, TEST_VECTOR.network, 'network should match')
    t.equal(data.version, TEST_VECTOR.version, 'version should match')
    t.equal(data.type,       'p2sh', 'type should match')
    t.equal(data.size,       20, 'size should match')
    t.equal(data.hex,        TEST_VECTOR.hex, 'key should match')
    t.deepEqual(data.script_asm, TEST_VECTOR.script_asm, 'script_asm should match')
    t.equal(data.script_hex, TEST_VECTOR.script_hex, 'script_hex should match')

    t.end()
  })
}
