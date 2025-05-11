import { TxSchema } from '../schema.js'

import {
  TxData,
  TxInput,
  TxInputTemplate,
  TxOutput,
  TxTemplate,
} from '../types/index.js'

export function validate_tx_template (
  txdata : unknown,
  debug  : boolean = false
) : asserts txdata is TxTemplate {
  const res = TxSchema.tx_template.safeParse(txdata)
  if (!res.success) {
    if (debug) console.error(res.error)
    throw new Error('transaction template failed validation')
  }
}

export function validate_tx_data (
  txdata : unknown,
  debug  : boolean = false
) : asserts txdata is TxData {
  const res = TxSchema.tx_data.safeParse(txdata)
  if (!res.success) {
    if (debug) console.error(res.error)
    throw new Error('transaction data failed validation')
  }
}

export function validate_tx_input (
  tx_input : unknown,
  debug    : boolean = false
) : asserts tx_input is TxInput {
  const res = TxSchema.tx_input.safeParse(tx_input)
  if (!res.success) {
    if (debug) console.error(res.error)
    throw new Error('transaction input failed validation')
  }
}

export function validate_tx_output (
  tx_output : unknown,
  debug     : boolean = false
) : asserts tx_output is TxOutput {
  const res = TxSchema.tx_output.safeParse(tx_output)
  if (!res.success) {
    if (debug) console.error(res.error)
    throw new Error('transaction output failed validation')
  }
}

export function validate_vin_template (
  vin_template : unknown,
  debug        : boolean = false
) : asserts vin_template is TxInputTemplate {
  const res = TxSchema.vin_template.safeParse(vin_template)
  if (!res.success) {
    if (debug) console.error(res.error)
    throw new Error('transaction input template failed validation')
  }
}
