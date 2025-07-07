import * as Schema from '@/schema/index.js'

import {
  TxSpendInput,
  TxData,
  TxInput,
  TxInputTemplate,
  TxOutput,
  TxTemplate,
  TxOutputTemplate,
  TxSpendData,
} from '@/types/index.js'

export function assert_tx_template (txdata : unknown) : asserts txdata is TxTemplate {
  Schema.tx.tx_template.parse(txdata)
}

export function assert_has_prevouts (vin : TxInput[]) : asserts vin is TxSpendInput[] {
  if (vin.some(txin => txin.prevout === null)) {
    throw new Error('transaction missing prevouts')
  }
}

export function assert_tx_data (txdata : unknown) : asserts txdata is TxData {
  Schema.tx.tx_data.parse(txdata)
}

export function assert_tx_spend_data (txdata : unknown) : asserts txdata is TxSpendData {
  // Assert the txdata is a valid tx data object.
  assert_tx_data(txdata)
  // Assert the txdata has prevouts.
  assert_has_prevouts(txdata.vin)
}

export function assert_tx_input (tx_input : unknown) : asserts tx_input is TxInput {
  Schema.tx.tx_input.parse(tx_input)
}

export function assert_tx_output (tx_output : unknown) : asserts tx_output is TxOutput {
  Schema.tx.tx_output.parse(tx_output)
}

export function assert_vin_template (vin : unknown) : asserts vin is TxInputTemplate {
  Schema.tx.vin_template.parse(vin)
}

export function assert_vout_template (vout : unknown) : asserts vout is TxOutputTemplate {
  Schema.tx.vout_template.parse(vout)
}
