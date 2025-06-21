import { decode_script } from '@/lib/script/index.js'

import {
  get_txout_size,
  get_vout_info
} from '@/lib/tx/index.js'

import type { TxOutput, TxOutputInfo } from '@/types/index.js'

export class TransactionOutput {

  private readonly _info  : TxOutputInfo
  private readonly _size  : number
  private readonly _txout : TxOutput

  constructor (txout : TxOutput) {
    this._info  = get_vout_info(txout)
    this._size  = get_txout_size(txout)
    this._txout = txout
  }

  get script_pk () {
    return {
      hex : this._txout.script_pk,
      asm : decode_script(this._txout.script_pk)
    }
  }

  get size () {
    return this._size
  }

  get type () {
    return this._info.type
  }

  get value () : bigint {
    return this._txout.value
  }

  get version () {
    return this._info.version
  }

  toJSON   () { return this._txout }
  toString () { return JSON.stringify(this._txout) }
}
