import type { Transaction } from '@scure/btc-signer'

import type {
  TransactionInput,
  TransactionOutput
} from '@scure/btc-signer/psbt'

export type PSBTData   = Transaction
export type PSBTInput  = TransactionInput
export type PSBTOutput = TransactionOutput

export interface PSBTPrevouts {
  amounts : bigint[]
  scripts : Uint8Array[]
}
