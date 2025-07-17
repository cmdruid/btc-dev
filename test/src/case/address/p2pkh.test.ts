
import { Test }  from 'tape'
import { P2PKH } from '@/pkg/address'
import { CONST } from '@/pkg'

const SCRIPT_TYPE = CONST.LOCK_SCRIPT_TYPE

const TEST_VECTOR = {
  network    : 'testnet',
  format     : 'base58',
  pubkey     : '037191e9be308354c79d9e0d596e74fce4a98768459a846a073799ad20b4c78770',
  address    : 'msi862KMaLR3jHcdKtAh9QMN2sS8Qcyywy',
  data       : '85be4269276fd45d0b6f7ee963dd073b202d49ed',
  script_asm : [ 'OP_DUP', 'OP_HASH160', '85be4269276fd45d0b6f7ee963dd073b202d49ed', 'OP_EQUALVERIFY', 'OP_CHECKSIG' ],
  script_hex : '76a91485be4269276fd45d0b6f7ee963dd073b202d49ed88ac',
  size       : 20,
  type       : SCRIPT_TYPE.P2PKH,
  version    : 0x6F,
}

export default function (t : Test) : void {

  t.test('P2PKH unit test', t => {
    const addr1 = P2PKH.create_address(TEST_VECTOR.pubkey, TEST_VECTOR.network)
    t.equal(addr1, TEST_VECTOR.address, 'pubkey should encode into proper address.')

    const addr2 = P2PKH.encode_address(TEST_VECTOR.script_hex, TEST_VECTOR.network)
    t.equal(addr2, TEST_VECTOR.address, 'Hash should encode into proper address')

    const ctx = P2PKH.decode_address(TEST_VECTOR.address)

    t.equal(ctx.format,         TEST_VECTOR.format,     'format should match')
    t.equal(ctx.network,        TEST_VECTOR.network,    'network should match')
    t.equal(ctx.version,        TEST_VECTOR.version,    'version should match')
    t.equal(ctx.type,           SCRIPT_TYPE.P2PKH,      'type should match')
    t.equal(ctx.size,           20,                     'size should match')
    t.equal(ctx.data,           TEST_VECTOR.data,       'script data should match')
    t.deepEqual(ctx.script.asm, TEST_VECTOR.script_asm, 'script asm should match')
    t.equal(ctx.script.hex,     TEST_VECTOR.script_hex, 'scripthex should match')

    t.end()
  })
}
