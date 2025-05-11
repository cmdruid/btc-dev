type Bytes = string | Uint8Array

export type TapTree = Array<Bytes | Bytes[]>

export type MerkleProof = [
  root   : string,
  target : string | undefined,
  path   : string[]
]

export interface TaprootConfig {
  pubkey   : Bytes
  leaves  ?: TapTree
  target  ?: Bytes
  version ?: number
}

export interface TaprootContext {
  cblock   : string
  int_key  : string
  parity   : number
  taproot  : string | null
  tapkey   : string
  taptweak : string
}

export interface ControlBlock {
  int_key  : string
  parity   : number
  path     : string[]
  version  : number
}

export interface ProofData {
  cblock : ControlBlock
  params : string[]
  script : string
  tapkey : string
  tweak  : string
}
