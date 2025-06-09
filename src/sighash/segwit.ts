import { Buff }          from '@cmdcode/buff'
import { hash }          from '@cmdcode/crypto-tools'
import { Assert }        from '../util/index.js'
import { parse_txinput } from './util.js'

import {
  prefix_script_size,
  decode_script
} from '../script/index.js'

import {
  encode_txin_vout,
  encode_tx_locktime,
  encode_txin_sequence,
  encode_txin_txid,
  encode_vout_value,
  encode_tx_version,
  parse_tx_data
} from '../tx/index.js'

import {
  SigHashOptions,
  TransactionData,
  TxInput,
  TxOutput
} from '../types/index.js'

import * as CONST from '../const.js'

const { hash160, hash256 } = hash

export function hash_segwit_tx (
  txdata  : TransactionData,
  options : SigHashOptions = {}
) : Buff {
  // Unpack the sigflag from our config object.
  const { sigflag = 0x01, txindex } = options
  // Normalize the tx into JSON format.
  const tx = parse_tx_data(txdata)
  // Check if the ANYONECANPAY flag is set.
  const is_anypay = (sigflag & 0x80) === 0x80
  // Save a normalized version of the sigflag.
  const flag = sigflag % 0x80
  // Check if the sigflag exists as a valid type.
  if (!CONST.SIGHASH_SEGWIT.includes(flag)) {
    throw new Error('Invalid hash type: ' + String(sigflag))
  }
  // Unpack the tx object.
  const { version, vin, vout, locktime } = tx
  // Parse the input we are signing from the config.
  const txinput = parse_txinput(tx, options)
  // Unpack the chosen input for signing.
  const { txid, vout: prevIdx, prevout, sequence } = txinput
  // Unpack the prevout for the chosen input.
  const { value } = prevout ?? {}
  // Check if a prevout value is provided.
  if (value === undefined) {
    throw new Error('Prevout value is empty!')
  }
  // Initialize our script variable from the config.
  let { pubkey, script } = options
  // Check if a pubkey is provided (instead of a script).
  if (script === undefined && pubkey !== undefined) {
    const pkhash = hash160(pubkey).hex
    script = `76a914${String(pkhash)}88ac`
  }
  // Make sure that some form of script has been provided.
  if (script === undefined) {
    throw new Error('No pubkey / script has been set!')
  }
  // Throw if OP_CODESEPARATOR is used in a script.
  if (decode_script(script).includes('OP_CODESEPARATOR')) {
    throw new Error('This library does not currently support the use of OP_CODESEPARATOR in segwit scripts.')
  }

  const sighash = [
    encode_tx_version(version),
    hash_prevouts(vin, is_anypay),
    hash_sequence(vin, flag, is_anypay),
    encode_txin_txid(txid),
    encode_txin_vout(prevIdx),
    prefix_script_size(script),
    encode_vout_value(value),
    encode_txin_sequence(sequence),
    hash_outputs(vout, flag, txindex),
    encode_tx_locktime(locktime),
    Buff.num(sigflag, 4).reverse()
  ]

  return hash256(Buff.join(sighash))
}

function hash_prevouts (
  vin : TxInput[],
  isAnypay ?: boolean
) : Uint8Array {
  if (isAnypay === true) {
    return Buff.num(0, 32)
  }

  const stack = []

  for (const { txid, vout } of vin) {
    stack.push(encode_txin_txid(txid))
    stack.push(encode_txin_vout(vout))
  }

  return hash256(Buff.join(stack))
}

function hash_sequence (
  vin      : TxInput[],
  sigflag  : number,
  isAnyPay : boolean
) : Uint8Array {
  if (isAnyPay || sigflag !== 0x01) {
    return Buff.num(0, 32)
  }

  const stack = []

  for (const { sequence } of vin) {
    stack.push(encode_txin_sequence(sequence))
  }
  return hash256(Buff.join(stack))
}

function hash_outputs (
  vout    : TxOutput[],
  sigflag : number,
  idx    ?: number
) : Uint8Array {
  const stack = []

  if (sigflag === 0x01) {
    for (const { value, script_pk } of vout) {
      stack.push(encode_vout_value(value))
      stack.push(prefix_script_size(script_pk))
    }
    return hash256(Buff.join(stack))
  }

  if (sigflag === 0x03) {
    Assert.ok(idx !== undefined)
    if (idx < vout.length) {
      const { value, script_pk } = vout[idx]
      stack.push(encode_vout_value(value))
      stack.push(prefix_script_size(script_pk))
      return hash256(Buff.join(stack))
    }
  }

  return Buff.num(0, 32)
}
