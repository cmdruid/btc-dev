import { Bytes, Stream } from '@vbyte/buff'
import { Assert }              from '@vbyte/micro-lib'
import { parse_error }         from '@vbyte/micro-lib/util'
import { COINBASE }            from '@/const.js'

import {
  TxData,
  TxInput,
  TxOutput,
  CoinbaseInput,
  VirtualInput,
  SpendInput
} from '@/types/index.js'

interface TxEncoderConfig {
  prevouts : TxOutput[]
  segwit   : boolean
}

const DEFAULT_CONFIG : TxEncoderConfig = {
  prevouts : [],
  segwit   : true
}

export function decode_tx_data (
  txbytes : Bytes,
  options : Partial<TxEncoderConfig> = {}
) : TxData {
  // Merge the options with the default config.
  const config = { ...DEFAULT_CONFIG, ...options }
  // Assert the txhex is a bytes object.
  Assert.is_bytes(txbytes, 'txbytes must be hex or a unit array')
  // Setup a byte-stream.
  const stream = new Stream(txbytes)
  // Parse tx version.
  const version = read_version(stream)
  // Check and enable any flags that are set.
  const has_witness = (config.segwit)
    ? check_witness_flag(stream)
    : false
  // Parse our inputs and outputs.
  const vin  = read_inputs(stream, config.prevouts)
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

function read_inputs (stream : Stream, prevouts : TxOutput[]) : TxInput[] {
  const inputs = []
  const vinCount = stream.varint()
  for (let i = 0; i < vinCount; i++) {
    const txinput = read_vin(stream, prevouts.at(i))
    inputs.push(txinput)
  }
  return inputs
}

function read_vin (stream : Stream, prevout : TxOutput | null = null) : TxInput {
  const txid       = stream.read(32).reverse().hex
  const vout       = stream.read(4).reverse().num
  const script_sig = read_script(stream, true)
  const sequence   = stream.read(4).reverse().num
  const witness : string[] = []
  if (txid === COINBASE.TXID && vout === COINBASE.VOUT) {
    return { coinbase : script_sig, prevout: null, script_sig : null, sequence, txid, vout, witness } as CoinbaseInput
  } else if (prevout !== null) {
    return { coinbase : null, prevout, script_sig, sequence, txid, vout, witness } as SpendInput
  } else {
    return { coinbase : null, prevout, script_sig, sequence, txid, vout, witness } as VirtualInput
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
  const script_pk = read_script(stream, true)
  Assert.exists(script_pk, 'failed to decode script_pk')
  return { value, script_pk }
}

function read_witness (stream : Stream) : string[] {
  const stack = []
  const count = stream.varint()
  for (let i = 0; i < count; i++) {
    const element = read_script(stream, true)
    if (element === null) {
      throw new Error('failed to decode witness element: ' + i)
    }
    stack.push(element)
  }
  return stack
}

export function read_script (
  stream  : Stream,
  varint ?: boolean
) : string | null {
  const size = (varint === true)
    ? stream.varint('le')
    : stream.size
  return size > 0
    ? stream.read(size).hex
    : null
}

function read_locktime (stream : Stream) : number {
  return stream.read(4).reverse().to_num()
}
