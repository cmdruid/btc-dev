import type { LocktimeData, SequenceData }               from './meta.js'
import type { TxOutput, TxOutputType, TxSize, TxValue }  from './txdata.js'
import type { WitnessData, WitnessVersion }              from './witness.js'

export interface LocktimeField {
  hex   : string
  data  : LocktimeData | null
  value : number
}

export interface SequenceField {
  hex   : string
  data  : SequenceData | null
  value : number
}

export interface ScriptField {
  asm : string[]
  hex : string
}

export interface TransactionData {
  hash     : string
  locktime : LocktimeField
  return   : TxOutput | null
  size     : TxSize
  spends   : TransactionOutputData[]
  txid     : string
  value    : TxValue
  version  : number
  vin      : TransactionInputData[]
  vout     : TransactionOutputData[]
}

export interface TransactionInputData {
  coinbase?   : string                | null
  prevout?    : TransactionOutputData | null
  script_sig? : ScriptField           | null
  sequence    : SequenceField
  size        : number
  txid        : string
  vout        : number
  witness?    : WitnessData | null
}

export interface TransactionOutputData {
  script_pk : ScriptField
  size      : number
  type      : TxOutputType
  value     : bigint
  version   : WitnessVersion | null
}
