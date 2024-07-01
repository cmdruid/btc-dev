import { Buff, Stream }       from '@cmdcode/buff'
import { hash_segwit_tx }     from '@/lib/sighash/lib/segwit.js'
import { parse_txinput }      from '@/lib/sighash/lib/util.js'
import { parse_witness }      from '@/lib/witness/index.js'
import { parse_tx }           from '@/lib/tx/index.js'
import { get_script_ctx }     from '@/lib/script/index.js'
import { hash_taproot_tx }    from '@/lib/sighash/index.js'
import { parse_vin_meta }     from './utils.js'

import { SignOptions, noble, signer }    from '@cmdcode/crypto-tools'
import { encode_tapleaf, verify_cblock } from '@/lib/taproot/index.js'

import {
  SigHashOptions,
  TxBytes,
  TxData
} from '@/types/index.js'

export function verify_tx (
  txdata  : TxBytes | TxData,
  config ?: SigHashOptions
) : boolean {
  const { type } = parse_vin_meta(txdata, config)
  if (type === 'p2tr') {
    return verify_taproot_tx(txdata, config)
  } else if (type.startsWith('p2w')) {
    return verify_segwit_tx(txdata, config)
  } else {
    throw new Error('This signer does not support the following output type: ' + type)
  }
}

export function verify_segwit_tx (
  txdata  : TxBytes | TxData,
  options : SigHashOptions = {}
) : boolean {
  const tx = parse_tx(txdata)
  const txinput            = parse_txinput(tx, options)
  const { witness = [] }   = txinput
  const witness_data       = parse_witness(witness)

  let { pubkey, script } = options

  const { script: wit_script, params } = witness_data

  let pub : Buff | null = null

  if (params.length < 1) {
    throw new Error('Invalid witness data: ' + String(witness))
  }

  if (script === undefined && wit_script !== null) {
    script = wit_script
  }

  if (pubkey !== undefined) {
    pub = Buff.bytes(pubkey)
  } else if (params.length > 1) {
    const bytes = Buff.bytes(params[1])
    if (bytes.length === 33) pub = bytes
  }

  if (pub === null) {
    throw new Error('No pubkey provided!')
  }

  const rawsig    = Buff.bytes(params[0])
  const signature = rawsig.slice(0, -1)
  const sigflag   = rawsig.slice(-1)[0]

  const hash = hash_segwit_tx(tx, { ...options, sigflag })

  if (!noble.secp.verify(signature, hash, pub)) {
    throw new Error('Invalid signature!')
  }

  return true
}

export function verify_taproot_tx (
  txdata   : TxBytes | TxData,
  config   : SigHashOptions = {},
  options ?: SignOptions
) : boolean {
  const tx = parse_tx(txdata)
  // Parse the input we are signing from the config.
  const txinput = parse_txinput(tx, config)
  const { prevout, witness = [] } = txinput
  const witnessData = parse_witness(witness)
  const { cblock, script, params } = witnessData

  let pub : Buff

  if (params.length < 1) {
    throw new Error('Invalid witness data: ' + String(witness))
  }

  const { scriptPubKey } = prevout ?? {}

  if (scriptPubKey === undefined) {
    throw new Error('Prevout scriptPubKey is empty!')
  }

  const { type, key: tapkey } = get_script_ctx(scriptPubKey)

  if (
    type   !== 'p2tr'    ||
    tapkey === undefined ||
    tapkey.length !== 32
  ) {
    throw new Error('Prevout script is not a valid taproot output: ' + String(scriptPubKey))
  }

  if (
    cblock !== null &&
    script !== null
  ) {
    const version = Buff.hex(cblock)[0] & 0xfe
    const target  = encode_tapleaf(script, version)
    if (config.extension === undefined) {
      config.extension = target
    }
    if (!verify_cblock(tapkey, target, cblock)) {
      throw new Error('cblock verification failed!')
    }
  }

  if (config.pubkey !== undefined) {
    pub = Buff.bytes(config.pubkey)
  } else if (params.length > 1 && params[1].length === 32) {
    pub = Buff.bytes(params[1])
  } else {
    pub = Buff.bytes(tapkey)
  }

  const rawsig    = params[0]
  const stream    = new Stream(rawsig)
  const signature = stream.read(64).raw

  if (stream.size === 1) {
    config.sigflag = stream.read(1).num
    if (config.sigflag === 0x00) {
      throw new Error('0x00 is not a valid appended sigflag!')
    }
  }

  const hash = hash_taproot_tx(tx, config)

  return signer.verify_sig(signature, hash, pub, options)
}
