import { Buff }           from '@cmdcode/buff'
import { get_script_hex } from '@/lib/script/index.js'
import { ScriptData }     from '@/types/index.js'
import { check }          from '@/util/index.js'

export function encode_witness (
  data : ScriptData[]
) : string {
  const buffer : Buff[] = []
  if (Array.isArray(data)) {
    const count = Buff.calc_varint(data.length)
    buffer.push(count)
    for (const entry of data) {
      const bytes = (!check.is_empty(entry))
        ? get_script_hex(entry, true)
        : new Buff(0)
      buffer.push(bytes)
    }
    return Buff.join(buffer).hex
  } else {
    return Buff.bytes(data).hex
  }
}
