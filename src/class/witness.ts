import { Buff, Bytes }   from '@vbyte/buff'
import { Assert }        from '@vbyte/micro-lib'
import { decode_script } from '@/lib/script/index.js'

import {
  parse_witness,
  get_witness_size,
} from '@/lib/witness/index.js'

import type {
  ScriptField,
  WitnessField,
  WitnessData,
  WitnessSize,
  WitnessType
} from '@/types/index.js'

export class TransactionWitness {

  private readonly _elems : Buff[]

  private _data : WitnessData
  private _size : WitnessSize

  constructor (witness : Bytes[]) {
    this._elems = witness.map(e => Buff.bytes(e))
    this._data  = parse_witness(this._elems)
    this._size  = get_witness_size(this._elems)
  }

  get annex () : string | null {
    return this._data.annex
  }

  get cblock () : string | null {
    return this._data.cblock
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
      version : this.version
    }
  }

  get params () : string[] {
    return this._data.params
  }

  get script () : ScriptField | null {
    if (this._data.script === null) return null
    return {
      hex : this._data.script,
      asm : decode_script(this._data.script)
    }
  }

  get size () : WitnessSize {
    return this._size
  }

  get stack () : string[] {
    return this._elems.map(e => e.hex)
  }

  get type () : WitnessType {
    return this._data.type
  }

  get version () : number | null {
    return this._data.version
  }

  _update () {
    this._data = parse_witness(this._elems)
    this._size = get_witness_size(this._elems)
  }

  add (elem : Bytes) {
    this._elems.push(Buff.bytes(elem))
    this._update()
  }

  insert (index : number, elem : Bytes) {
    Assert.ok(index >= 0 && index <= this._elems.length, 'index out of bounds')
    if (index === this._elems.length) {
      this._elems.push(Buff.bytes(elem))
    } else {
      this._elems.splice(index, 0, Buff.bytes(elem))
    }
    this._update()
  }

  remove (index : number) {
    this._elems.splice(index, 1)
    this._update()
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}