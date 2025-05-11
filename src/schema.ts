import * as SCHEMA from '@/util/index.js'

const { zod, big, hex, hex32, uint, byte32 } = SCHEMA

const sats    = big.max(2_100_000_000_000_000n)
const taptree = zod.union([ zod.array(byte32), byte32 ])

const tap_config = zod.object({
  pubkey  : byte32,
  leaves  : taptree.array().optional(),
  target  : byte32.optional(),
  version : uint.optional(),
})

const tx_output = zod.object({
  value     : sats,
  script_pk : hex,
})

const tx_input = zod.object({
  coinbase   : hex.nullable(),
  txid       : hex32,
  vout       : uint,
  prevout    : tx_output.nullable(),
  script_sig : hex.nullable(),
  sequence   : uint,
  witness    : zod.array(hex)
})

const tx_data = zod.object({
  version  : uint,
  vin      : zod.array(tx_input),
  vout     : zod.array(tx_output),
  locktime : uint,
})

const vin_template = tx_input.extend({
  coinbase   : hex.nullable().optional(),
  prevout    : tx_output.nullable().optional(),
  script_sig : hex.nullable().optional(),
  sequence   : uint.optional(),
  witness    : zod.array(hex).optional(),
})

const tx_template = zod.object({
  version  : uint.optional(),
  vin      : zod.array(vin_template).default([]),
  vout     : zod.array(tx_output).default([]),
  locktime : uint.optional(),
})

export const TxSchema = {
  tx_data,
  tx_input,
  tx_output,
  tx_template,
  vin_template,
  tap_config,
}
