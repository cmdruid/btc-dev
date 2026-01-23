import { Stream }   from '@vbyte/buff'
import { Assert }   from '@vbyte/micro-lib/assert'
import { COINBASE } from '@/const.js'

import {
  TxInput,
  TxOutput,
  TxCoinbaseInput,
  TxVirtualInput,
  TxDecodedData
} from '@/types/index.js'

/** Maximum transaction size in bytes (4MB, Bitcoin consensus limit) */
const MAX_TX_SIZE = 4_000_000

/** Maximum varint size to prevent memory exhaustion attacks */
const MAX_VARINT_SIZE = 10_000_000

/** Maximum number of inputs/outputs per transaction */
const MAX_TX_ELEMENTS = 100_000

export function decode_tx (
  txdata : string | Uint8Array,
  use_segwit = true
) : TxDecodedData {
  // Assert the txdata is a bytes object.
  Assert.is_bytes(txdata, 'txdata must be hex or bytes')

  // Check transaction size limit
  const txSize = typeof txdata === 'string' ? txdata.length / 2 : txdata.length
  if (txSize > MAX_TX_SIZE) {
    throw new Error(`Transaction size ${txSize} exceeds maximum ${MAX_TX_SIZE} bytes`)
  }

  // Setup a byte-stream.
  const stream = new Stream(txdata)
  // Parse tx version.
  const version = read_version(stream)
  // Check and enable any flags that are set.
  let has_witness = check_witness_flag(stream)
  // If use_segwit is false, set has_witness to false.
  has_witness = (use_segwit) ? has_witness : false
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
  if (vinCount > MAX_TX_ELEMENTS) {
    throw new Error(`Input count ${vinCount} exceeds maximum ${MAX_TX_ELEMENTS}`)
  }
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
  const vcount  = stream.read_varint()
  if (vcount > MAX_TX_ELEMENTS) {
    throw new Error(`Output count ${vcount} exceeds maximum ${MAX_TX_ELEMENTS}`)
  }
  for (let i = 0; i < vcount; i++) {
    try {
      outputs.push(read_vout(stream))
    } catch (error) {
      throw new Error(`failed to decode output at index ${i}`)
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
  const count = stream.read_varint()
  if (count > MAX_TX_ELEMENTS) {
    throw new Error(`Witness element count ${count} exceeds maximum ${MAX_TX_ELEMENTS}`)
  }
  for (let i = 0; i < count; i++) {
    const element = read_payload(stream)
    if (element === null) {
      throw new Error(`failed to decode witness element at index ${i}`)
    }
    stack.push(element)
  }
  return stack
}

export function read_payload (stream : Stream) : string | null {
  const size = stream.read_varint('le')
  if (size > MAX_VARINT_SIZE) {
    throw new Error(`Payload size ${size} exceeds maximum ${MAX_VARINT_SIZE}`)
  }
  return (size > 0) ? stream.read(size).hex : null
}

function read_locktime (stream : Stream) : number {
  return stream.read(4).reverse().to_num()
}
