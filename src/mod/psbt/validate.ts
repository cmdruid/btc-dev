import { Assert }     from '@/util/validate.js'
import { parse_psbt } from './encoder.js'

import {
  collect_vins,
  collect_vouts
} from './util.js'

import type { PSBTData } from '@/types/index.js'

export function assert_psbt_is_funded (psbt : string | PSBTData) : void {
  const pdata   = parse_psbt(psbt)
  const pvouts  = collect_vins(pdata)
  const txouts  = collect_vouts(pdata)
  const vin_amt = pvouts.reduce((p, n) => p + Number(n.witnessUtxo?.amount ?? 0), 0)
  const out_amt = txouts.reduce((p, n) => p + Number(n.amount ?? 0), 0)
  Assert.ok(vin_amt >= out_amt, `value in (${vin_amt}) < value out (${out_amt})`)
}