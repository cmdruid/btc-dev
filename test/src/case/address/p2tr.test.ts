import { Test } from 'tape'
import { P2TR } from '@/pkg/address'

const TEST_VECTOR = {
  network    : 'regtest',
  format     : 'bech32m',
  pubkey     : '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605',
  address    : 'bcrt1pjxmy65eywgafs5tsunw95ruycpqcqnev6ynxp7jaasylcgtcxczsqzdc9v',
  hex        : '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605',
  script_asm : [ 'OP_1', '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605' ],
  script_hex : '512091b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605',
  size       : 32,
  type       : 'p2tr',
  version    : 1,
}

export default function (t : Test) : void {

  t.test('P2TR unit test', t => {
    const addr1 = P2TR.encode(TEST_VECTOR.pubkey, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Pubkey should encode into proper address')

    const data = P2TR.decode(TEST_VECTOR.address)

    t.equal(data.format,  TEST_VECTOR.format, 'format should match')
    t.equal(data.network, TEST_VECTOR.network, 'network should match')
    t.equal(data.version, TEST_VECTOR.version, 'version should match')
    t.equal(data.type,       'p2tr', 'type should match')
    t.equal(data.size,       32, 'size should match')
    t.equal(data.hex,        TEST_VECTOR.hex, 'key should match')
    t.deepEqual(data.script_asm, TEST_VECTOR.script_asm, 'script_asm should match')
    t.equal(data.script_hex, TEST_VECTOR.script_hex, 'script_hex should match')

    t.end()
  })
}