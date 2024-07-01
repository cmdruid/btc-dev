import { Buff, Bytes }     from '@cmdcode/buff'
import { encode_script }   from '@/lib/script/lib/encode.js'
import { assert, Bech32m } from '@/util/index.js'
import { lookup }          from './util.js'

import CONST from '../const.js'

import {
  AddressData,
  Network,
  ScriptData,
  ScriptWord
} from '@/types/index.js'

const VALID_PREFIXES = [ 'bc1p', 'tb1p', 'bcrt1p' ]

export function check_address (
  address : string
) : boolean {
  for (const prefix of VALID_PREFIXES) {
    if (address.startsWith(prefix)) {
      return true
    }
  }
  return false
}

export function encode_keydata (
  keydata : Bytes,
  network : Network = 'main'
) : string {
  const prefix = CONST.BECH32_PREFIXES[network]
  const bytes = Buff.bytes(keydata)
  assert.size(bytes, 32)
  return Bech32m.encode(prefix, bytes)
}

export function decode_address (
  address : string
) : AddressData {
  const meta = lookup(address)
  assert.ok(meta !== null)
  const { type, network } = meta
  if (!check_address(address)) {
    throw new TypeError('Invalid segwit address!')
  }
  const { data, version } = Bech32m.decode(address)
  const asm = create_script(data)
  const hex = encode_script(asm, false).hex
  const keydata = data.hex
  assert.ok(version === 1)
  return { asm, hex, keydata, network, type }
}

function create_address (
  input    : ScriptData,
  network ?: Network
) : string {
  const bytes = Buff.bytes(input)
  assert.ok(bytes.length === 32)
  return encode_keydata(bytes, network)
}

export function create_script (
  keydata : Bytes
) : ScriptWord[] {
  const bytes = Buff.bytes(keydata)
  assert.size(bytes, 32)
  return [ 'OP_1', bytes.hex ]
}

export default {
  create : create_address,
  encode : encode_keydata,
  decode : decode_address
}
