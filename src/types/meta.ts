export type LocktimeInfo   = LocktimeStamp | LocktimeHeight
export type SequenceConfig = Partial<SequenceInfo>
export type SequenceInfo   = SequenceHeightLock | SequenceStampLock

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
