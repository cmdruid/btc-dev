import { Buff }        from '@cmdcode/buff'
import { Transaction } from '@scure/btc-signer'

import type { PSBTData } from '@/types/index.js'

export function decode_psbt (b64str : string) : Transaction {
  const psbt = Buff.base64(b64str)
  return Transaction.fromPSBT(psbt, { allowUnknownOutputs: true })
}

export function encode_psbt (psbt : PSBTData) : string {
  const psbt_bytes = psbt.toPSBT(0)
  return new Buff(psbt_bytes).base64
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
