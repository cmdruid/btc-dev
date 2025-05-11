import { decode_tx_data } from './decode.js'
import { create_tx_data } from './create.js'

import type {
  TransactionData,
  TxData
} from '../types/index.js'

export function parse_tx_data (
  txdata : TransactionData
) : TxData {
  return (typeof txdata === 'string')
    ? decode_tx_data(txdata)
    : create_tx_data(txdata)
}
