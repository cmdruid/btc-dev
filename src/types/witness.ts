export type WitnessType    = 'p2w-pkh' | 'p2w-sh' | 'p2tr-pk' | 'p2tr-ts' | 'unknown'
export type WitnessVersion = number | null

export type TxWitness = WitnessInfo | TaprootScript | SegwitScript | TaprootSpend | SegwitSpend

export interface WitnessInfo {
  annex   : string | null
  cblock  : string | null
  params  : string[]
  script  : string | null
  type    : WitnessType
  version : WitnessVersion
}

export interface TaprootScript extends WitnessInfo {
  cblock  : string
  script  : string
  type    : 'p2tr-ts'
  version : 1
}

export interface SegwitScript extends WitnessInfo {
  script  : string
  type    : 'p2w-sh'
  version : 0
}

export interface TaprootSpend extends WitnessInfo {
  type    : 'p2tr-pk'
  version : 1
}

export interface SegwitSpend extends WitnessInfo {
  type    : 'p2w-pkh'
  version : 0
}

