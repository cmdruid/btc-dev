import { Buff }          from '@cmdcode/buff'
import { Assert }        from '../util/index.js'
import { parse_tx_data } from './parse.js'

import {
  TxInput,
  TxOutput,
  TransactionData
} from '../types/index.js'

import * as CONST from '../const.js'

const { COINBASE } = CONST

export function encode_tx_data (
  txdata : TransactionData,
  segwit = true
) : Buff {
  const tx = parse_tx_data(txdata)
  // Unpack the transaction data.
  const { version, vin, vout, locktime } = tx
  // Create a buffer for the transaction.
  const buffer : Buff[] = [ encode_tx_version(version) ]
  // If the transaction is a segwit transaction,
  if (segwit) {
    // Add the segwit marker to the buffer.
    buffer.push(Buff.hex('0001'))
  }
  // Add the inputs to the buffer.
  buffer.push(encode_tx_inputs(vin))
  // Add the outputs to the buffer.
  buffer.push(encode_tx_outputs(vout))
  // If the transaction is a segwit transaction,
  if (segwit) {
    // For each input in the transaction,
    for (const input of vin) {
      // Add the witness data to the buffer.
      buffer.push(encode_vin_witness(input.witness))
    }
  }
  // Add the locktime to the buffer.
  buffer.push(encode_tx_locktime(locktime))
  // Return the buffer as a single payload. 
  return Buff.join(buffer)
}

export function encode_tx_version (num : number) : Buff {
  // Encode the transaction version as a 4-byte little-endian number.
  return Buff.num(num, 4).reverse()
}

export function encode_txin_txid (txid : string) : Buff {
  // Encode the transaction ID as a 32-byte little-endian number.
  return Buff.hex(txid, 32).reverse()
}

export function encode_txin_vout (vout : number) : Buff {
  // Encode the output index as a 4-byte little-endian number.
  return Buff.num(vout, 4).reverse()
}

export function encode_txin_sequence (sequence : number) : Buff {
  // Encode the sequence number as a 4-byte little-endian number.
  return Buff.num(sequence, 4).reverse()
}

export function encode_tx_inputs (vin : TxInput[]) : Buff {
  // Create a buffer for the inputs, starting with the array length.
  const raw : Buff[] = [ Buff.calc_varint(vin.length, 'le') ]
  // For each input in the array,
  for (const input of vin) {
    // Encode the input, and add it to the buffer.
    raw.push(encode_vin(input))
  }
  // Return the buffer as a single payload.
  return Buff.join(raw)
}

export function encode_vin (txin : TxInput) : Buff {
  // If the input is a coinbase,
  if (txin.coinbase !== null) {
    // Encode and return the coinbase as a single payload.
    return Buff.join([
      encode_txin_txid(COINBASE.TXID),
      encode_txin_vout(COINBASE.VOUT),
      encode_script_data(txin.coinbase),
      encode_txin_sequence(txin.sequence)
    ])
  } else {
    // Encode and return the input as a single payload.
    return Buff.join([
      encode_txin_txid(txin.txid),
      encode_txin_vout(txin.vout),
      encode_script_data(txin.script_sig),
      encode_txin_sequence(txin.sequence)
    ])
    }
}

export function encode_vout_value (value : bigint) : Buff {
  // Encode the value as an 8-byte little-endian number.
  return Buff.big(value, 8).reverse()
}

export function encode_tx_outputs (vout : TxOutput[]) : Buff {
  // Create a buffer for the outputs, starting with the array length.
  const buffer : Buff[] = [ Buff.calc_varint(vout.length, 'le') ]
  // For each output in the array,
  for (const output of vout) {
    // Encode the output, and add it to the buffer.
    buffer.push(encode_tx_vout(output))
  }
  // Return the buffer as a single payload.
  return Buff.join(buffer)
}

export function encode_tx_vout (txout : TxOutput) : Buff {
  // Get the value and script pubkey from the output.
  const { value, script_pk } = txout
  // Return the data encoded as a single payload.
  return Buff.join([
    encode_vout_value(value),
    encode_script_data(script_pk)
  ])
}

export function encode_vin_witness (data : string[]) : Buff {
  // Create a buffer for the witness data, starting with the array length.
  const buffer : Buff[] = [ Buff.calc_varint(data.length) ]
  // For each parameter in the witness array,
  for (const param of data) {
    // Encode the parameter, and add it to the buffer.
    buffer.push(encode_script_data(param))
  }
  // Return the buffer as a single payload.
  return Buff.join(buffer)
}

export function encode_tx_locktime (locktime : number) : Buff {
  // Encode the locktime as a 4-byte little-endian number.
  return Buff.num(locktime, 4).reverse()
}

export function encode_script_data (
  script : string | null
) : Buff {
  // If the script is not null,
  if (script !== null) {
    // Assert that the script is a hex string.
    Assert.is_hex(script)
    // Encode the script, and add it to the buffer.
    return Buff.hex(script).add_varint('le')
  } else {
    // Return a single byte of zero.
    return Buff.hex('00')
  }
}
