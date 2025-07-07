import { Assert }                      from '@vbyte/micro-lib/assert'
import { decode_tx }                   from './decode.js'
import { assert_tx_template }          from './validate.js'
import { create_tx, create_tx_output } from './create.js'

import type { TxData, TxOutputTemplate } from '@/types/index.js'

export function parse_tx (
  txdata    : unknown,
  prevouts? : TxOutputTemplate[]
) : TxData {
  // Define the tx variable.
  let tx : TxData
  // If the txdata is a string or Uint8Array,
  if (typeof txdata === 'string' || txdata instanceof Uint8Array) {
    // Decode the tx.
    tx = decode_tx(txdata)
  } else {
    // Assert the txdata is a valid tx template.
    assert_tx_template(txdata)
    // Create the tx.
    tx = create_tx(txdata)
  }
  // If the prevouts are provided,
  if (prevouts) {
    // Assert the prevouts are a non-empty array.
    Assert.has_items(prevouts, 'prevouts must be a non-empty array')
    // Iterate over the inputs.
    for (const [ idx, vin ] of tx.vin.entries()) {
      // Get the prevout.
      const prevout = prevouts.at(idx)
      // Assert the prevout exists.
      Assert.exists(prevout, 'prevout not found for input index: ' + idx)
      // Create the prevout.
      vin.prevout = create_tx_output(prevout)
    }
  }
  // Return the tx.
  return tx
}

export function serialize_tx (
  txdata : unknown
) : Record<string, unknown> {
  const tx       = parse_tx(txdata)
  const version  = tx.version
  const locktime = tx.locktime

  const vin  : Record<string, unknown>[] = []
  const vout : Record<string, unknown>[] = []

  for (const e of tx.vin) {
    if (e.prevout !== null) {
      vin.push({
        script_pk : e.prevout.script_pk,
        value     : Number(e.prevout.value)
      })
    }
  }

  for (const e of tx.vout) {
    vout.push({
      script_pk : e.script_pk,
      value     : Number(e.value)
    })
  }

  return { version, locktime, vin, vout }
}
