import { Test }       from 'tape'
import { P2WSH }      from '@/pkg/address'
import { ScriptUtil } from '@/pkg/script'

const TEST_VECTOR = {
  network    : 'regtest',
  format     : 'bech32',
  script     : ScriptUtil.encode([ 1, 2, 'OP_ADD', 3, 'OP_EQUAL' ]),
  address    : 'bcrt1qetz4my584ckcqd0acdm7h788lkmslz44q5wc0rd3eknmmzc85sjq9sle8n',
  hex        : 'cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424',
  script_asm : [ 'OP_0', 'cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424' ],
  script_hex : '0020cac55d9287ae2d8035fdc377ebf8e7fdb70f8ab5051d878db1cda7bd8b07a424',
  size       : 32,
  type       : 'p2w-sh',
  version    : 0,
  prefix     : 'bcrt',
}

export default function p2wsh_test (t : Test) : void {

  t.test('P2WSH unit test', t => {
    const addr1 = P2WSH.create(TEST_VECTOR.script, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Script should encode into proper address.')

    const addr2 = P2WSH.encode(TEST_VECTOR.hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const data = P2WSH.decode(TEST_VECTOR.address)

    t.equal(data.format,  TEST_VECTOR.format, 'format should match')
    t.equal(data.network, TEST_VECTOR.network, 'network should match')
    t.equal(data.version, TEST_VECTOR.version, 'version should match')
    t.equal(data.type,       'p2w-sh', 'type should match')
    t.equal(data.size,       32, 'size should match')
    t.equal(data.hex,        TEST_VECTOR.hex, 'key should match')
    t.equal(data.prefix,     TEST_VECTOR.prefix, 'prefix should match')
    t.deepEqual(data.script_asm, TEST_VECTOR.script_asm, 'script_asm should match')
    t.equal(data.script_hex, TEST_VECTOR.script_hex, 'script_hex should match')

    t.end()
  })
}