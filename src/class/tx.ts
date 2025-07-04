
import { Assert }            from '@vbyte/micro-lib'
import { LocktimeUtil }      from '@/lib/meta/index.js'
import { TransactionInput }  from './txin.js'
import { TransactionOutput } from './txout.js'

import {
  get_txid,
  is_return_script,
  parse_tx,
  get_txsize,
  get_tx_value,
  get_txhash,
  encode_tx_locktime,
  create_tx_input,
  create_tx_output,
} from '@/lib/tx/index.js'

import type {
  TxData,
  TxTemplate,
  TxOutput,
  TxSize,
  TxValue,
  TxInputTemplate
} from '@/types/index.js'

export class Transaction {

  private readonly _tx : TxData

  private _size  : TxSize & { segwit : number }
  private _hash  : string
  private _txid  : string
  private _value : TxValue
  private _vin   : TransactionInput[]
  private _vout  : TransactionOutput[]

  constructor (txdata : string | TxData | TxTemplate = {}) {
    this._tx    = parse_tx(txdata)
    this._vin   = this._tx.vin.map(txin => new TransactionInput(txin))
    this._vout  = this._tx.vout.map(txout => new TransactionOutput(txout))

    this._size  = this._get_size()
    this._hash  = get_txhash(this._tx)
    this._txid  = get_txid(this._tx)
    this._value = get_tx_value(this._tx)
  }

  get data () : TxData {
    return this._tx
  }

  get hash () : string {
    return this._hash
  }

  get locktime () {
    return {
      hex   : encode_tx_locktime(this._tx.locktime).hex,
      data  : LocktimeUtil.decode(this._tx.locktime),
      value : this._tx.locktime
    }
  }

  get return () {
    return this._tx.vout.find(txout => is_return_script(txout.script_pk)) || null
  }

  get size () {
    return this._size
  }

  get spends () : TransactionOutput[] {
    return this._tx.vin
      .filter(txin => txin.prevout !== null)
      .map(txin => new TransactionOutput(txin.prevout!))
  }

  get txid () : string {
    return this._txid
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

  add_vin (tx_input : TxInputTemplate) {
    const txin = create_tx_input(tx_input)
    this._tx.vin.push(txin)
    this._update_vin()
  }

  add_vout (tx_output : TxOutput) {
    const txout = create_tx_output(tx_output)
    this._tx.vout.push(txout)
    this._update_vout()
  }

  insert_vin (index : number, tx_input : TxInputTemplate) {
    Assert.ok(index >= 0 && index <= this._tx.vin.length, 'input goes out of bounds')
    const txin = create_tx_input(tx_input)
    if (index === this._tx.vin.length) {
      this._tx.vin.push(txin)
    } else {
      this._tx.vin.splice(index, 0, txin)
    }
    this._update_vin()
  }

  insert_vout (index : number, tx_output : TxOutput) {
    Assert.ok(index >= 0 && index <= this._tx.vout.length, 'output goes out of bounds')
    const txout = create_tx_output(tx_output)
    if (index === this._tx.vout.length) {
      this._tx.vout.push(txout)
    } else {
      this._tx.vout.splice(index, 0, txout)
    }
    this._update_vout()
  }

  remove_vin (index : number) {
    Assert.ok(this._tx.vin.at(index) !== undefined, 'input does not exist at index')
    this._tx.vin.splice(index, 1)
    this._update_vin()
  }

  remove_vout (index : number) {
    Assert.ok(this._tx.vout.at(index) !== undefined, 'output does not exist at index')
    this._tx.vout.splice(index, 1)
    this._update_vout()
  }

  _get_size () {
    return {
      ...get_txsize(this._tx),
      segwit  : this.vin.reduce((acc, txin)   => acc + (txin.witness?.size.vsize ?? 0), 0),
      vin     : this.vin.reduce((acc, txin)   => acc + txin.size,  0),
      vout    : this.vout.reduce((acc, txout) => acc + txout.size, 0),
      witness : this.vin.reduce((acc, txin)   => acc + (txin.witness?.size.total ?? 0), 0)
    }
  }

  _update_tx () {
    this._size  = this._get_size()
    this._hash  = get_txhash(this._tx)
    this._txid  = get_txid(this._tx)
    this._value = get_tx_value(this._tx)
  }

  _update_vin () {
    this._vin = this._tx.vin.map(txin => new TransactionInput(txin))
    this._update_tx()
  }

  _update_vout () {
    this._vout = this._tx.vout.map(txout => new TransactionOutput(txout))
    this._update_tx()
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}
