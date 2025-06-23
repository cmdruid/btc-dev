import { Base64 }      from '@vbyte/micro-lib'
import { Transaction } from '@scure/btc-signer'

import type { PSBTData } from '@/types/index.js'

export function decode_psbt (b64str : string) : Transaction {
  const psbt = Base64.decode(b64str)
  return Transaction.fromPSBT(psbt, { allowUnknownOutputs: true })
}

export function encode_psbt (psbt : PSBTData) : string {
  const psbt_bytes = psbt.toPSBT(0)
  return Base64.encode(psbt_bytes)
}

export function parse_psbt (psbt : string | PSBTData) : Transaction {
  if (psbt instanceof Transaction) {
    return psbt
  } else if (typeof psbt === 'string') {
    return decode_psbt(psbt)
  } else {
    throw new Error('invalid psbt input: ' + psbt)
  }
}
