import { Buff, Bytes } from '@cmdcode/buff'
import { ECC }         from '@/util/index.js'

import {
  sign_segwit_tx,
  sign_taproot_tx
} from '@/lib/sighash/sign.js'

import type {
  SigHashOptions,
  TransactionData
} from '@/types/index.js'

export class TxSigner {
  private readonly _seckey : string

  constructor (seckey : Bytes) {
    this._seckey = Buff.bytes(seckey).hex
  }

  get pubkey () {
    return {
      segwit  : ECC.get_pubkey(this._seckey, 'ecdsa'),
      taproot : ECC.get_pubkey(this._seckey, 'bip340')
    }
  }

  get sign_msg () {
    return {
      ecdsa : (msg : Bytes) => {
        const bytes = Buff.bytes(msg)
        return ECC.sign_ecdsa(this._seckey, bytes)
      },
      bip340 : (msg : Bytes) => {
        const bytes = Buff.bytes(msg)
        return ECC.sign_bip340(this._seckey, bytes)
      }
    }
  }

  get sign_tx () {
    return {
      segwit  : (tx : TransactionData, options : SigHashOptions) => sign_segwit_tx(this._seckey, tx, options),
      taproot : (tx : TransactionData, options : SigHashOptions) => sign_taproot_tx(this._seckey, tx, options)
    }
  }
}
