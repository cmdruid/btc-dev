import { Test } from 'tape'
import { P2SH } from '@/pkg/address'
import { CONST } from '@/pkg'

const SCRIPT_TYPE = CONST.LOCK_SCRIPT_TYPE

const TEST_VECTOR = {
  network    : 'testnet',
  format     : 'base58',
  script     : '001494d325b4767d23020cec68a9ca75b8fe9264b7af',
  address    : '2NFbT9Fkp7yjp22dvu7tHgikd8Yfy87KnTc',
  data       : 'f52611446bdfa1f67da1fb7805dbee74c6d92a54',
  script_asm : [ 'OP_HASH160', 'f52611446bdfa1f67da1fb7805dbee74c6d92a54', 'OP_EQUAL' ],
  script_hex : 'a914f52611446bdfa1f67da1fb7805dbee74c6d92a5487',
  size       : 20,
  type       : SCRIPT_TYPE.P2SH,
  version    : 0xC4,
}

export default function (t : Test) : void {

  t.test('P2SH unit test', t => {
    const addr1 = P2SH.create_address(TEST_VECTOR.script, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Script should encode into proper address.')

    const addr2 = P2SH.encode_address(TEST_VECTOR.script_hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const ctx = P2SH.decode_address(TEST_VECTOR.address)

    t.equal(ctx.format,  TEST_VECTOR.format,     'format should match')
    t.equal(ctx.network, TEST_VECTOR.network,    'network should match')
    t.equal(ctx.version, TEST_VECTOR.version,    'version should match')
    t.equal(ctx.type,    SCRIPT_TYPE.P2SH,       'type should match')
    t.equal(ctx.size,    20,                     'size should match')
    t.equal(ctx.data,     TEST_VECTOR.data,      'data should match')
    t.deepEqual(ctx.script.asm, TEST_VECTOR.script_asm, 'asm should match')
    t.equal(ctx.script.hex,     TEST_VECTOR.script_hex, 'hex should match')

    t.end()
  })
}
