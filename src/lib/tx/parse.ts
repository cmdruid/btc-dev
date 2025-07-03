import { decode_tx }          from './decode.js'
import { create_tx     }      from './create.js'
import { assert_tx_template } from './validate.js'

import type { TxData } from '@/types/index.js'

export function parse_tx (
  txdata : unknown
) : TxData {
  if (typeof txdata === 'string') {
    return decode_tx(txdata)
  } else {
    assert_tx_template(txdata)
    return create_tx(txdata)
  }
}
