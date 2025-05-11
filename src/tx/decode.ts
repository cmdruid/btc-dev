import { Buff, Bytes, Stream } from '@cmdcode/buff'

import {
  TxData,
  TxInput,
  TxOutput
} from '../types/index.js'
import { COINBASE } from '../const.js'

export function decode_tx_data (
  txhex : Bytes,
  segwit = true
) : TxData {
  // Setup a byte-stream.
  const stream = new Stream(txhex)
  // Parse tx version.
  const version = read_version(stream)
  // Check and enable any flags that are set.
  const has_witness = (segwit)
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
  const vinCount = stream.read_varint()
  for (let i = 0; i < vinCount; i++) {
    inputs.push(read_vin(stream))
  }
  return inputs
}

function read_vin (stream : Stream) : TxInput {
  const txid       = stream.read(32).reverse().hex
  const vout       = stream.read(4).reverse().num
  const prevout    = null
  const script_sig = read_script(stream, true)
  const sequence   = stream.read(4).reverse().num
  const witness : string[] = []
  return (txid === COINBASE.TXID && vout === COINBASE.VOUT)
    ? { coinbase : script_sig, prevout, script_sig : null, sequence, txid, vout, witness }
    : { coinbase : null,       prevout, script_sig,        sequence, txid, vout, witness }
}

function read_outputs (stream : Stream) : TxOutput[] {
  const outputs = []
  const vcount  = stream.read_varint()
  for (let i = 0; i < vcount; i++) {
    outputs.push(read_vout(stream))
  }
  return outputs
}

function read_vout (stream : Stream) : TxOutput {
  return {
    value     : stream.read(8).reverse().big,
    script_pk : read_script(stream, true)
  }
}

function read_witness (stream : Stream) : string[] {
  const stack = []
  const count = stream.read_varint()
  for (let i = 0; i < count; i++) {
    const word = read_data(stream, true)
    stack.push(word ?? '')
  }
  return stack
}

export function read_data (
  stream  : Stream,
  varint ?: boolean
) : string | null {
  const size = (varint === true)
    ? stream.read_varint('le')
    : stream.size
  return size > 0
    ? stream.read(size).hex
    : null
}

function read_script (
  stream  : Stream,
  varint ?: boolean
) : string {
  const data = read_data(stream, varint)
  if (data === null) {
    const script_hex = new Buff(stream.data).hex
    throw new Error('unable to decode script: ' + script_hex)
  }
  return data
}

function read_locktime (stream : Stream) : number {
  return stream.read(4).reverse().to_num()
}
