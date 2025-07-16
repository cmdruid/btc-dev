import type{ WitnessType, WitnessVersion } from './witness.js'

export type LocktimeData   = LocktimeStamp | LocktimeHeight
export type SequenceConfig = Partial<SequenceData>
export type SequenceData   = SequenceHeightLock | SequenceStampLock
export type TxOutputType   = 'p2pkh' | 'p2sh' | 'p2w-pkh' | 'p2w-sh' | 'p2tr' | 'opreturn'

export interface TxOutputInfo {
  type    : TxOutputType   | null
  version : WitnessVersion | null
}

export interface TxInputInfo {
  type    : WitnessType
  version : WitnessVersion
}  

export interface LocktimeStamp {
  type  : 'timelock'  // Discriminator for timelock type
  stamp : number      // Unix timestamp in seconds
}

export interface LocktimeHeight {
  type   : 'heightlock'  // Discriminator for heightlock type
  height : number        // Block height value
}

// Represents a timestamp-based relative timelock.
export interface SequenceStampLock {
  stamp : number     // Unix timestamp in seconds.
  mode  : 'stamp'    // Discriminator for timelock mode.
}

// Represents a block-height-based relative timelock.
export interface SequenceHeightLock {
  height : number     // Block height.
  mode   : 'height'   // Discriminator for heightlock mode.
}

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

export interface InscriptionData {
  content  ?: string
  delegate ?: string
  mimetype ?: string
  opcode   ?: number
  parent   ?: string
  pointer  ?: number
  ref      ?: string
  rune     ?: string
}
