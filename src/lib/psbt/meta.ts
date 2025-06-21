import { parse_psbt }             from './encoder.js'
import { finalize_legacy_inputs } from './util.js'

import { PSBTData } from '@/types/index.js'

export function get_vsize (psbt : string | PSBTData) : number {
  const pdata = parse_psbt(psbt)
  return pdata.vsize
}

export function get_txhex (psbt : PSBTData) : string {
  let pdata = parse_psbt(psbt)
      pdata = finalize_legacy_inputs(pdata)
  return pdata.hex
}
