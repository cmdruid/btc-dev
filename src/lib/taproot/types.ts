import { Bytes }      from '@cmdcode/buff'
import { ScriptWord } from '../script/types.js'

export type TapTree = Array<string | string[]>

export type MerkleProof = [
  root   : string,
  target : string | undefined,
  path   : string[]
]

export interface TaprootConfig {
  int_key  : string
  leaves  ?: TapTree
  target  ?: string
  version ?: number
}

export interface TaprootContext {
  cblock   : string
  int_key  : string
  parity   : number
  taproot ?: string
  tapkey   : string
  taptweak : string
}

export interface CtrlBlock {
  int_pub  : string
  parity   : number
  path     : string[]
  version  : number
}

export interface ProofData {
  cblock : CtrlBlock
  params : Bytes[]
  script : ScriptWord[]
  tapkey : Bytes
  tweak  : Bytes
}
