import type { TxWitnessType, TxWitnessVersion } from './witness.js'

export type TxOutputType    = TxWitnessType   | 'p2pkh' | 'p2sh' | 'opreturn'
export type TxInput         = TxCoinbaseInput | TxSpendInput | TxVirtualInput
export type TransactionData = string | TxData | TxTemplate

export interface TxOutpoint {
  txid : string
  vout : number
}

export interface TxSize {
  base   : number
  full   : number
  weight : number
  vsize  : number
}

export interface TxInputTemplate extends TxOutpoint {
  coinbase?   : string   | null
  prevout?    : TxOutput | null
  script_sig? : string   | null
  sequence?   : number
  witness?    : string[]
}

export interface TxCoinbaseInput extends TxOutpoint {
  coinbase   : string
  prevout    : null
  script_sig : null
  sequence   : number
  witness    : string[]
}

export interface TxVirtualInput extends TxOutpoint {
  coinbase   : null
  prevout    : TxOutput | null
  script_sig : string   | null
  sequence   : number
  witness    : string[]
}

export interface TxSpendInput extends TxVirtualInput {
  prevout : TxOutput
}

export interface TxInputInfo {
  index   : number
  type    : TxWitnessType
  version : TxWitnessVersion
}

export interface TxOutput {
  script_pk : string
  value     : bigint
}

export interface TxOutputInfo {
  index   : number
  type    : TxOutputType
  version : TxWitnessVersion
}

export interface TxTemplate {
  locktime? : number
  vin?      : TxInputTemplate[]
  vout?     : TxOutput[]
  version?  : number
}

export interface TxData {
  locktime : number
  vin      : TxInput[]
  vout     : TxOutput[]
  version  : number
}
