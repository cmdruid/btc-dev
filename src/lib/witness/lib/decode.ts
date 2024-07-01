import { Buff, Bytes } from '@cmdcode/buff'
import { read_data }   from '@/lib/tx/index.js'

export function decode_witness (bytes : Bytes) : string[] {
  const stream = Buff.bytes(bytes).stream
  const stack  = []
  const count  = stream.read_varint()
  for (let i = 0; i < count; i++) {
    const word = read_data(stream, true)
    stack.push(word ?? '')
  }
  return stack
}
