import { TxOutputTemplate } from "@/index.js"

export interface TaprootSighashMidstate {
  amounts_hash   : string
  outputs_hash   : string
  outpoints_hash : string
  scripts_hash   : string
  sequences_hash : string
}

export interface SighashInputVector {
  seckey   : string
  txindex  : number
  sigflag  : number
  preimage : string
  sighash  : string
}

export interface SighashVector {
  txhex    : string
  prevouts : TxOutputTemplate[]
  vectors  : SighashInputVector[]
}

export interface TxPrevoutVector {
  script_pk : string
  value     : number
  seckey    : string
}

export interface TxDataVector {
  txhex    : string
  prevouts : TxPrevoutVector[]
}