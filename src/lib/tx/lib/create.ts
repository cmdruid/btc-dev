import { Buff } from '@cmdcode/buff'

import {
  TxInput,
  TxInTemplate,
  TxPrevout,
  TxData,
  TxTemplate,
  TxOutTemplate,
  TxOutput
} from '@/types/index.js'

import schema from '@/schema/index.js'

const DEFAULT_TX = {
  version  : 2,
  vin      : [],
  vout     : [],
  locktime : 0
}

const DEFAULT_VIN = {
  scriptSig : [],
  sequence  : 4294967293,
  witness   : []
}

const DEFAULT_VOUT = {
  value        : 0n,
  scriptPubKey : []
}

export function create_vin (
  vin : TxInTemplate | TxInput
) : TxInput {
  const sequence = (typeof vin.sequence === 'string')
    ? Buff.hex(vin.sequence).num
    : vin.sequence ?? DEFAULT_VIN.sequence
  const prevout = (typeof vin.prevout !== 'undefined')
    ? create_vout(vin.prevout)
    : vin.prevout
  return { ...DEFAULT_VIN, ...vin, prevout, sequence }
}

export function create_prevout (
  vin : TxInTemplate | TxInput
) : TxPrevout {
  if (vin.prevout === undefined) {
    throw new Error('Prevout is undefined!')
  }
  return create_vin(vin) as TxPrevout
}

export function create_vout (
  vout : TxOutTemplate | TxOutput
) : TxOutput {
  let value : bigint
  if (typeof vout.value === 'number') {
    value = BigInt(vout.value)
  } else if (typeof vout.value === 'string') {
    value = Buff.hex(vout.value).big
  } else if (typeof vout.value === 'bigint') {
    value = vout.value
  } else {
    value = 0n
  }
  return { ...DEFAULT_VOUT, ...vout, value }
}

export function create_tx (
  template : TxTemplate
) : TxData {
  const locktime = (typeof template.locktime === 'string')
    ? Buff.hex(template.locktime).num
    : template.locktime ?? DEFAULT_TX.locktime
  const tx = { ...DEFAULT_TX, ...template, locktime }
  tx.vin  = tx.vin.map(txin   => create_vin(txin))
  tx.vout = tx.vout.map(txout => create_vout(txout))
  return schema.tx.txdata.parse(tx)
}
