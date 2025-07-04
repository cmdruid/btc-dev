import { Assert }             from '@vbyte/micro-lib'
import { Transaction }        from './tx.js'
import { decode_script }      from '@/lib/script/index.js'
import { SequenceUtil }       from '@/lib/meta/index.js'
import { TransactionWitness } from './witness.js'

import {
  encode_txin_sequence,
  get_txin_size,
} from '@/lib/tx/index.js'

import type { TxInput, TxOutput } from '@/types/index.js'

export class TransactionInput {

  private readonly _tx    : Transaction
  private readonly _index : number

  constructor (
    transaction : Transaction,
    index       : number
  ) {
    this._tx    = transaction
    this._index = index
  }

  get coinbase () : string | null {
    return this.data.coinbase
  }

  get data () : TxInput {
    const txin = this._tx.data.vin.at(this.index)
    Assert.exists(txin, 'txin not found')
    return txin
  }

  get has_prevout () : boolean {
    return this.data.prevout !== null
  }

  get index () : number {
    return this._index
  }

  get is_coinbase () : boolean {
    return this.data.coinbase !== null
  }

  get prevout () : TxOutput | null {
    return this.data.prevout
  }

  get script_sig () {
    if (this.data.script_sig === null) return null
    return {
      asm : decode_script(this.data.script_sig),
      hex : this.data.script_sig
    }
  }

  get sequence () {
    return {
      hex   : encode_txin_sequence(this.data.sequence).hex,
      data  : SequenceUtil.decode(this.data.sequence),
      value : this.data.sequence
    }
  }

  get size () {
    return get_txin_size(this.data)
  }

  get txid () : string {
    return this.data.txid
  }

  get vout () : number {
    return this.data.vout
  }

  get witness () {
    return this.data.witness.length > 0
      ? new TransactionWitness(this._tx, this.index)
      : null
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}