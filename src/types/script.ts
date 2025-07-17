export type LockScriptType  = 'p2pkh' | 'p2sh'   | 'p2wpkh' | 'p2wsh'  | 'p2tr' | 'opreturn'
export type SpendScriptType = 'p2pkh' | 'p2sh'   | 'p2wpkh' | 'p2wsh'  | 'p2tr' | 'p2ts'
export type WitnessVersion  = 0 | 1 | null

export interface ScriptInfo {
  asm : string[]
  hex : string
}

export interface LockScriptInfo {
  type    : LockScriptType | null
  version : WitnessVersion | null
}

export interface SpendScriptInfo {
  type    : SpendScriptType
  version : WitnessVersion
}
