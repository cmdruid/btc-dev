import { Test }   from 'tape'
import { P2WPKH } from '@/pkg/address'
import { CONST } from '@/pkg'

const SCRIPT_TYPE = CONST.LOCK_SCRIPT_TYPE

const TEST_VECTOR = {
  network    : 'regtest',
  format     : 'bech32',
  pubkey     : '03d5af2a3e89cb72ff9ca1b36091ca46e4d4399abc5574b13d3e56bca6c0784679',
  address    : 'bcrt1q738hdjlatdx9xmg3679kwq9cwd7fa2c84my9zk',
  data       : 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07',
  script_asm : [ 'OP_0', 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07' ],
  script_hex : '0014f44f76cbfd5b4c536d11d78b6700b8737c9eab07',
  size       : 20,
  type       : SCRIPT_TYPE.P2WPKH,
  version    : 0,
}

export default function (t : Test) : void {

  t.test('P2WPKH unit test', t => {
    const addr1 = P2WPKH.create_address(TEST_VECTOR.pubkey, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Pubkey should encode into proper address.')

    const addr2 = P2WPKH.encode_address(TEST_VECTOR.script_hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const ctx = P2WPKH.decode_address(TEST_VECTOR.address)

    t.equal(ctx.format,  TEST_VECTOR.format, 'format should match')
    t.equal(ctx.network, TEST_VECTOR.network, 'network should match')
    t.equal(ctx.version, TEST_VECTOR.version, 'version should match')
    t.equal(ctx.type,    SCRIPT_TYPE.P2WPKH, 'type should match')
    t.equal(ctx.size,    20, 'size should match')
    t.equal(ctx.data,     TEST_VECTOR.data, 'data should match')
    t.deepEqual(ctx.script.asm, TEST_VECTOR.script_asm, 'asm should match')
    t.equal(ctx.script.hex,     TEST_VECTOR.script_hex, 'hex should match')

    t.end()
  })
}
