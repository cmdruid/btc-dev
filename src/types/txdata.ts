import type { WitnessType, WitnessVersion } from './witness.js'

export type TxInput      = TxCoinbaseInput | TxSpendInput | TxVirtualInput
export type TxOutputType = WitnessType | 'p2pkh' | 'p2sh' | 'opreturn'

export interface TxOutputInfo {
  type    : TxOutputType
  version : WitnessVersion
}

export interface TxInputInfo {
  type    : WitnessType
  version : WitnessVersion
}  

export interface TxOutpoint {
  txid : string
  vout : number
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

export interface TxOutput {
  script_pk : string
  value     : bigint
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

export interface TxSize {
  base   : number
  total  : number
  weight : number
  vsize  : number
}

export interface TxValue {
  fees : bigint
  vin  : bigint
  vout : bigint
}
