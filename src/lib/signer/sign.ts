import { ECC }             from '@vbyte/micro-lib'
import { parse_tx }        from '@/lib/tx/parse.js'
import { SIGHASH_DEFAULT } from '@/const.js'
import { hash_segwit_tx }  from '../sighash/segwit.js'
import { hash_taproot_tx } from '../sighash/taproot.js'
import { format_sigflag }  from '../sighash/util.js'

import type {
  SigHashOptions,
  TxData
} from '@/types/index.js'

export function sign_segwit_tx (
  seckey  : string,
  txdata  : TxData,
  options : SigHashOptions,
) {
  const tx   = parse_tx(txdata)
  const msg  = hash_segwit_tx(tx, options)
  const sig  = ECC.sign_ecdsa(seckey, msg).hex
  const flag = format_sigflag(options.sigflag ?? SIGHASH_DEFAULT)
  return sig + flag
}

export function sign_taproot_tx (
  seckey  : string,
  txdata  : TxData,
  options : SigHashOptions,
) {
  const tx   = parse_tx(txdata)
  const msg  = hash_taproot_tx(tx, options)
  const sig  = ECC.sign_bip340(seckey, msg).hex
  const flag = format_sigflag(options.sigflag ?? 0)
  return sig + flag
}
