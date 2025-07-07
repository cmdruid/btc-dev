import { Bytes } from '@vbyte/buff'

import type {
  SigHashOptions,
  TxData
} from '@/types/index.js'

export function verify_tx (
  _txdata  : TxData | Bytes,
  _config  : SigHashOptions = {}
) : boolean {
  console.warn('verify_segwit_tx is not implemented')
  return true
}

// export function verify_signature (
//   txdata  : TxData | Bytes,
//   index   : number,
//   config  : HashConfig = {}
// ) : boolean {
//   const tx = Tx.fmt.toJson(txdata)
//   const { throws = false } = config
//   const { prevout, witness = [] } = tx.vin[index]
//   const witnessData = Tx.util.readWitness(witness)
//   const { cblock, script, params } = witnessData

//   let pub : Buff

//   if (params.length < 1) {
//     return safeThrow('Invalid witness data: ' + String(witness), throws)
//   }

//   const { scriptPubKey } = prevout ?? {}

//   if (scriptPubKey === undefined) {
//     return safeThrow('Prevout scriptPubKey is empty!', throws)
//   }

//   const { type, data: tapkey } = Tx.util.readScriptPubKey(scriptPubKey)

//   if (type !== 'p2tr') {
//     return safeThrow('Prevout script is not a valid taproot output:' + tapkey.hex, throws)
//   }

//   if (tapkey.length !== 32) {
//     return safeThrow('Invalid tapkey length: ' + String(tapkey.length), throws)
//   }

//   if (
//     cblock !== null &&
//     script !== null
//   ) {
//     const version    = cblock[0] & 0xfe
//     const target     = getTapLeaf(script, version)
//     config.extension = target

//     if (!checkPath(tapkey, target, cblock, { throws })) {
//       return safeThrow('cblock verification failed!', throws)
//     }
//   }

//   if (config.pubkey !== undefined) {
//     pub = Buff.bytes(config.pubkey)
//   } else if (params.length > 1 && params[1].length === 32) {
//     pub = Buff.bytes(params[1])
//   } else {
//     pub = Buff.bytes(tapkey)
//   }

//   const rawsig    = Script.fmt.toParam(params[0])
//   const stream    = new Stream(rawsig)
//   const signature = stream.read(64).raw

//   if (stream.size === 1) {
//     config.sigflag = stream.read(1).num
//     if (config.sigflag === 0x00) {
//       return safeThrow('0x00 is not a valid appended sigflag!', throws)
//     }
//   }

//   const hash = hashTx(tx, index, config)

//   if (!verify(signature, hash, pub, throws)) {
//     return safeThrow('Invalid signature!', throws)
//   }

//   return true
// }
