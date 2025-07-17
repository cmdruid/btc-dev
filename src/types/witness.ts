import type { SpendScriptType, WitnessVersion } from './script.js'

export type WitnessContext = WitnessData | TaprootScript | SegwitScript | TaprootSpend | SegwitSpend

export interface WitnessSize {
  total : number
  vsize : number
}

export interface WitnessData {
  annex   : string | null
  cblock  : string | null
  params  : string[]
  script  : string | null
  stack   : string[]
  type    : SpendScriptType | null
  version : WitnessVersion  | null
}

export interface TaprootScript extends WitnessData {
  cblock  : string
  script  : string
  type    : 'p2ts'
  version : 1
}

export interface SegwitScript extends WitnessData {
  script  : string
  type    : 'p2wsh'
  version : 0
}

export interface TaprootSpend extends WitnessData {
  type    : 'p2tr'
  version : 1
}

export interface SegwitSpend extends WitnessData {
  type    : 'p2wpkh'
  version : 0
}

