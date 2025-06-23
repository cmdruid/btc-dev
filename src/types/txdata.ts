export type TxInput = CoinbaseInput | SpendInput | VirtualInput

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
