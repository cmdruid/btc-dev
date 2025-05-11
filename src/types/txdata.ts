import type { WitnessType, WitnessVersion } from './witness.js'

export type TxOutputType    = WitnessType   | 'p2pkh' | 'p2sh' | 'opreturn'
export type TxInput         = CoinbaseInput | SpendInput | VirtualInput
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

export interface CoinbaseInput extends TxOutpoint {
  coinbase   : string
  prevout    : null
  script_sig : null
  sequence   : number
  witness    : string[]
}

export interface VirtualInput extends TxOutpoint {
  coinbase   : null
  prevout    : TxOutput | null
  script_sig : string   | null
  sequence   : number
  witness    : string[]
}

export interface SpendInput extends VirtualInput {
  prevout : TxOutput
}

export interface TxInputInfo {
  index   : number
  type    : WitnessType
  version : WitnessVersion
}

export interface TxOutput {
  script_pk : string
  value     : bigint
}

export interface TxOutputInfo {
  index   : number
  type    : TxOutputType
  version : WitnessVersion
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
