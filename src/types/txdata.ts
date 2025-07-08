export type TxInput = TxCoinbaseInput | TxSpendInput | TxVirtualInput

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

export interface TxOutputTemplate {
  script_pk : string
  value     : number | bigint
}

export interface TxOutput {
  script_pk : string
  value     : bigint
}

export interface TxTemplate {
  locktime? : number
  vin?      : TxInputTemplate[]
  vout?     : TxOutputTemplate[]
  version?  : number
}

export interface TxData {
  locktime : number
  vin      : TxInput[]
  vout     : TxOutput[]
  version  : number
}

export interface TxDecodedData {
  locktime : number
  vin      : (TxCoinbaseInput | TxVirtualInput)[]
  vout     : TxOutput[]
  version  : number
}

export interface TxSpendData {
  locktime : number
  vin      : TxSpendInput[]
  vout     : TxOutput[]
  version  : number
}

export interface TxSize {
  base   : number
  total  : number
  vsize  : number
  weight : number
}

export interface TxValue {
  fees : bigint
  vin  : bigint
  vout : bigint
}
