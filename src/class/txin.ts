import { decode_script }      from '@/lib/script/index.js'
import { SequenceUtil }       from '@/lib/meta/index.js'
import { TransactionOutput }  from './txout.js'
import { TransactionWitness } from './witness.js'

import {
  encode_txin_sequence,
  get_txin_size,
} from '@/lib/tx/index.js'

import type { TxInput } from '@/types/index.js'

export class TransactionInput {

  private readonly _txin : TxInput

  constructor (txin : TxInput) {
    this._txin = txin
  }

  get coinbase () : string | null {
    return this._txin.coinbase
  }

  get data () : TxInput {
    return this._txin
  }

  get has_prevout () : boolean {
    return this._txin.prevout !== null
  }

  get is_coinbase () : boolean {
    return this._txin.coinbase !== null
  }

  get prevout () : TransactionOutput | null {
    return this._txin.prevout
      ? new TransactionOutput(this._txin.prevout)
      : null
  }

  get script_sig () {
    if (this._txin.script_sig === null) return null
    return {
      asm : decode_script(this._txin.script_sig),
      hex : this._txin.script_sig
    }
  }

  get sequence () {
    return {
      hex   : encode_txin_sequence(this._txin.sequence).hex,
      data  : SequenceUtil.decode(this._txin.sequence),
      value : this._txin.sequence
    }
  }

  get size () {
    return get_txin_size(this._txin)
  }

  get txid () : string {
    return this._txin.txid
  }

  get vout () : number {
    return this._txin.vout
  }

  get witness () {
    return this._txin.witness.length > 0
      ? new TransactionWitness(this._txin.witness)
      : null
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}