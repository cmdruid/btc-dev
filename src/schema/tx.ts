import { z } from 'zod'

import { big, hex, hex32, uint } from '@vbyte/micro-lib/schema'

export const sats = big.max(2_100_000_000_000_000n)

export const tx_output = z.object({
  value     : sats,
  script_pk : hex,
})

export const tx_input = z.object({
  coinbase   : hex.nullable(),
  txid       : hex32,
  vout       : uint,
  prevout    : tx_output.nullable(),
  script_sig : hex.nullable(),
  sequence   : uint,
  witness    : z.array(hex)
})

export const tx_data = z.object({
  version  : uint,
  vin      : z.array(tx_input),
  vout     : z.array(tx_output),
  locktime : uint,
})

export const vin_template = tx_input.extend({
  coinbase   : hex.nullable().optional(),
  prevout    : tx_output.nullable().optional(),
  script_sig : hex.nullable().optional(),
  sequence   : uint.optional(),
  witness    : z.array(hex).optional(),
})

export const tx_template = z.object({
  version  : uint.optional(),
  vin      : z.array(vin_template).default([]),
  vout     : z.array(tx_output).default([]),
  locktime : uint.optional(),
})
