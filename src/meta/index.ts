import { LocktimeUtil } from './locktime.js'
import { SequenceUtil } from './sequence.js'
import { WitnessUtil }  from './witness.js'

export * from './locktime.js'
export * from './sequence.js'
export * from './witness.js'

export namespace MetaUtil {
  export const Locktime = LocktimeUtil
  export const Sequence = SequenceUtil
  export const Witness  = WitnessUtil
}
