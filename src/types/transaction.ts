import { TxOutput } from './txdata.js'
import { LocktimeInfo, SequenceInfo } from './txmeta.js'

import type {
  WitnessType,
  WitnessVersion
} from './witness.js'

export type TxOutputType = WitnessType | 'p2pkh' | 'p2sh' | 'opreturn'

export interface TxOutputInfo {
  type    : TxOutputType
  version : WitnessVersion
}

export interface TxInputInfo {
  type    : WitnessType
  version : WitnessVersion
}

export interface LocktimeField {
  hex   : string
  data  : LocktimeInfo | null
  value : number
}

export interface SequenceField {
  hex   : string
  data  : SequenceInfo | null
  value : number
}

export interface ScriptField {
  asm : string[]
  hex : string
}

export interface TxSize {
  base   : number
  real   : number
  weight : number
  vsize  : number
}

export interface TxValue {
  fees : bigint
  vin  : bigint
  vout : bigint
}

export interface WitnessSize {
  size  : number
  vsize : number
}

export interface TransactionData {
  hash     : string
  locktime : LocktimeField
  return   : TxOutput | null
  size     : TxSize
  spends   : TxOutputField[]
  txid     : string
  value    : TxValue
  version  : number
  vin      : TxInputField[]
  vout     : TxOutputField[]
}

export interface WitnessField {
  annex   : string | null
  cblock  : string | null
  params  : string[]
  script  : ScriptField | null
  size    : number
  stack   : string[]
  type    : WitnessType
  version : WitnessVersion
  vsize   : number
}

export interface TxInputField {
  coinbase?   : string        | null
  prevout?    : TxOutputField | null
  script_sig? : ScriptField   | null
  sequence    : SequenceField
  size        : number
  txid        : string
  vout        : number
  witness?    : WitnessField | null
}

export interface TxOutputField {
  script_pk : ScriptField
  size      : number
  type      : TxOutputType
  value     : bigint
  version   : WitnessVersion | null
}
