import { Test }         from 'tape'
import { P2WSH }        from '@/pkg/address'
import { encode_script } from '@/pkg/script'
import { CONST }        from '@/pkg'

const SCRIPT_TYPE = CONST.LOCK_SCRIPT_TYPE

const TEST_VECTOR = {
  network    : 'regtest',
  format     : 'bech32',
  script     : encode_script([ 1, 2, 'OP_ADD', 3, 'OP_EQUAL' ]),
  address    : 'bcrt1qetz4my584ckcqd0acdm7h788lkmslz44q5wc0rd3eknmmzc85sjq9sle8n',
  data       : 'cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424',
  script_asm : [ 'OP_0', 'cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424' ],
  script_hex : '0020cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424',
  size       : 32,
  type       : SCRIPT_TYPE.P2WSH,
  version    : 0,
  prefix     : 'bcrt',
}

export default function p2wsh_test (t : Test) : void {

  t.test('P2WSH unit test', t => {
    const addr1 = P2WSH.create_address(TEST_VECTOR.script, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Script should encode into proper address.')

    const addr2 = P2WSH.encode_address(TEST_VECTOR.script_hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const ctx = P2WSH.decode_address(TEST_VECTOR.address)

    t.equal(ctx.format,  TEST_VECTOR.format, 'format should match')
    t.equal(ctx.network, TEST_VECTOR.network, 'network should match')
    t.equal(ctx.version, TEST_VECTOR.version, 'version should match')
    t.equal(ctx.type,    SCRIPT_TYPE.P2WSH, 'type should match')
    t.equal(ctx.size,    32, 'size should match')
    t.equal(ctx.data,     TEST_VECTOR.data, 'data should match')
    t.equal(ctx.prefix,  TEST_VECTOR.prefix, 'prefix should match')
    t.deepEqual(ctx.script.asm, TEST_VECTOR.script_asm, 'asm should match')
    t.equal(ctx.script.hex,     TEST_VECTOR.script_hex, 'hex should match')

    t.end()
  })
}