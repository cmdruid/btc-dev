import { TransactionInput }  from './txin.js'
import { TransactionOutput } from './txout.js'

import {
  decode_tx_data,
  get_txid,
  is_return_script,
  parse_tx_data,
  Locktime,
  get_txsize,
  get_tx_value,
  get_txhash,
  encode_tx_locktime,
} from '@/lib/tx/index.js'

import type {
  TxData,
  TxTemplate,
  TxSize,
  TxValue,
  TransactionData
} from '@/types/index.js'

export class Transaction {

  private readonly _size  : TxSize
  private readonly _tx    : TxData
  private readonly _hash  : string
  private readonly _value : TxValue
  private readonly _vin   : TransactionInput[]
  private readonly _vout  : TransactionOutput[]

  constructor (txdata : string | TxData | TxTemplate) {
    this._tx = (typeof txdata !== 'string')
      ? parse_tx_data(txdata)
      : decode_tx_data(txdata)

    this._vin  = this._tx.vin.map(txin => new TransactionInput(txin))
    this._vout = this._tx.vout.map(txout => new TransactionOutput(txout))

    this._size  = get_txsize(this._tx)
    this._hash  = get_txhash(this._tx)
    this._value = get_tx_value(this._tx)
  }

  get data () : TransactionData {
    return {
      hash     : this.hash,
      locktime : this.locktime,
      return   : this.return,
      size     : this.size,
      spends   : this.spends,
      txid     : this.txid,
      value    : this.value,
      version  : this.version,
      vin      : this.vin.map(txin => txin.data),
      vout     : this.vout.map(txout => txout.data)
    }
  }

  get hash () : string {
    return this._hash
  }

  get locktime () {
    return {
      hex   : encode_tx_locktime(this._tx.locktime).hex,
      data  : Locktime.decode(this._tx.locktime),
      value : this._tx.locktime
    }
  }

  get return () {
    return this._tx.vout.find(txout => is_return_script(txout.script_pk)) || null
  }

  get size () {
    return {
      ...this._size,
      segwit  : this._vin.reduce((acc, txin)   => acc + (txin.witness?.vsize ?? 0), 0),
      vin     : this._vin.reduce((acc, txin)   => acc + txin.size,  0),
      vout    : this._vout.reduce((acc, txout) => acc + txout.size, 0),
      witness : this._vin.reduce((acc, txin)   => acc + (txin.witness?.size ?? 0), 0)
    }
  }

  get spends () : TransactionOutput[] {
    return this._tx.vin
      .filter(txin => txin.prevout !== null)
      .map(txin => new TransactionOutput(txin.prevout!))
  }

  get txid () : string {
    return get_txid(this._tx)
  }

  get value () {
    return this._value
  }

  get version () : number {
    return this._tx.version
  }

  get vin () : TransactionInput[] {
    return this._vin
  }

  get vout () : TransactionOutput[] {
    return this._vout
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}



