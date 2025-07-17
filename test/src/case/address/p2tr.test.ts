import { Test } from 'tape'
import { P2TR } from '@/pkg/address'
import { CONST } from '@/pkg'

const SCRIPT_TYPE = CONST.LOCK_SCRIPT_TYPE

const TEST_VECTOR = {
  network    : 'regtest',
  format     : 'bech32m',
  pubkey     : '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605',
  address    : 'bcrt1pjxmy65eywgafs5tsunw95ruycpqcqnev6ynxp7jaasylcgtcxczsqzdc9v',
  script_asm : [ 'OP_1', '91b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605' ],
  script_hex : '512091b64d5324723a985170e4dc5a0f84c041804f2cd12660fa5dec09fc21783605',
  size       : 32,
  type       : SCRIPT_TYPE.P2TR,
  version    : 1,
}

export default function (t : Test) : void {

  t.test('P2TR unit test', t => {
    const addr1 = P2TR.create_address(TEST_VECTOR.pubkey, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'Pubkey should encode into proper address')

    const ctx = P2TR.decode_address(TEST_VECTOR.address)

    t.equal(ctx.format,  TEST_VECTOR.format, 'format should match')
    t.equal(ctx.network, TEST_VECTOR.network, 'network should match')
    t.equal(ctx.version, TEST_VECTOR.version, 'version should match')
    t.equal(ctx.type,    SCRIPT_TYPE.P2TR, 'type should match')
    t.equal(ctx.size,    32, 'size should match')
    t.equal(ctx.data,    TEST_VECTOR.pubkey, 'data should match')
    t.deepEqual(ctx.script.asm, TEST_VECTOR.script_asm, 'asm should match')
    t.equal(ctx.script.hex,     TEST_VECTOR.script_hex, 'hex should match')

    t.end()
  })
}