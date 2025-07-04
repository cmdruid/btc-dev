
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
  TxInputTemplate
} from '@/types/index.js'

export class Transaction {

  private readonly _tx : TxData

  constructor (txdata : string | TxData | TxTemplate = {}) {
    this._tx = parse_tx(txdata)
  }

  get data () : TxData {
    return this._tx
  }

  get hash () : string {
    return get_txhash(this._tx)
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
    return get_txsize(this._tx)
  }

  get spends () : TxOutput[] {
    return this._tx.vin
      .filter(txin => txin.prevout !== null)
      .map(txin => txin.prevout!)
  }

  get txid () : string {
    return get_txid(this._tx)
  }

  get value () {
    return get_tx_value(this._tx)
  }

  get version () : number {
    return this._tx.version
  }

  get vin () : TransactionInput[] {
    return this._tx.vin.map((_, idx) => new TransactionInput(this, idx))
  }

  get vout () : TransactionOutput[] {
    return this._tx.vout.map((_, idx) => new TransactionOutput(this, idx))
  }

  add_vin (tx_input : TxInputTemplate) {
    const txin = create_tx_input(tx_input)
    this._tx.vin.push(txin)
  }

  add_vout (tx_output : TxOutput) {
    const txout = create_tx_output(tx_output)
    this._tx.vout.push(txout)
  }

  insert_vin (index : number, tx_input : TxInputTemplate) {
    Assert.ok(index >= 0 && index <= this._tx.vin.length, 'input goes out of bounds')
    const txin = create_tx_input(tx_input)
    if (index === this._tx.vin.length) {
      this._tx.vin.push(txin)
    } else {
      this._tx.vin.splice(index, 0, txin)
    }
  }

  insert_vout (index : number, tx_output : TxOutput) {
    Assert.ok(index >= 0 && index <= this._tx.vout.length, 'output goes out of bounds')
    const txout = create_tx_output(tx_output)
    if (index === this._tx.vout.length) {
      this._tx.vout.push(txout)
    } else {
      this._tx.vout.splice(index, 0, txout)
    }
  }

  remove_vin (index : number) {
    Assert.ok(this._tx.vin.at(index) !== undefined, 'input does not exist at index')
    this._tx.vin.splice(index, 1)
  }

  remove_vout (index : number) {
    Assert.ok(this._tx.vout.at(index) !== undefined, 'output does not exist at index')
    this._tx.vout.splice(index, 1)
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

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}
