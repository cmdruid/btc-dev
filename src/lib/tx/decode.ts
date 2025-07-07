import { Stream }      from '@vbyte/buff'
import { Assert }      from '@vbyte/micro-lib/assert'
import { parse_error } from '@vbyte/micro-lib/util'
import { COINBASE }    from '@/const.js'

import {
  TxInput,
  TxOutput,
  TxCoinbaseInput,
  TxVirtualInput,
  TxDecodedData
} from '@/types/index.js'

export function decode_tx (
  txdata : string | Uint8Array,
  use_segwit = true
) : TxDecodedData {
  // Assert the txdata is a bytes object.
  Assert.is_bytes(txdata, 'txdata must be hex or bytes')
  // Setup a byte-stream.
  const stream = new Stream(txdata)
  // Parse tx version.
  const version = read_version(stream)
  // Check and enable any flags that are set.
  const has_witness = (use_segwit)
    ? check_witness_flag(stream)
    : false
  // Parse our inputs and outputs.
  const vin  = read_inputs(stream)
  const vout = read_outputs(stream)
  // If witness flag is set, parse witness data.
  if (has_witness) {
    for (const txin of vin) {
      txin.witness = read_witness(stream)
    }
  }
  // Parse locktime.
  const locktime = read_locktime(stream)
  // Return transaction object with calculated fields.
  return { version, vin, vout, locktime }
}

function read_version (stream : Stream) : number {
  return stream.read(4).reverse().to_num()
}

function check_witness_flag (stream : Stream) : boolean {
  const [ marker, flag ] : number[] = [ ...stream.peek(2) ]
  if (marker === 0) {
    stream.read(2)
    if (flag === 1) {
      return true
    } else {
      throw new Error(`Invalid witness flag: ${flag}`)
    }
  }
  return false
}

function read_inputs (stream : Stream) : TxInput[] {
  const inputs = []
  const vinCount = stream.varint()
  for (let i = 0; i < vinCount; i++) {
    const txinput = read_vin(stream)
    inputs.push(txinput)
  }
  return inputs
}

function read_vin (stream : Stream) : TxInput {
  const txid       = stream.read(32).reverse().hex
  const vout       = stream.read(4).reverse().num
  const script_sig = read_payload(stream)
  const sequence   = stream.read(4).reverse().num
  const witness : string[] = []
  if (txid === COINBASE.TXID && vout === COINBASE.VOUT) {
    return { coinbase : script_sig, prevout: null, script_sig : null, sequence, txid, vout, witness } as TxCoinbaseInput
  } else {
    return { coinbase : null, prevout: null, script_sig, sequence, txid, vout, witness } as TxVirtualInput
  }
}

function read_outputs (stream : Stream) : TxOutput[] {
  const outputs = []
  const vcount  = stream.varint()
  for (let i = 0; i < vcount; i++) {
    try {
      outputs.push(read_vout(stream))
    } catch (error) {
      throw new Error(`failed to decode output: ${i}: ${parse_error(error)}`)
    }
  }
  return outputs
}

function read_vout (stream : Stream) : TxOutput {
  const value     = stream.read(8).reverse().big
  const script_pk = read_payload(stream)
  Assert.exists(script_pk, 'failed to decode script_pk')
  return { value, script_pk }
}

function read_witness (stream : Stream) : string[] {
  const stack = []
  const count = stream.varint()
  for (let i = 0; i < count; i++) {
    const element = read_payload(stream)
    if (element === null) {
      throw new Error('failed to decode witness element: ' + i)
    }
    stack.push(element)
  }
  return stack
}

export function read_payload (stream : Stream) : string | null {
  const size = stream.varint('le')
  return (size > 0) ? stream.read(size).hex : null
}

function read_locktime (stream : Stream) : number {
  return stream.read(4).reverse().to_num()
}
