import { parse_tx_data } from './parse.js'
import { TxScript }      from '../script/index.js'

import {
  create_tx_input,
  create_tx_output
} from './create.js'

import {
  get_txid,
  get_txsize,
  get_vout_type,
  get_vout_version
} from './calc.js'

import type {
  TxData,
  TxInput,
  TxOutput,
  TransactionData,
  TxInputTemplate
} from '../types/index.js'

export class Transaction {

  private readonly _tx  : TxData

  constructor (txdata : TransactionData = {}) {
    this._tx = parse_tx_data(txdata)
  }

  get locktime () : number {
    return this._tx.locktime
  }

  get data () : TxData {
    return Object.assign({}, this._tx)
  }

  get size () {
    return get_txsize(this._tx)
  }

  get txid () : string {
    return get_txid(this._tx)
  }

  get version () : number {
    return this._tx.version
  }

  get vin () : TransactionInput[] {
    return this._tx.vin
      .map((txin, index) => new TransactionInput(index, txin))
  }

  get vout () : TransactionOutput[] {
    return this._tx.vout
      .map((txout, index) => new TransactionOutput(index, txout))
  }

  add_vin (txin : TxInput | TxInputTemplate) {
    const input = create_tx_input(txin)
    this._tx.vin.push(input)
  }

  add_vout (txout : TxOutput) {
    const output = create_tx_output(txout)
    this._tx.vout.push(output)
  }

  toJSON   () { return this._tx }
  toString () { return JSON.stringify(this._tx) }
}

export class TransactionInput {

  private readonly _index : number
  private readonly _txin : TxInput

  constructor (
    index : number,
    txin  : TxInput
  ) {
    this._txin  = txin
    this._index = index
  }

  get coinbase () : string | null {
    return this._txin.coinbase
  }

  get data () : TxInput {
    return this._txin
  }

  get index () : number {
    return this._index
  }

  get is_coinbase () : boolean {
    return this._txin.coinbase !== null
  }

  get is_prevout () : boolean {
    return this._txin.prevout !== null
  }

  get prevout () : TxOutput | null {
    return this._txin.prevout
  }

  get script_sig () {
    if (this._txin.script_sig === null) return null
    return {
      asm : TxScript.decode(this._txin.script_sig),
      hex : this._txin.script_sig
    }
  }

  get sequence () : number {
    return this._txin.sequence
  }

  get txid () : string {
    return this._txin.txid
  }

  get vout () : number {
    return this._txin.vout
  }

  get witness () {
    return this._txin.witness
  }

  toJSON   () { return this._txin }
  toString () { return JSON.stringify(this._txin) }
}

export class TransactionOutput {

  private readonly _index : number
  private readonly _txout : TxOutput

  constructor (
    index : number, 
    txout : TxOutput
  ) {
    this._index = index
    this._txout = txout
  }

  get index () : number {
    return this._index
  }

  get script_pk () {
    return {
      hex     : this._txout.script_pk,
      asm     : TxScript.decode(this._txout.script_pk),
      type    : get_vout_type(this._txout.script_pk),
      version : get_vout_version(this._txout.script_pk)
    }
  }

  get value () : bigint {
    return this._txout.value
  }

  toJSON   () { return this._txout }
  toString () { return JSON.stringify(this._txout) }
}
