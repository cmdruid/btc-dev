export type TxWitnessType    = 'p2w-pkh' | 'p2w-sh' | 'p2tr-pk' | 'p2tr-ts' | 'unknown'
export type TxWitnessVersion = number | null

export type TxWitness = TxWitnessData | TxWitnessTaprootScript | TxWitnessSegwitScript | TxWitnessTaprootSpend | TxWitnessSegwitSpend

export interface TxWitnessData {
  annex   : string | null
  cblock  : string | null
  params  : string[]
  script  : string | null
  type    : TxWitnessType
  version : TxWitnessVersion
}

export interface TxWitnessTaprootScript extends TxWitnessData {
  cblock  : string
  script  : string
  type    : 'p2tr-ts'
  version : 1
}

export interface TxWitnessSegwitScript extends TxWitnessData {
  script  : string
  type    : 'p2w-sh'
  version : 0
}

export interface TxWitnessTaprootSpend extends TxWitnessData {
  type    : 'p2tr-pk'
  version : 1
}

export interface TxWitnessSegwitSpend extends TxWitnessData {
  type    : 'p2w-pkh'
  version : 0
}

