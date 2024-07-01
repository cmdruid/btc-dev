import { Buff, Bytes }    from '@cmdcode/buff'
import { noble }          from '@cmdcode/crypto-tools'
import { parse_vin_meta } from './utils.js'

import {
  hash_segwit_tx,
  hash_taproot_tx
} from '@/lib/sighash/index.js'

import {
  SignOptions,
  signer
} from '@cmdcode/crypto-tools'

import {
  SigHashOptions,
  TxBytes,
  TxData
} from '@/types/index.js'

export function sign_tx (
  seckey   : Bytes,
  txdata   : TxBytes | TxData,
  config  ?: SigHashOptions,
  options ?: SignOptions
) : Buff {
  const { type } = parse_vin_meta(txdata, config)
  if (type === 'p2tr') {
    return sign_taproot_tx(seckey, txdata, config, options)
  } else if (type.startsWith('p2w')) {
    return sign_segwit_tx(seckey, txdata, config)
  } else {
    throw new Error('This signer does not support the following output type: ' + type)
  }
}


export function sign_segwit_tx (
  seckey   : Bytes,
  txdata   : TxBytes | TxData,
  config   : SigHashOptions = {}
) : Buff {
  const { sigflag = 0x01 } = config
  const sec  = Buff.bytes(seckey)
  const hash = hash_segwit_tx(txdata, config)
  const sig  = noble.secp.sign(hash, sec).toDERRawBytes(true)
  return Buff.join([ sig, sigflag ])
}

export function sign_taproot_tx (
  seckey   : Bytes,
  txdata   : TxBytes | TxData,
  config   : SigHashOptions = {},
  options ?: SignOptions
) : Buff {
  // Set the signature flag type.
  const { sigflag = 0x00 } = config
  // Calculate the transaction hash.
  const hash = hash_taproot_tx(txdata, config)
  // Sign the transaction hash with secret key.
  const sig  = signer.sign_msg(hash, seckey, options)
  // Return the signature.
  return (sigflag === 0x00)
    ? Buff.raw(sig)
    : Buff.join([ sig, sigflag ])
}
