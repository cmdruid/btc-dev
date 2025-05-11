import { Buff } from '@cmdcode/buff'

import { is_valid_script } from '../script/decode.js'

import type {
  WitnessData,
  WitnessType
} from '../types/index.js'

import * as CONST from '../const.js'

export namespace WitnessUtil {
  export const parse = parse_witness_data
}

export function parse_witness_data (
  witness : string[]
) : WitnessData {
  // Parse the witness data.
  const elems   = witness.map(e => Buff.hex(e))
  const annex   = parse_annex_data(elems)
  if (annex !== null) elems.pop()
  const cblock  = parse_cblock_data(elems)
  if (cblock !== null) elems.pop()
  const type    = parse_witness_type(elems, cblock)
  const version = parse_witness_version(type)
  const script  = parse_witness_script(elems, type)
  if (script !== null) elems.pop()
  const params  = elems.map(e => new Buff(e).hex)
  return { annex, cblock, params, script, type, version }
}

function parse_annex_data (
  data : Uint8Array[]
) : string | null {
  // Get the last element of the array.
  let elem = data.at(-1)
  // Check if the element fits the annex format.
  if (
    data.length > 1            &&
    elem instanceof Uint8Array &&
    elem[0] === 0x50
  ) {
    // Return the element.
    return new Buff(elem).hex
  } else {
    // Return null.
    return null
  }
}

function parse_cblock_data (
  data : Uint8Array[]
) : string | null {
  let elem = data.at(-1)
  if (
    data.length > 1            &&
    elem instanceof Uint8Array &&
    elem.length > 32           &&
    CONST.TAPLEAF_VERSIONS.includes(elem[0] & 0xfe)
  ) {
    // Return the element.
    return new Buff(elem).hex
  } else {
    // Return null.
    return null
  }
}

function parse_witness_script (
  elems : Uint8Array[],
  type  : WitnessType
) {
  let script : Uint8Array | undefined
  switch (type) {
    case 'p2tr-ts':
      script = elems.at(-1)
    case 'p2w-sh':
      script = elems.at(-1)
  }
  return (script !== undefined) ? new Buff(script).hex : null
}

function parse_witness_type (
  elems  : Uint8Array[],
  cblock : string | null
) : WitnessType {
  // Get the important elements of the witness.
  let param_0 = elems.at(0),
      param_1 = elems.at(1),
      param_x = elems.at(-1)
  // If the cblock is present and the last element exists:
  if (cblock !== null && param_x !== undefined) {
    return 'p2tr-ts'
  // If the witness elements match the profile of a p2w-pkh:
  } else if (
    elems.length === 2    &&
    param_0 !== undefined &&
    param_1 !== undefined &&
    param_0.length >=  64 &&
    param_1.length === 33
  ) {
    return 'p2w-pkh'
  // If the witness elements match the profile of a p2tr-pk:
  } else if (
    elems.length === 1    &&
    param_0 !== undefined &&
    param_0.length === 64
  ) {
    return 'p2tr-pk'
  // If there is at least two witness elements:
  } else if (
    elems.length > 1      && 
    param_x !== undefined &&
    is_valid_script(param_x)
  ) {
    return 'p2w-sh'
  // If the witness elements don't match any known profile:
  } else {
    return 'unknown'
  }
}

function parse_witness_version (type : WitnessType) : number | null {
  if (type.startsWith('p2tr')) return 1
  if (type.startsWith('p2w'))  return 0
  return null
}
