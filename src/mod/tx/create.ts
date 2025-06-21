import { Assert }              from '@/util/index.js'
import { COINBASE, DEFAULT }   from '@/const.js'

import {
  assert_tx_output,
  assert_tx_template,
  assert_vin_template
} from './validate.js'

import type {
  TxData,
  TxInputTemplate,
  TxInput,
  TxOutput,
  TxTemplate,
  SpendInput,
  CoinbaseInput
} from '@/types/index.js'

export function create_coinbase_input (
  config : TxInputTemplate | TxInput
) : CoinbaseInput {
  assert_vin_template(config)
  Assert.exists(config.coinbase, 'coinbase is required')
  const coinbase   = config.coinbase
  const prevout    = null
  const script_sig = null
  const sequence   = config.sequence ?? DEFAULT.SEQUENCE
  const txid       = COINBASE.TXID
  const vout       = COINBASE.VOUT
  const witness    = config.witness  ?? []
  return { coinbase, prevout, script_sig, sequence, witness, txid, vout }
}

export function create_spend_input (
  config : TxInputTemplate | TxInput
) : SpendInput {
  assert_vin_template(config)
  Assert.exists(config.prevout, 'prevout is required')
  const prevout    = config.prevout
  const coinbase   = null
  const script_sig = config.script_sig ?? null
  const sequence   = config.sequence   ?? DEFAULT.SEQUENCE
  const witness    = config.witness    ?? []
  return { ...config, coinbase, prevout, script_sig, sequence, witness }
}

export function create_tx_input (
  config : TxInputTemplate | TxInput
) : TxInput {
  assert_vin_template(config)
  Assert.exists(config.txid, 'txid is required')
  Assert.exists(config.vout, 'vout is required')
  const coinbase   = config.coinbase   ?? null
  const prevout    = config.prevout    ?? null
  const script_sig = config.script_sig ?? null
  const sequence   = config.sequence   ?? DEFAULT.SEQUENCE
  const witness    = config.witness    ?? []
  if (coinbase !== null) return create_coinbase_input(config)
  if (prevout  !== null) return create_spend_input(config)
  return { ...config, coinbase, prevout, script_sig, sequence, witness }
}

export function create_tx_output (
  config : TxOutput
) : TxOutput {
  assert_tx_output(config)
  const { script_pk, value } = config
  return { script_pk, value : BigInt(value) }
}

export function create_tx_data (
  config: TxTemplate | TxData
) : TxData {
  assert_tx_template(config)
  const { vin = [], vout = [] } = config
  const locktime = config.locktime ?? DEFAULT.LOCKTIME
  const version  = config.version  ?? DEFAULT.VERSION
  const inputs   = vin.map(txin   => create_tx_input(txin))
  const outputs  = vout.map(txout => create_tx_output(txout))
  return { locktime, vin : inputs, vout : outputs, version }
}
