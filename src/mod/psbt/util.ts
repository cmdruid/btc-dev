import { Assert }     from '@/util/validate.js'
import { parse_psbt } from './encoder.js'

import type {
  PSBTData,
  PSBTInput,
  PSBTOutput,
  PSBTPrevouts
} from '@/types/index.js'

export function collect_vins (
  psbt : string | PSBTData
) : PSBTInput[] {
  const pdata = parse_psbt(psbt)
  const count = pdata.inputsLength
  const vins : PSBTInput[] = []
  for (let i = 0; i < count; i++) {
    const vin = pdata.getInput(i)
    vins.push(vin)
  }
  return vins
}

export function collect_vouts (
  psbt : string | PSBTData
) : PSBTOutput[] {
  const pdata = parse_psbt(psbt)
  const count = pdata.outputsLength
  const vouts : PSBTOutput[] = []
  for (let i = 0; i < count; i++) {
    const vout = pdata.getOutput(i)
    vouts.push(vout)
  }
  return vouts
}

export function collect_prevouts (
  psbt : PSBTData
) : PSBTPrevouts {
  const amounts : bigint[]     = [],
        scripts : Uint8Array[] = []
  const pdata = parse_psbt(psbt)
  for (let i = 0; i < pdata.inputsLength; i++) {
    const txin = pdata.getInput(i)
    Assert.exists(txin.witnessUtxo, `witness utxo does not exist for input ${i}`)
    amounts.push(txin.witnessUtxo.amount)
    scripts.push(txin.witnessUtxo.script)
  }
  return { amounts, scripts }
}

export function finalize_legacy_inputs (pdata : PSBTData) {
  for (let i = 0; i < pdata.inputsLength; i++) {
    const pvin   = pdata.getInput(i)
    const script = pvin.redeemScript
    const psig   = pvin.partialSig?.at(0)
    if (script !== undefined && psig !== undefined) {
      pdata.finalizeIdx(i)
    }
  }
  return pdata
}
