import { Buff }          from '@cmdcode/buff'
import { encode_script } from '@/lib/script/index.js'
import { check }         from '@/util/index.js'
import { check_witness } from './util.js'

import {
  ScriptData,
  TxInput,
  TxOutput,
  TxData
} from '@/types/index.js'

export function encode_tx (
  txdata : TxData,
  enable_segwit = true
) : Buff {
  const { version, vin, vout, locktime } = txdata

  const useWitness = (enable_segwit === true && check_witness(vin))

  const raw = [ encode_tx_version(version) ]

  if (useWitness) {
    raw.push(Buff.hex('0001'))
  }

  raw.push(encode_tx_vin(vin))
  raw.push(encode_tx_vout(vout))

  for (const txin of vin) {
    if (useWitness) {
      raw.push(encode_txin_witness(txin.witness))
    }
  }

  raw.push(encode_tx_locktime(locktime))

  return Buff.join(raw)
}

export function encode_tx_version (num : number) : Buff {
  return Buff.num(num, 4).reverse()
}

export function encode_txin_txid (txid : string) : Buff {
  return Buff.hex(txid, 32).reverse()
}

export function encode_txin_vout (vout : number) : Buff {
  return Buff.num(vout, 4).reverse()
}

export function encode_txin_sequence (
  sequence : number | string
) : Buff {
  return (typeof sequence === 'string')
    ? Buff.hex(sequence, 4)
    : Buff.num(sequence, 4).reverse()
}

export function encode_tx_vin (arr : TxInput[]) : Buff {
  const raw : Buff[] = [ Buff.calc_varint(arr.length, 'le') ]
  for (const vin of arr) raw.push(encode_txin(vin))
  return Buff.join(raw)
}

export function encode_txin (txin : TxInput) : Buff {
  const { txid, vout, scriptSig, sequence } = txin
  return Buff.join([
    encode_txin_txid(txid),
    encode_txin_vout(vout),
    encode_script(scriptSig, true),
    encode_txin_sequence(sequence)
  ])
}

export function encode_txout_value (
  value : bigint
) : Buff {
  return Buff.big(value, 8).reverse()
}

export function encode_tx_vout (arr : TxOutput[]) : Buff {
  const raw : Buff[] = [ Buff.calc_varint(arr.length, 'le') ]
  for (const vout of arr) raw.push(encode_txout(vout))
  return Buff.join(raw)
}

export function encode_txout (
  txout : TxOutput
) : Buff {
  const { value, scriptPubKey } = txout
  const raw : Uint8Array[] = []
  raw.push(encode_txout_value(value))
  raw.push(encode_script(scriptPubKey, true))
  return Buff.join(raw)
}

export function encode_txin_witness (
  data : ScriptData[]
) : Buff {
  const buffer : Buff[] = []
  if (Array.isArray(data)) {
    const count = Buff.calc_varint(data.length)
    buffer.push(count)
    for (const entry of data) {
      const bytes = (!check.is_empty(entry))
        ? encode_script(entry, true)
        : new Buff(0)
      buffer.push(bytes)
    }
    return Buff.join(buffer)
  } else {
    return Buff.bytes(data)
  }
}

export function encode_tx_locktime (locktime : number | string) : Buff {
  return (typeof locktime === 'string')
    ? Buff.hex(locktime, 4)
    : Buff.num(locktime, 4).reverse()
}
