import { decode_script } from '@/lib/script/index.js'

import {
  get_txout_size,
  get_vout_type,
  get_vout_version
} from '@/lib/tx/index.js'

import type { TxOutput } from '@/types/index.js'

export class TransactionOutput {

  private readonly _txout : TxOutput

  constructor (txout : TxOutput) {
    this._txout = txout
  }

  get data () : TxOutput {
    return this._txout
  }

  get script_pk () {
    return {
      hex : this._txout.script_pk,
      asm : decode_script(this._txout.script_pk)
    }
  }

  get size () {
    return get_txout_size(this._txout)
  }

  get type () {
    return get_vout_type(this._txout.script_pk)
  }

  get value () : bigint {
    return this._txout.value
  }

  get version () {
    return get_vout_version(this._txout.script_pk)
  }

  toJSON   () { return this.data }
  toString () { return JSON.stringify(this.data) }
}
