import { Buff }          from '@cmdcode/buff'
import { decode_script } from '@/lib/script/index.js'

import {
  parse_witness_data,
  get_witness_vsize,
} from '@/lib/tx/index.js'

import type {
  Bytes,
  WitnessInfo,
  WitnessType
} from '@/types/index.js'

export class TransactionWitness {

  private readonly _data  : Buff[]
  private readonly _meta  : WitnessInfo
  private readonly _vsize : number

  constructor (witness : Bytes[]) {
    this._data  = witness.map(e => Buff.bytes(e))
    this._meta  = parse_witness_data(witness)
    this._vsize = get_witness_vsize(witness)
  }

  get annex () : string | null {
    return this._meta.annex
  }

  get bytes () : Bytes[] {
    return this._data.map(e => new Uint8Array(e))
  }

  get cblock () : string | null {
    return this._meta.cblock
  }

  get data () : string[] {
    return this._data.map(e => e.hex)
  }

  get params () : string[] {
    return this._meta.params
  }

  get script () : { hex : string, asm : string[] } | null {
    if (this._meta.script === null) return null
    return {
      hex : this._meta.script,
      asm : decode_script(this._meta.script)
    }
  }

  get type () : WitnessType {
    return this._meta.type
  }

  get version () : number | null {
    return this._meta.version
  }

  get vsize () : number {
    return this._vsize
  }

  toJSON   () { return this._data }
  toString () { return JSON.stringify(this._data) }
}