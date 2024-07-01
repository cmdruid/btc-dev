import { sign_segwit_tx, sign_taproot_tx }     from './lib/sign.js'
import { verify_segwit_tx, verify_taproot_tx } from './lib/verify.js'

export * from './lib/sign.js'
export * from './lib/utils.js'
export * from './lib/verify.js'

export default {
  segwit : {
    sign   : sign_segwit_tx,
    verify : verify_segwit_tx
  },
  taproot : {
    sign   : sign_taproot_tx,
    verify : verify_taproot_tx
  }
}
