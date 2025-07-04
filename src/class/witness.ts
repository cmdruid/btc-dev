import { Transaction }   from './tx.js'
import { Assert }        from '@vbyte/micro-lib'
import { decode_script } from '@/lib/script/index.js'

import {
  parse_witness,
  get_witness_size
} from '@/lib/witness/index.js'

import type {
  ScriptField,
  WitnessData,
  WitnessSize,
  WitnessType
} from '@/types/index.js'

export class TransactionWitness {

  private readonly _tx    : Transaction
  private readonly _index : number

  constructor (
    transaction : Transaction,
    index       : number
  ) {
    this._tx    = transaction
    this._index = index
  }

  get annex () : string | null {
    return this.data.annex
  }

  get cblock () : string | null {
    return this.data.cblock
  }

  get data () : WitnessData {
    return parse_witness(this.stack)
  }

  get params () : string[] {
    return this.data.params
  }

  get script () : ScriptField | null {
    if (this.data.script === null) return null
    return {
      hex : this.data.script,
      asm : decode_script(this.data.script)
    }
  }

  get size () : WitnessSize {
    return get_witness_size(this.stack)
  }

  get stack () : string[] {
    const txin = this._tx.data.vin.at(this._index)
    Assert.exists(txin,         'txin not found at index '    + this._index)
    Assert.exists(txin.witness, 'witness not found at index ' + this._index)
    return txin.witness
  }

  get type () : WitnessType {
    return this.data.type
  }

  get version () : number | null {
    return this.data.version
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}