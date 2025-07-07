import { Buff }            from '@vbyte/buff'
import { ECC }             from '@vbyte/micro-lib'
import { parse_tx }        from '@/lib/tx/parse.js'
import { SIGHASH_DEFAULT } from '@/const.js'
import { hash_segwit_tx }  from '@/lib/sighash/segwit.js'
import { hash_taproot_tx } from '@/lib/sighash/taproot.js'

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
  const sig  = ECC.get_ecdsa_sig(seckey, msg).hex
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
  const sig  = ECC.get_bip340_sig(seckey, msg).hex
  const flag = format_sigflag(options.sigflag ?? 0)
  return sig + flag
}

function format_sigflag (flag : number) {
  return (flag !== 0) ? Buff.num(flag, 1).hex : ''
}
