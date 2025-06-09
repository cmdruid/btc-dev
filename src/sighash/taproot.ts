import { Buff }               from '@cmdcode/buff'
import { Assert }             from '../util/index.js'
import { prefix_script_size } from '../script/util.js'
import { encode_tapscript }   from '../taproot/index.js'
import { TxUtil }             from '../tx/index.js'
import { parse_txinput }      from './util.js'

import {
  encode_txin_vout,
  encode_tx_locktime,
  encode_txin_sequence,
  encode_txin_txid,
  encode_vout_value,
  encode_tx_version
} from '../tx/encode.js'

import {
  SigHashOptions,
  TxData,
  TxInput,
  TxOutput
} from '../types/index.js'

import * as CONST from '../const.js'

export function hash_taproot_tx (
  template : TxData | string,
  config   : SigHashOptions = {}
) : Buff {
  // Unpack configuration.
  const {
    script,
    txindex,
    sigflag       = 0x00,
    extflag       = 0x00,
    key_version   = 0x00,
    separator_pos = 0xFFFFFFFF
  } = config
  // Normalize the txdata object.
  const tx = TxUtil.parse_tx(template)
  // Unpack the txdata object.
  const { version, vin: input, vout: output, locktime } = tx
  // Parse the input we are signing from the config.
  const txinput = parse_txinput(tx, config)
  // Unpack the txinput object.
  const { txid, vout, sequence, witness = [] } = txinput
  // Check if we are using a valid hash type.
  if (!CONST.SIGHASH_TAPROOT.includes(sigflag)) {
    // If the sigflag is an invalid type, throw error.
    throw new Error('Invalid hash type: ' + String(sigflag))
  }
  if (extflag < 0 || extflag > 127) {
    // If the extflag is out of range, throw error.
    throw new Error('Extention flag out of range: ' + String(extflag))
  }

  let { extension } = config

  if (script !== undefined) {
    extension = encode_tapscript(script).hex
  }

  // Define the parameters of the transaction.
  const is_anypay = (sigflag & 0x80) === 0x80
  const annex     = get_annex_data(witness)
  const annexBit  = (annex !== undefined) ? 1 : 0
  const extendBit = (extension !== undefined) ? 1 : 0
  const spendType = ((extflag + extendBit) * 2) + annexBit
  const hashtag   = Buff.str('TapSighash').digest

  // Begin building our preimage.
  const preimage : (string | Uint8Array)[] = [
    hashtag,                      // Buffer input with
    hashtag,                      // 2x hashed strings.
    Buff.num(0x00, 1),            // Add zero-byte.
    Buff.num(sigflag, 1),         // Commit to signature flag.
    encode_tx_version(version),   // Commit to tx version.
    encode_tx_locktime(locktime)  // Commit to tx locktime.
  ]

  if (!is_anypay) {
    // If flag ANYONE_CAN_PAY is not set,
    // then commit to all inputs.
    const prevouts = input.map(e => get_prevout(e))
    preimage.push(
      hash_outpoints(input),   // Commit to txid/vout for each input.
      hash_amounts(prevouts),  // Commit to prevout amount for each input.
      hash_scripts(prevouts),  // Commit to prevout script for each input.
      hash_sequence(input)     // Commit to sequence value for each input.
    )
  }

  if ((sigflag & 0x03) < 2 || (sigflag & 0x03) > 3) {
    // If neither SINGLE or NONE flags are set,
    // include a commitment to all outputs.
    preimage.push(hash_outputs(output))
  }

  // At this step, we include the spend type.
  preimage.push(Buff.num(spendType, 1))

  if (is_anypay) {
    // If ANYONE_CAN_PAY flag is set, then we will
    // provide a commitment to the input being signed.
    const { value, script_pk } = get_prevout(txinput)
    preimage.push(
      encode_txin_txid(txid),                // Commit to the input txid.
      encode_txin_vout(vout),                // Commit to the input vout index.
      encode_vout_value(value),              // Commit to the input's prevout value.
      prefix_script_size(script_pk),         // Commit to the input's prevout script.
      encode_txin_sequence(sequence)         // Commit to the input's sequence value.
    )
  } else {
    // Otherwise, we must have already included a commitment
    // to all inputs in the tx, so simply add a commitment to
    // the index of the input we are signing for.
    Assert.ok(typeof txindex === 'number')
    preimage.push(Buff.num(txindex, 4).reverse())
  }

  if (annex !== undefined) {
    // If an annex has been set, include it here.
    preimage.push(annex)
  }

  if ((sigflag & 0x03) === 0x03) {
    // If the SINGLE flag is set, then include a
    // commitment to the output which is adjacent
    // to the input that we are signing for.
    Assert.ok(typeof txindex === 'number')
    preimage.push(hash_output(output[txindex]))
  }

  if (extension !== undefined) {
    // If we are extending this signature to include
    // other commitments (such as a tapleaf), then we
    // will add it to the preimage here.
    preimage.push(
      Buff.bytes(extension),      // Extention data (in bytes).
      Buff.num(key_version),      // Key version (reserved for future upgrades).
      Buff.num(separator_pos, 4)  // If OP_CODESEPARATOR is used, this must be set.
    )
  }

  // Useful for debugging the preimage stack.
  // console.log(preimage.map(e => Buff.raw(e).hex))

  return Buff.join(preimage).digest
}

export function hash_outpoints (
  vin : TxInput[]
) : Buff {
  const stack = []
  for (const { txid, vout } of vin) {
    stack.push(encode_txin_txid(txid))
    stack.push(encode_txin_vout(vout))
  }
  return Buff.join(stack).digest
}

export function hash_sequence (
  vin : TxInput[]
) : Buff {
  const stack = []
  for (const { sequence } of vin) {
    stack.push(encode_txin_sequence(sequence))
  }
  return Buff.join(stack).digest
}

export function hash_amounts (
  prevouts : TxOutput[]
) : Buff {
  const stack = []
  for (const { value } of prevouts) {
    stack.push(encode_vout_value(value))
  }
  return Buff.join(stack).digest
}

export function hash_scripts (
  prevouts : TxOutput[]
) : Buff {
  const stack = []
  for (const { script_pk } of prevouts) {
    stack.push(prefix_script_size(script_pk))
  }
  return Buff.join(stack).digest
}

export function hash_outputs (
  vout : TxOutput[]
) : Buff {
  const stack = []
  for (const { value, script_pk } of vout) {
    stack.push(encode_vout_value(value))
    stack.push(prefix_script_size(script_pk))
  }
  return Buff.join(stack).digest
}

export function hash_output (
  vout : TxOutput
) : Buff {
  return Buff.join([
    encode_vout_value(vout.value),
    prefix_script_size(vout.script_pk)
  ]).digest
}

function get_annex_data (
  witness ?: string[]
) : Buff | undefined {
  // If no witness exists, return undefined.
  if (witness === undefined) return
  // If there are less than two elements, return undefined.
  if (witness.length < 2) return
  // Define the last element as the annex.
  const annex = witness.at(-1)
  // If the annex is a string and starts with '50',
  if (typeof annex === 'string' && annex.startsWith('50')) {
    // return a digest of the annex.
    return Buff.hex(annex).add_varint('be').digest
  }
  // Else, return undefined.
  return undefined
}

function get_prevout (vin : TxInput) : TxOutput {
  if (vin.prevout === null) {
    throw new Error('Prevout data missing for input: ' + String(vin.txid))
  }
  return vin.prevout
}
