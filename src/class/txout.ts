import { Assert }        from '@vbyte/micro-lib'
import { Transaction }   from './tx.js'
import { decode_script } from '@/lib/script/index.js'

import {
  get_txout_size,
  get_vout_type,
  get_vout_version
} from '@/lib/tx/index.js'

import type { TxOutput } from '@/types/index.js'

export class TransactionOutput {

  private readonly _tx    : Transaction
  private readonly _index : number

  constructor (
    transaction : Transaction,
    index : number
  ) {
    this._tx    = transaction
    this._index = index
  }

  get data () : TxOutput {
    const txout = this._tx.data.vout.at(this.index)
    Assert.exists(txout, 'txout not found')
    return txout
  }

  get index () {
    return this._index
  }

  get script_pk () {
    return {
      hex : this.data.script_pk,
      asm : decode_script(this.data.script_pk)
    }
  }

  get size () {
    return get_txout_size(this.data)
  }

  get type () {
    return get_vout_type(this.data.script_pk)
  }

  get value () : bigint {
    return this.data.value
  }

  get version () {
    return get_vout_version(this.data.script_pk)
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}
