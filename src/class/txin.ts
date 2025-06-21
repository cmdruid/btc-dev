import { decode_script }      from '@/mod/script/index.js'
import { TransactionWitness } from './witness.js'

import {
  encode_txin_sequence,
  get_txin_size,
  Sequence
} from '@/mod/tx/index.js'

import type {
  TxInput,
  TxOutput
} from '@/types/index.js'

export class TransactionInput {

  private readonly _size    : number
  private readonly _txin    : TxInput
  private readonly _witness : TransactionWitness | null

  constructor (txin : TxInput) {
    this._size    = get_txin_size(txin)
    this._txin    = txin
    this._witness = txin.witness.length > 0
      ? new TransactionWitness(txin.witness)
      : null
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

  get prevout () : TxOutput | null {
    return this._txin.prevout
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
      info  : Sequence.decode(this._txin.sequence),
      value : this._txin.sequence
    }
  }

  get size () {
    return this._size
  }

  get txid () : string {
    return this._txin.txid
  }

  get vout () : number {
    return this._txin.vout
  }

  get witness () {
    return this._witness
  }

  toJSON   () { return this._txin }
  toString () { return JSON.stringify(this._txin) }
}