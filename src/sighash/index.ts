import { hash_segwit_tx }  from './segwit.js'
import { hash_taproot_tx } from './taproot.js'

import {
  sign_segwit_tx,
  sign_taproot_tx
} from './signer.js'

export * from './segwit.js'
export * from './taproot.js'
export * from './signer.js'
export * from './util.js'

export namespace SighashUtil {
  export const segwit  = {
    hash_tx : hash_segwit_tx,
    sign_tx : sign_segwit_tx
  }
  export const taproot = {
    hash_tx : hash_taproot_tx,
    sign_tx : sign_taproot_tx
  }
}
