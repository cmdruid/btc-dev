import { Buff, Bytes }   from '@vbyte/buff'
import { decode_script } from '@/lib/script/index.js'

import {
  parse_witness_data,
  get_witness_size,
} from '@/lib/witness/index.js'

import type {
  ScriptField,
  WitnessField,
  WitnessInfo,
  WitnessSize,
  WitnessType
} from '@/types/index.js'

export class TransactionWitness {

  private readonly _data  : Buff[]
  private readonly _meta  : WitnessInfo
  private readonly _size  : WitnessSize

  constructor (witness : Bytes[]) {
    this._data  = witness.map(e => Buff.bytes(e))
    this._meta  = parse_witness_data(witness)
    this._size  = get_witness_size(witness)
  }

  get annex () : string | null {
    return this._meta.annex
  }

  get cblock () : string | null {
    return this._meta.cblock
  }

  get data () : WitnessField {
    return {
      annex   : this.annex,
      cblock  : this.cblock,
      params  : this.params,
      script  : this.script,
      size    : this.size,
      stack   : this.stack,
      type    : this.type,
      version : this.version,
      vsize   : this.vsize
    }
  }

  get params () : string[] {
    return this._meta.params
  }

  get script () : ScriptField | null {
    if (this._meta.script === null) return null
    return {
      hex : this._meta.script,
      asm : decode_script(this._meta.script)
    }
  }

  get size () : number {
    return this._size.size
  }

  get stack () : string[] {
    return this._data.map(e => e.hex)
  }

  get type () : WitnessType {
    return this._meta.type
  }

  get version () : number | null {
    return this._meta.version
  }

  get vsize () : number {
    return this._size.vsize
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}