import { Buff }           from '@cmdcode/buff'
import { LEAF_VERSIONS }  from '@/lib/tx/const.js'
import { assert, check }  from '@/util/index.js'
import { get_script_hex } from '@/lib/script/index.js'

import {
  ScriptData,
  WitnessData
} from '@/types/index.js'

function parse_annex (
  data : ScriptData[]
) : string | null {
  let item = data.at(-1)

  if (check.is_hex(item)) {
    item = Buff.hex(item)
  }

  if (
    data.length > 1            &&
    item instanceof Uint8Array &&
    item[0] === 0x50
  ) {
    data.pop()
    return Buff.raw(item).hex
  }

  return null
}

function parse_cblock (
  data : ScriptData[]
) : string | null {
  let item = data.at(-1)

  if (check.is_hex(item)) {
    item = Buff.hex(item)
  }

  if (
    data.length > 1            &&
    item instanceof Uint8Array &&
    item.length > 32           &&
    LEAF_VERSIONS.includes(item[0] & 0xfe)
  ) {
    data.pop()
    return Buff.raw(item).hex
  }

  return null
}

function parse_script (
  data : ScriptData[]
) : string | null {
  if (data.length > 1) {
    try {
      const item = data.at(-1)
      assert.ok(item !== undefined)
      data.pop()
      return get_script_hex(item).hex
    } catch (err) {
      return null
    }
  }
  return null
}

function parse_params (
  data : ScriptData[]
) : string[] {
  const params : Buff[] = []
  for (const d of data) {
    if (
      check.is_hex(d)         ||
      d instanceof Uint8Array ||
      typeof d === 'number'
    ) {
      params.push(Buff.bytes(d))
    } else {
      throw new Error('unrecognized param:' + String(d))
    }
  }
  return params.map(e => Buff.bytes(e).hex)
}

export function parse_witness (
  data : ScriptData[]
) : WitnessData {
  const items  = [ ...data ]
  const annex  = parse_annex(items)
  const cblock = parse_cblock(items)
  const script = parse_script(items)
  const params = parse_params(items)
  return { annex, cblock, params, script }
}
