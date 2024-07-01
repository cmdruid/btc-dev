import { hash_segwit_tx }  from './lib/segwit.js'
import { hash_taproot_tx } from './lib/taproot.js'

export * from './lib/segwit.js'
export * from './lib/taproot.js'

export default {
  segwit  : hash_segwit_tx,
  taproot : hash_taproot_tx
}
